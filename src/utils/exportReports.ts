import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AuditConfig, AuditResult } from '../types/audit';

export function exportAuditToPDF(audit: AuditResult, config: AuditConfig) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = config.currencySymbol || '$';
  const primaryColor: [number, number, number] = [10, 31, 84]; // Dark Navy #0a1f54
  const accentColor: [number, number, number] = [0, 102, 255]; // Electric Blue #0066ff
  const slateDark: [number, number, number] = [30, 41, 59];

  // Header background bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  // Title in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDITA WEB', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text('PRECISIÓN CONTABLE, DECISIONES INTELIGENTES', 14, 20);

  // Right-aligned report label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INFORME OFICIAL DE AUDITORÍA', 196, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 220, 255);
  doc.text(`Ref: ${audit.id.toUpperCase()}`, 196, 20, { align: 'right' });

  let y = 36;

  // Metadata Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('1. INFORMACIÓN GENERAL DE LA AUDITORÍA', 14, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
    body: [
      [
        { content: 'Archivo Analizado:', styles: { fontStyle: 'bold' } },
        audit.fileName + (audit.sheetName ? ` [Hoja: ${audit.sheetName}]` : ''),
        { content: 'Fecha de Emisión:', styles: { fontStyle: 'bold' } },
        new Date(audit.auditDate).toLocaleString('es-ES'),
      ],
      [
        { content: 'Registros Procesados:', styles: { fontStyle: 'bold' } },
        `${audit.totalRows.toLocaleString()} líneas contables`,
        { content: 'Índice Salud Contable:', styles: { fontStyle: 'bold' } },
        `${audit.healthScore}% / 100%`,
      ],
      [
        { content: 'Tipo de Auditoría:', styles: { fontStyle: 'bold' } },
        audit.isDemo ? 'Demostración de Control' : 'Auditoría Regular de Archivo',
        { content: 'Estado Partida Doble:', styles: { fontStyle: 'bold' } },
        audit.isBalanced ? 'CONFORME (Cuadrado)' : 'DESCUADRADO (Requiere Ajuste)',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Financial Balance Block (Partida Doble)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text('2. BALANZA Y CONTROL DE PARTIDA DOBLE', 14, y);
  y += 5;

  const diffText = `${currency} ${audit.discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    headStyles: { fillColor: [40, 50, 75], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, halign: 'center' },
    head: [['Total Débitos (Debe)', 'Total Créditos (Haber)', 'Diferencia de Cuadre', 'Dictamen Cuadre']],
    body: [
      [
        `${currency} ${audit.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `${currency} ${audit.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        diffText,
        audit.isBalanced ? 'CUADRADO (0.00)' : 'DESCUADRADO',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // AI Executive Opinion (if available)
  if (audit.aiAnalysis) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.text('3. DICTAMEN EJECUTIVO Y ANÁLISIS DE RIESGO (AUDITA AI)', 14, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...slateDark);

    const splitSummary = doc.splitTextToSize(
      `Opinión: ${audit.aiAnalysis.opinion} | Nivel de Riesgo: ${audit.aiAnalysis.riskLevel}\n\n${audit.aiAnalysis.executiveSummary}\n\nImpacto en Materialidad: ${audit.aiAnalysis.materialityImpact}`,
      182
    );
    doc.text(splitSummary, 14, y);
    y += splitSummary.length * 4 + 4;
  }

  // Findings Section
  if (y > 230) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text(`4. DETALLE DE HALLAZGOS Y ALERTAS DETECTADAS (${audit.findings.length})`, 14, y);
  y += 5;

  if (audit.findings.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(22, 101, 52);
    doc.text('No se detectaron inconsistencias en las reglas contables evaluadas.', 14, y + 5);
  } else {
    const findingsRows = audit.findings.map((f, i) => [
      `#${i + 1}`,
      f.severity,
      f.category.replace(/_/g, ' '),
      f.rowNumber ? `Fila ${f.rowNumber}` : (f.voucherNumber ? `Asiento ${f.voucherNumber}` : 'Global'),
      f.title + '\n' + f.description,
      f.suggestedAction || 'Verificar comprobante',
    ]);

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 70 },
        5: { cellWidth: 40 },
      },
      head: [['ID', 'Severidad', 'Categoría', 'Ubicación', 'Hallazgo Observado', 'Acción Sugerida']],
      body: findingsRows,
    });
  }

  // Page numbering and footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 130, 145);
    doc.text(
      'AUDITA WEB - Sistema Profesional de Auditoría Contable y Financiera con Inteligencia Artificial. Documento de estricta confidencialidad.',
      14,
      290
    );
    doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
  }

  const safeName = audit.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`AUDITA_WEB_Informe_${safeName}_${Date.now()}.pdf`);
}

