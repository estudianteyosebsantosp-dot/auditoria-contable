export type Severity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export type FindingCategory =
  | 'PARTIDA_DOBLE'
  | 'DUPLICADOS'
  | 'CAMPOS_INCOMPLETOS'
  | 'FECHAS_INVALIDAS'
  | 'VALORES_ANOMALOS'
  | 'LEY_BENFORD';

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  rowNumber?: number;
  voucherNumber?: string;
  accountCode?: string;
  field?: string;
  detectedValue?: string | number;
  expectedValue?: string | number;
  reviewed: boolean;
  auditorNotes?: string;
  suggestedAction?: string;
  aiExplanation?: {
    title: string;
    rootCauseAnalysis: string;
    auditingRisk: string;
    howToFix: string;
    preventiveControl: string;
  };
}

export interface ColumnMapping {
  dateCol?: string;
  voucherCol?: string;
  accountCol?: string;
  descriptionCol?: string;
  debitCol?: string;
  creditCol?: string;
  amountCol?: string;
  thirdPartyCol?: string;
}

export interface RawRow {
  [key: string]: any;
  __rowNum?: number;
}

export interface BenfordDigitStat {
  digit: number;
  actualCount: number;
  actualPct: number;
  expectedPct: number;
  deviation: number;
}

export interface AIAuditAnalysis {
  executiveSummary: string;
  riskLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
  opinion: 'Favorable' | 'Con Salvedades' | 'Desfavorable' | 'Abstención';
  keyObservations: string[];
  materialityImpact: string;
  taxAndLegalImplications: string;
  actionPlan: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  adjustingEntriesRecommendation: string;
}

export interface AuditResult {
  id: string;
  auditDate: string;
  fileName: string;
  sheetName?: string;
  fileSize?: number;
  isDemo?: boolean;
  totalRows: number;
  totalDebit: number;
  totalCredit: number;
  discrepancy: number; // Debit - Credit
  isBalanced: boolean;
  healthScore: number; // 0 - 100%
  columnMapping: ColumnMapping;
  headers: string[];
  rows: RawRow[];
  findings: AuditFinding[];
  benfordStats: BenfordDigitStat[];
  vouchersCount: number;
  unbalancedVouchersCount: number;
  aiAnalysis?: AIAuditAnalysis;
  aiStatus: 'idle' | 'loading' | 'success' | 'unavailable' | 'error';
  aiErrorMessage?: string;
}

export interface AuditConfig {
  currency: string;
  currencySymbol: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  balanceTolerance: number;
  enableDoubleEntryCheck: boolean;
  enableDuplicatesCheck: boolean;
  enableMissingFieldsCheck: boolean;
  enableInvalidDatesCheck: boolean;
  enableOutlierCheck: boolean;
  enableRoundNumbersCheck: boolean;
  enableBenfordCheck: boolean;
  outlierSensitivity: 'baja' | 'media' | 'alta'; // Z-score threshold 3.5, 3.0, 2.5
  roundNumberThreshold: number; // e.g. 1000000
}
