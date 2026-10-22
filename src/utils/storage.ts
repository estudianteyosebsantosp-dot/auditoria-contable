import { DEFAULT_AUDIT_CONFIG, SAMPLE_DATASETS } from '../data/sampleAudits';
import { AuditConfig, AuditResult } from '../types/audit';
import { detectColumnMapping, runAccountingAudit } from './auditEngine';

const STORAGE_KEYS = {
  AUDIT_HISTORY: 'audita_web_history_v1',
  CONFIG: 'audita_web_config_v1',
  CURRENT_AUDIT_ID: 'audita_web_current_id_v1',
};

export function loadStoredConfig(): AuditConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return { ...DEFAULT_AUDIT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Error loading config from localStorage:', e);
  }
  return DEFAULT_AUDIT_CONFIG;
}

export function saveStoredConfig(config: AuditConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving config to localStorage:', e);
  }
}

export function loadAuditHistory(): AuditResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_HISTORY);
    if (raw) {
      const parsed: AuditResult[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading audit history:', e);
  }

  // Pre-seed with the sample Libro Diario audit so the user has immediate insights
  const initialAudit = createSampleAudit(SAMPLE_DATASETS[0].id, loadStoredConfig());
  saveAuditToHistory(initialAudit);
  return [initialAudit];
}

export function saveAuditToHistory(audit: AuditResult): void {
  try {
    const history = loadAuditHistory();
    const existingIndex = history.findIndex((h) => h.id === audit.id);

    let updated: AuditResult[];
    if (existingIndex >= 0) {
      updated = [...history];
      updated[existingIndex] = audit;
    } else {
      updated = [audit, ...history].slice(0, 20); // Keep last 20 audits to avoid localStorage limits
    }

    localStorage.setItem(STORAGE_KEYS.AUDIT_HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving audit to history:', e);
  }
}

export function deleteAuditFromHistory(id: string): AuditResult[] {
  try {
    const history = loadAuditHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.AUDIT_HISTORY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn('Error deleting audit from history:', e);
    return [];
  }
}

export function clearAllAuditHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUDIT_HISTORY);
  } catch (e) {
    console.warn('Error clearing history:', e);
  }
}

export function createSampleAudit(datasetId: string, config: AuditConfig): AuditResult {
  const dataset = SAMPLE_DATASETS.find((d) => d.id === datasetId) || SAMPLE_DATASETS[0];
  const mapping = detectColumnMapping(dataset.headers);
  const audit = runAccountingAudit(
    dataset.rows,
    dataset.headers,
    mapping,
    config,
    dataset.fileName,
    'Libro Principal',
    true // isDemo
  );

  // Add rich pre-calculated executive summary for demo dataset
  audit.aiAnalysis = {
    executiveSummary:
      'Se evaluó el Libro Diario General de la entidad correspondiente a Julio 2026. Se identificó un descuadre crítico en el principio universal de partida doble por valor neto de $300.00, generado principalmente en el asiento contable #104. Adicionalmente, se detectó una doble imputación duplicada en honorarios y transacciones con montos redondos de alta cuantía sin desglose fiscal.',
    riskLevel: 'Alto',
    opinion: 'Con Salvedades',
    keyObservations: [
      'Violación de partida doble en asiento #104 (Diferencia de $300.00 entre débito y crédito).',
      'Duplicidad detectada en asiento #106 correspondiente a honorarios de asesoría.',
      'Imputación contable sin código en asiento #105 (Riesgo de omisión en cuentas de balance).',
      'Registro con fecha futura (año 2028) que distorsiona el periodo contable cerrado.',
    ],
    materialityImpact:
      'El impacto acumulado de las inconsistencias representa el 4.2% del volumen transaccional del periodo, superando el umbral de materialidad de auditoría preliminar.',
    taxAndLegalImplications:
      'La duplicación del gasto por honorarios podría generar una deducción indebida en el impuesto de renta ante la administración tributaria. Se requiere anulación inmediata de la nota duplicada.',
    actionPlan: [
      {
        step: 1,
        title: 'Asiento de Ajuste por Descuadre en Asiento #104',
        description: 'Revisar el extracto bancario de débitos automáticos y registrar el crédito faltante por $300.00 en la cuenta 111005.',
      },
      {
        step: 2,
        title: 'Anulación de Registro Duplicado #106',
        description: 'Reversar la segunda línea de honorarios por $3,200.00 que se duplicó en el sistema.',
      },
      {
        step: 3,
        title: 'Clasificación de Cuenta Huérfana #105',
        description: 'Identificar al cliente emisor del anticipo de $2,500.00 y asignar la subcuenta contable correspondiente.',
      },
    ],
    adjustingEntriesRecommendation:
      'Débito a Gastos Bancarios / Ajustes de Ejercicios Anteriores y Crédito a Bancos por $300.00; Reverso de asiento #106 por $3,200.00.',
  };
  audit.aiStatus = 'success';

  return audit;
}