export function exportAuditToExcel(audit: AuditResult, config: AuditConfig) {
  const wb = XLSX.utils.book_new();

  // 1. Resumen Worksheet
  const summaryData = [
    ['AUDITA WEB - INFORME OFICIAL DE AUDITORÍA CONTABLE'],
    ['Tu aliado en una auditoría contable más inteligente'],
    [''],
    ['DATOS GENERALES DE LA AUDITORÍA'],
    ['ID de Auditoría', audit.id],
    ['Archivo Analizado', audit.fileName],
    ['Hoja Seleccionada', audit.sheetName || 'Principal'],
    ['Fecha de Ejecución', new Date(audit.auditDate).toLocaleString('es-ES')],
    ['Registros Evaluados', audit.totalRows],
    ['Índice de Salud Contable', `${audit.healthScore}%`],
    [''],
    ['CONTROL DE PARTIDA DOBLE'],
    ['Total Débitos (Debe)', audit.totalDebit],
    ['Total Créditos (Haber)', audit.totalCredit],
    ['Descuadre / Diferencia', audit.discrepancy],
    ['Estado de Balanza', audit.isBalanced ? 'CUADRADO' : 'DESCUADRADO'],
    ['Comprobantes Evaluados', audit.vouchersCount],
    ['Comprobantes Descuadrados', audit.unbalancedVouchersCount],
    [''],
    ['TOTAL HALLAZGOS', audit.findings.length],
    ['Críticos', audit.findings.filter((f) => f.severity === 'CRITICA').length],
    ['Altos', audit.findings.filter((f) => f.severity === 'ALTA').length],
    ['Medios', audit.findings.filter((f) => f.severity === 'MEDIA').length],
    ['Bajos', audit.findings.filter((f) => f.severity === 'BAJA').length],
  ];

  if (audit.aiAnalysis) {
    summaryData.push(
      [''],
      ['EVALUACIÓN DE INTELIGENCIA ARTIFICIAL'],
      ['Dictamen / Opinión', audit.aiAnalysis.opinion],
      ['Nivel de Riesgo', audit.aiAnalysis.riskLevel],
      ['Resumen Ejecutivo', audit.aiAnalysis.executiveSummary],
      ['Impacto de Materialidad', audit.aiAnalysis.materialityImpact],
      ['Implicaciones Fiscales', audit.aiAnalysis.taxAndLegalImplications]
    );
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Auditoría');

  // 2. Hallazgos Worksheet
  const findingsHeaders = [
    'ID',
    'Severidad',
    'Categoría',
    'Fila',
    'Asiento/Comprobante',
    'Campo Afectado',
    'Título del Hallazgo',
    'Descripción Detallada',
    'Valor Detectado',
    'Valor Esperado',
    'Acción Sugerida',
    'Estado Revisión',
  ];

  const findingsRows = audit.findings.map((f) => [
    f.id,
    f.severity,
    f.category,
    f.rowNumber || '',
    f.voucherNumber || '',
    f.field || '',
    f.title,
    f.description,
    String(f.detectedValue ?? ''),
    String(f.expectedValue ?? ''),
    f.suggestedAction || '',
    f.reviewed ? 'REVISADO' : 'PENDIENTE',
  ]);

  const wsFindings = XLSX.utils.aoa_to_sheet([findingsHeaders, ...findingsRows]);
  XLSX.utils.book_append_sheet(wb, wsFindings, 'Hallazgos Detectados');

  // 3. Raw Data Worksheet
  if (audit.rows && audit.rows.length > 0) {
    const wsRaw = XLSX.utils.json_to_sheet(audit.rows);
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Datos Auditados');
  }

  // 4. Benford's Law Worksheet
  if (audit.benfordStats && audit.benfordStats.length > 0) {
    const benfordRows = [
      ['Dígito (1-9)', 'Conteo Observado', '% Observado', '% Teórico Esperado (Benford)', 'Desviación (%)'],
      ...audit.benfordStats.map((b) => [
        b.digit,
        b.actualCount,
        b.actualPct,
        b.expectedPct,
        b.deviation,
      ]),
    ];
    const wsBenford = XLSX.utils.aoa_to_sheet(benfordRows);
    XLSX.utils.book_append_sheet(wb, wsBenford, 'Análisis Forense Benford');
  }

  const safeName = audit.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `AUDITA_WEB_Auditoria_${safeName}_${Date.now()}.xlsx`);
}

export function exportAuditToCSV(audit: AuditResult) {
  const headers = [
    'ID',
    'Severidad',
    'Categoria',
    'Fila',
    'Asiento',
    'Campo',
    'Titulo',
    'Descripcion',
    'Valor_Detectado',
    'Valor_Esperado',
    'Accion_Sugerida',
    'Revisado',
  ];

  const rows = audit.findings.map((f) => [
    f.id,
    f.severity,
    f.category,
    f.rowNumber || '',
    f.voucherNumber || '',
    f.field || '',
    `"${(f.title || '').replace(/"/g, '""')}"`,
    `"${(f.description || '').replace(/"/g, '""')}"`,
    `"${String(f.detectedValue ?? '').replace(/"/g, '""')}"`,
    `"${String(f.expectedValue ?? '').replace(/"/g, '""')}"`,
    `"${(f.suggestedAction || '').replace(/"/g, '""')}"`,
    f.reviewed ? 'SI' : 'NO',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = audit.fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `AUDITA_WEB_Hallazgos_${safeName}_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
