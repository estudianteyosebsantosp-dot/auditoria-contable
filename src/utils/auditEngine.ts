import {
  AuditConfig,
  AuditFinding,
  AuditResult,
  BenfordDigitStat,
  ColumnMapping,
  RawRow,
} from '../types/audit';

// Helper to sanitize and parse numbers from accounting strings/cells
export function parseAccountingNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }

  let str = String(val).trim();
  if (!str) return 0;

  // Handle accounting parentheses for negatives: (1,250.00) -> -1250.00
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  }

  // Remove currency symbols, spaces, non-numeric characters except commas and dots
  str = str.replace(/[^0-9.,]/g, '');
  if (!str) return 0;

  // Determine decimal separator
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      // European format: 1.250,50
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,250.50
      str = str.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // Could be 1250,50 or 1,250
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      str = parts[0] + '.' + parts[1];
    } else {
      str = str.replace(/,/g, '');
    }
  }

  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return isNegative ? -Math.abs(parsed) : parsed;
}

// Helper to detect columns automatically based on typical Spanish/English accounting headers
export function detectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    lower: h.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  }));

  for (const { original, lower } of normalizedHeaders) {
    // Date
    if (!mapping.dateCol && /^(fecha|date|fec|fecha_contable|periodo|dia)/i.test(lower)) {
      mapping.dateCol = original;
    }
    // Voucher / Asiento
    else if (!mapping.voucherCol && /(comprobante|asiento|folio|voucher|no_asiento|nro_asiento|poliza|doc)/i.test(lower)) {
      mapping.voucherCol = original;
    }
    // Account Code
    else if (!mapping.accountCol && /(cuenta|cod_cuenta|codigo|codigo_contable|account|puc|cta)/i.test(lower)) {
      mapping.accountCol = original;
    }
    // Description
    else if (!mapping.descriptionCol && /(concepto|descripcion|detalle|glosa|description|memo|referencia)/i.test(lower)) {
      mapping.descriptionCol = original;
    }
    // Debit
    else if (!mapping.debitCol && /(debito|debe|debitos|ingreso|cargos|debit|cargo)/i.test(lower)) {
      mapping.debitCol = original;
    }
    // Credit
    else if (!mapping.creditCol && /(credito|haber|creditos|egreso|abonos|credit|abono)/i.test(lower)) {
      mapping.creditCol = original;
    }
    // Amount / Value
    else if (!mapping.amountCol && /(monto|valor|importe|saldo|total|amount|balance)/i.test(lower)) {
      mapping.amountCol = original;
    }
    // Third party / Entity
    else if (!mapping.thirdPartyCol && /(tercero|beneficiario|nit|rut|ruc|cliente|proveedor|razon_social|nombre)/i.test(lower)) {
      mapping.thirdPartyCol = original;
    }
  }

  return mapping;
}

// Benford's Law ideal percentages for digit 1 to 9
const BENFORD_EXPECTED: { [digit: number]: number } = {
  1: 30.1,
  2: 17.6,
  3: 12.5,
  4: 9.7,
  5: 7.9,
  6: 6.7,
  7: 5.8,
  8: 5.1,
  9: 4.6,
};

export function calculateBenfordStats(amounts: number[]): BenfordDigitStat[] {
  const digitCounts: { [d: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let validCount = 0;

  for (const amt of amounts) {
    const abs = Math.abs(amt);
    if (abs > 0) {
      const firstChar = abs.toString().replace(/[^1-9]/g, '')[0];
      if (firstChar) {
        const digit = parseInt(firstChar, 10);
        if (digit >= 1 && digit <= 9) {
          digitCounts[digit]++;
          validCount++;
        }
      }
    }
  }

  const results: BenfordDigitStat[] = [];
  for (let d = 1; d <= 9; d++) {
    const count = digitCounts[d];
    const actualPct = validCount > 0 ? (count / validCount) * 100 : 0;
    const expectedPct = BENFORD_EXPECTED[d];
    const deviation = actualPct - expectedPct;

    results.push({
      digit: d,
      actualCount: count,
      actualPct: Number(actualPct.toFixed(1)),
      expectedPct,
      deviation: Number(deviation.toFixed(1)),
    });
  }

  return results;
}

export function runAccountingAudit(
  rows: RawRow[],
  headers: string[],
  mapping: ColumnMapping,
  config: AuditConfig,
  fileName: string,
  sheetName?: string,
  isDemo: boolean = false
): AuditResult {
  const findings: AuditFinding[] = [];
  let totalDebit = 0;
  let totalCredit = 0;
  const amountsForStats: number[] = [];
  const voucherGroups = new Map<string, { debits: number; credits: number; rows: number[] }>();
  const duplicateSignatureMap = new Map<string, number[]>();

  const hasDebitCol = Boolean(mapping.debitCol);
  const hasCreditCol = Boolean(mapping.creditCol);
  const hasAmountCol = Boolean(mapping.amountCol);

  // 1. Process rows and collect data
  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    row.__rowNum = rowNum;

    let rowDebit = 0;
    let rowCredit = 0;

    if (hasDebitCol && mapping.debitCol) {
      rowDebit = parseAccountingNumber(row[mapping.debitCol]);
    }
    if (hasCreditCol && mapping.creditCol) {
      rowCredit = parseAccountingNumber(row[mapping.creditCol]);
    }
    if (!hasDebitCol && !hasCreditCol && hasAmountCol && mapping.amountCol) {
      const amt = parseAccountingNumber(row[mapping.amountCol]);
      if (amt >= 0) rowDebit = amt;
      else rowCredit = Math.abs(amt);
    }

    totalDebit += rowDebit;
    totalCredit += rowCredit;

    if (rowDebit > 0) amountsForStats.push(rowDebit);
    if (rowCredit > 0) amountsForStats.push(rowCredit);

    // Negative debit or credit check
    if (config.enableOutlierCheck) {
      if (hasDebitCol && mapping.debitCol && row[mapping.debitCol] !== undefined) {
        const rawDebit = parseAccountingNumber(row[mapping.debitCol]);
        if (rawDebit < 0) {
          findings.push({
            id: `neg-deb-${rowNum}`,
            category: 'VALORES_ANOMALOS',
            severity: 'MEDIA',
            title: `Débito con signo negativo en Fila #${rowNum}`,
            description: `Se detectó un valor negativo (${rawDebit}) en la columna de débitos. Las buenas prácticas contables exigen registrar contracuenta en el crédito en vez de valores negativos.`,
            rowNumber: rowNum,
            field: mapping.debitCol,
            detectedValue: rawDebit,
            expectedValue: 'Monto mayor o igual a cero',
            reviewed: false,
            suggestedAction: 'Verificar si corresponde a una reclasificación o anulación y registrar en el haber.',
          });
        }
      }

      if (hasCreditCol && mapping.creditCol && row[mapping.creditCol] !== undefined) {
        const rawCredit = parseAccountingNumber(row[mapping.creditCol]);
        if (rawCredit < 0) {
          findings.push({
            id: `neg-cred-${rowNum}`,
            category: 'VALORES_ANOMALOS',
            severity: 'MEDIA',
            title: `Crédito con signo negativo en Fila #${rowNum}`,
            description: `Se detectó un valor negativo (${rawCredit}) en la columna de créditos. En el registro contable tradicional, esto distorsiona los saldos acumulados de la balanza.`,
            rowNumber: rowNum,
            field: mapping.creditCol,
            detectedValue: rawCredit,
            expectedValue: 'Monto mayor o igual a cero',
            reviewed: false,
            suggestedAction: 'Reclasificar la partida en la columna de débito.',
          });
        }
      }
    }

    // Voucher grouping
    if (mapping.voucherCol && row[mapping.voucherCol] !== undefined && row[mapping.voucherCol] !== '') {
      const vKey = String(row[mapping.voucherCol]).trim();
      if (!voucherGroups.has(vKey)) {
        voucherGroups.set(vKey, { debits: 0, credits: 0, rows: [] });
      }
      const g = voucherGroups.get(vKey)!;
      g.debits += rowDebit;
      g.credits += rowCredit;
      g.rows.push(rowNum);
    }

    // Missing fields check
    if (config.enableMissingFieldsCheck) {
      if (mapping.accountCol) {
        const accVal = row[mapping.accountCol];
        if (accVal === null || accVal === undefined || String(accVal).trim() === '') {
          findings.push({
            id: `empty-acc-${rowNum}`,
            category: 'CAMPOS_INCOMPLETOS',
            severity: 'ALTA',
            title: `Registro sin Código de Cuenta en Fila #${rowNum}`,
            description: `El asiento no posee especificado el código contable de imputación (PUC/Catálogo).`,
            rowNumber: rowNum,
            field: mapping.accountCol,
            detectedValue: '[Vacío/Nulo]',
            expectedValue: 'Código de cuenta válido (ej: 110505)',
            reviewed: false,
            suggestedAction: 'Asignar la cuenta contable correspondiente según el catálogo oficial.',
          });
        }
      }

      if (mapping.descriptionCol) {
        const descVal = row[mapping.descriptionCol];
        if (descVal === null || descVal === undefined || String(descVal).trim() === '') {
          findings.push({
            id: `empty-desc-${rowNum}`,
            category: 'CAMPOS_INCOMPLETOS',
            severity: 'BAJA',
            title: `Glosa o Concepto Vacío en Fila #${rowNum}`,
            description: `La transacción carece de descripción explicativa o soporte del hecho económico.`,
            rowNumber: rowNum,
            field: mapping.descriptionCol,
            detectedValue: '[Vacío]',
            expectedValue: 'Concepto explicativo del movimiento',
            reviewed: false,
            suggestedAction: 'Incorporar la justificación o detalle de la operación.',
          });
        }
      }
    }

    // Date validity check
    if (config.enableInvalidDatesCheck && mapping.dateCol) {
      const dateVal = row[mapping.dateCol];
      if (dateVal !== null && dateVal !== undefined && String(dateVal).trim() !== '') {
        const dateStr = String(dateVal).trim();
        const parsedDate = new Date(dateStr);
        const currentYear = new Date().getFullYear();

        if (isNaN(parsedDate.getTime())) {
          // Check if it's an Excel serial date number
          const num = Number(dateVal);
          if (isNaN(num) || num < 1000 || num > 60000) {
            findings.push({
              id: `invalid-date-${rowNum}`,
              category: 'FECHAS_INVALIDAS',
              severity: 'MEDIA',
              title: `Formato de Fecha Inválido en Fila #${rowNum}`,
              description: `El valor "${dateVal}" no pudo ser interpretado como una fecha contable válida.`,
              rowNumber: rowNum,
              field: mapping.dateCol,
              detectedValue: String(dateVal),
              expectedValue: 'Fecha válida (DD/MM/YYYY)',
              reviewed: false,
              suggestedAction: 'Estandarizar el formato de fecha.',
            });
          }
        } else {
          const yr = parsedDate.getFullYear();
          if (yr > currentYear + 1) {
            findings.push({
              id: `future-date-${rowNum}`,
              category: 'FECHAS_INVALIDAS',
              severity: 'ALTA',
              title: `Fecha Futura Inconsistente en Fila #${rowNum}`,
              description: `La fecha registrada (${dateStr}) corresponde a un ejercicio fiscal futuro (${yr}).`,
              rowNumber: rowNum,
              field: mapping.dateCol,
              detectedValue: dateStr,
              expectedValue: `Ejercicio fiscal actual o anterior (<= ${currentYear})`,
              reviewed: false,
              suggestedAction: 'Corregir el año de contabilización para evitar distorsión en el periodo contable.',
            });
          } else if (yr < 1990) {
            findings.push({
              id: `old-date-${rowNum}`,
              category: 'FECHAS_INVALIDAS',
              severity: 'MEDIA',
              title: `Fecha Extemporánea Anómala en Fila #${rowNum}`,
              description: `La fecha (${dateStr}) indica el año ${yr}, previo a registros históricos válidos.`,
              rowNumber: rowNum,
              field: mapping.dateCol,
              detectedValue: dateStr,
              expectedValue: 'Fecha dentro del rango contable activo',
              reviewed: false,
              suggestedAction: 'Comprobar si hubo un error de digitación en el año.',
            });
          }
        }
      }
    }

    // Duplicates Signature
    if (config.enableDuplicatesCheck) {
      // Signature based on key fields
      const dateSig = mapping.dateCol ? String(row[mapping.dateCol] || '') : '';
      const voucherSig = mapping.voucherCol ? String(row[mapping.voucherCol] || '') : '';
      const accSig = mapping.accountCol ? String(row[mapping.accountCol] || '') : '';
      const amtSig = `${rowDebit}-${rowCredit}`;
      const descSig = mapping.descriptionCol ? String(row[mapping.descriptionCol] || '').trim().toLowerCase() : '';

      const signature = `${voucherSig}|${dateSig}|${accSig}|${amtSig}|${descSig}`;
      if (!duplicateSignatureMap.has(signature)) {
        duplicateSignatureMap.set(signature, [rowNum]);
      } else {
        duplicateSignatureMap.get(signature)!.push(rowNum);
      }
    }

    // Round number check
    if (config.enableRoundNumbersCheck) {
      const maxAmt = Math.max(rowDebit, rowCredit);
      if (maxAmt >= config.roundNumberThreshold && maxAmt % 10000 === 0) {
        findings.push({
          id: `round-amt-${rowNum}`,
          category: 'VALORES_ANOMALOS',
          severity: 'BAJA',
          title: `Monto Exactamente Redondo en Fila #${rowNum}`,
          description: `El valor de ${maxAmt.toLocaleString()} representa una cifra redonda notablemente alta, lo cual suele ser objeto de revisión por riesgo de provisiones no documentadas o redondeos fiscales.`,
          rowNumber: rowNum,
          field: rowDebit > 0 ? mapping.debitCol : mapping.creditCol,
          detectedValue: maxAmt,
          expectedValue: 'Monto con desglose de impuestos o decimales',
          reviewed: false,
          suggestedAction: 'Verificar facturas comerciales que soporten el monto exacto sin centavos.',
        });
      }
    }
  });

  // 2. Global Double Entry Check (Partida Doble)
  const discrepancy = Number((totalDebit - totalCredit).toFixed(2));
  const isBalanced = Math.abs(discrepancy) <= config.balanceTolerance;

  if (config.enableDoubleEntryCheck && (hasDebitCol || hasCreditCol)) {
    if (!isBalanced) {
      findings.unshift({
        id: 'global-imbalance',
        category: 'PARTIDA_DOBLE',
        severity: 'CRITICA',
        title: 'Descuadre General en Balance de Partida Doble',
        description: `La sumatoria total de Débitos (${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) no coincide con los Créditos (${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). Existe una diferencia neta no conciliada de ${discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        detectedValue: `Diferencia: ${discrepancy}`,
        expectedValue: 'Diferencia = 0.00 (Débitos = Créditos)',
        reviewed: false,
        suggestedAction: 'Identificar el asiento unilateral descompensado e incorporar la contrapartida contable requerida.',
      });
    }
  }

  // 3. Per-Voucher Imbalance Check
  let unbalancedVouchersCount = 0;
  if (config.enableDoubleEntryCheck && voucherGroups.size > 0) {
    voucherGroups.forEach((val, voucherId) => {
      const diff = Number((val.debits - val.credits).toFixed(2));
      if (Math.abs(diff) > config.balanceTolerance) {
        unbalancedVouchersCount++;
        findings.push({
          id: `voucher-imbalance-${voucherId}`,
          category: 'PARTIDA_DOBLE',
          severity: 'ALTA',
          title: `Comprobante #${voucherId} Descuadrado`,
          description: `El asiento contable #${voucherId} (filas: ${val.rows.join(', ')}) presenta Débitos por ${val.debits.toFixed(2)} y Créditos por ${val.credits.toFixed(2)}, con un desfase de ${diff.toFixed(2)}.`,
          voucherNumber: voucherId,
          detectedValue: `Descuadre: ${diff.toFixed(2)}`,
          expectedValue: '0.00',
          reviewed: false,
          suggestedAction: `Revisar los registros en las filas ${val.rows.join(', ')} y ajustar la cuenta desbalanceada.`,
        });
      }
    });
  }

  // 4. Duplicate Findings Processing
  if (config.enableDuplicatesCheck) {
    duplicateSignatureMap.forEach((matchedRows, _sig) => {
      if (matchedRows.length > 1) {
        findings.push({
          id: `dup-${matchedRows.join('-')}`,
          category: 'DUPLICADOS',
          severity: 'ALTA',
          title: `Registros Contables Duplicados (${matchedRows.length} ocurrencias)`,
          description: `Se detectaron registros idénticos en las filas [${matchedRows.join(', ')}] con mismos valores contables, fechas e imputaciones.`,
          rowNumber: matchedRows[1],
          detectedValue: `${matchedRows.length} repeticiones idénticas`,
          expectedValue: 'Registro único sin duplicidad',
          reviewed: false,
          suggestedAction: 'Verificar si se trata de una doble contabilización o anular el duplicado erróneo.',
        });
      }
    });
  }

  // 5. Statistical Outlier Detection (Z-Score on transaction values)
  if (config.enableOutlierCheck && amountsForStats.length >= 5) {
    const n = amountsForStats.length;
    const mean = amountsForStats.reduce((a, b) => a + b, 0) / n;
    const variance = amountsForStats.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    const zThreshold =
      config.outlierSensitivity === 'alta' ? 2.5 : config.outlierSensitivity === 'baja' ? 3.5 : 3.0;

    if (stdDev > 0) {
      rows.forEach((row, idx) => {
        const rowNum = idx + 1;
        let val = 0;
        if (mapping.debitCol && row[mapping.debitCol]) {
          val = Math.max(val, parseAccountingNumber(row[mapping.debitCol]));
        }
        if (mapping.creditCol && row[mapping.creditCol]) {
          val = Math.max(val, parseAccountingNumber(row[mapping.creditCol]));
        }

        if (val > 0) {
          const zScore = (val - mean) / stdDev;
          if (zScore > zThreshold) {
            findings.push({
              id: `outlier-${rowNum}`,
              category: 'VALORES_ANOMALOS',
              severity: 'MEDIA',
              title: `Transacción con Importe Anómalo (Outlier) en Fila #${rowNum}`,
              description: `El valor de ${val.toLocaleString()} se desvía drásticamente del promedio del libro contable (Media: ${mean.toLocaleString(undefined, { maximumFractionDigits: 0 })}, Z-Score: ${zScore.toFixed(2)}).`,
              rowNumber: rowNum,
              detectedValue: val,
              expectedValue: `< ${(mean + zThreshold * stdDev).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              reviewed: false,
              suggestedAction: 'Examinar los contratos, actas o facturas que justifiquen este monto atípico.',
            });
          }
        }
      });
    }
  }

  // 6. Benford Analysis
  const benfordStats = calculateBenfordStats(amountsForStats);
  if (config.enableBenfordCheck && amountsForStats.length >= 30) {
    // Check if any digit has massive deviation (> 12% difference)
    const severeDeviation = benfordStats.find((s) => Math.abs(s.deviation) > 12);
    if (severeDeviation) {
      findings.push({
        id: 'benford-anomaly',
        category: 'LEY_BENFORD',
        severity: 'BAJA',
        title: `Desviación Estadística Forense (Ley de Benford en Dígito ${severeDeviation.digit})`,
        description: `La frecuencia de transacciones que inician con el dígito "${severeDeviation.digit}" es del ${severeDeviation.actualPct}%, desviándose ${(severeDeviation.deviation > 0 ? '+' : '')}${severeDeviation.deviation}% del patrón natural esperado (${severeDeviation.expectedPct}%).`,
        detectedValue: `${severeDeviation.actualPct}% observado`,
        expectedValue: `${severeDeviation.expectedPct}% teórico`,
        reviewed: false,
        suggestedAction: 'Efectuar muestreo aleatorio en transacciones con primer dígito repetitivo para descartar fragmentación artificial.',
      });
    }
  }

  // 7. Calculate Audit Health Score (0 - 100)
  let penalty = 0;
  findings.forEach((f) => {
    switch (f.severity) {
      case 'CRITICA':
        penalty += 25;
        break;
      case 'ALTA':
        penalty += 12;
        break;
      case 'MEDIA':
        penalty += 5;
        break;
      case 'BAJA':
        penalty += 2;
        break;
    }
  });

  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    auditDate: new Date().toISOString(),
    fileName,
    sheetName,
    isDemo,
    totalRows: rows.length,
    totalDebit: Number(totalDebit.toFixed(2)),
    totalCredit: Number(totalCredit.toFixed(2)),
    discrepancy,
    isBalanced,
    healthScore,
    columnMapping: mapping,
    headers,
    rows,
    findings,
    benfordStats,
    vouchersCount: voucherGroups.size,
    unbalancedVouchersCount,
    aiStatus: 'idle',
  };
}
