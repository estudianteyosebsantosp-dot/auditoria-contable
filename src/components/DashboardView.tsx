import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FileDown,
  Upload,
  CheckCircle2,
  Clock,
  HelpCircle,
  BarChart,
} from 'lucide-react';
import { AuditConfig, AuditResult } from '../types/audit';

interface DashboardViewProps {
  audit: AuditResult;
  config: AuditConfig;
  onNavigate: (tab: string) => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
  onSelectAuditFromHistory?: (audit: AuditResult) => void;
  history: AuditResult[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  audit,
  config,
  onNavigate,
  onExportPDF,
  onExportExcel,
  onSelectAuditFromHistory,
  history,
}) => {
  const currency = config.currencySymbol || '$';

  // Finding counts by severity
  const criticalCount = audit.findings.filter((f) => f.severity === 'CRITICA').length;
  const highCount = audit.findings.filter((f) => f.severity === 'ALTA').length;
  const mediumCount = audit.findings.filter((f) => f.severity === 'MEDIA').length;
  const lowCount = audit.findings.filter((f) => f.severity === 'BAJA').length;

  // Category counts
  const categoryCounts = {
    PARTIDA_DOBLE: audit.findings.filter((f) => f.category === 'PARTIDA_DOBLE').length,
    DUPLICADOS: audit.findings.filter((f) => f.category === 'DUPLICADOS').length,
    VALORES_ANOMALOS: audit.findings.filter((f) => f.category === 'VALORES_ANOMALOS').length,
    CAMPOS_INCOMPLETOS: audit.findings.filter((f) => f.category === 'CAMPOS_INCOMPLETOS').length,
    FECHAS_INVALIDAS: audit.findings.filter((f) => f.category === 'FECHAS_INVALIDAS').length,
  };

  const getHealthBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Excelente Integridad',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        ringColor: '#10b981',
      };
    }
    if (score >= 65) {
      return {
        label: 'Riesgo Moderado',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        ringColor: '#f59e0b',
      };
    }
    return {
      label: 'Riesgo Crítico',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      ringColor: '#f43f5e',
    };
  };

  const healthBadge = getHealthBadge(audit.healthScore);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Demo Warning / Info Banner */}
      {audit.isDemo && (
        <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 border border-blue-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Visualizando Datos de Demostración</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-500/40">
                  Libro Modelo S.A.S.
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Este conjunto contiene ejemplos reales de descuadre contable, duplicidad de facturas y cuentas incompletas. Puedes cargar tus propios archivos Excel (.xlsx) o CSV cuando desees.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('upload')}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/30 shrink-0 flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Cargar Mi Archivo Real</span>
          </button>
        </div>
      )}

      {/* Hero Welcome & Quick Actions */}
      <div className="relative overflow-hidden bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Prominent Official Logo Badge */}
            <div className="h-24 sm:h-28 px-4 py-2 bg-white rounded-2xl shadow-2xl shadow-blue-900/40 border border-white/60 flex items-center justify-center shrink-0 hover:scale-[1.02] transition-transform">
              <img
                src="/assets/aistudio/Captura_de_pantalla_2026-10-21_logooooooooooo_56d6bd4a.png"
                alt="AUDITA WEB Logo Oficial"
                className="h-20 sm:h-24 w-auto object-contain"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Precisión contable, decisiones inteligentes</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Panel de Control de Auditoría
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Archivo activo:{' '}
                <span className="font-semibold text-slate-200">{audit.fileName}</span>
                {audit.sheetName && <span className="text-blue-400"> ({audit.sheetName})</span>} • Auditado el{' '}
                {new Date(audit.auditDate).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('upload')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Nueva Auditoría</span>
            </button>
            <button
              onClick={onExportPDF}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <FileDown className="w-4 h-4 text-rose-400" />
              <span>Informe PDF</span>
            </button>
            <button
              onClick={onExportExcel}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => onNavigate('ai')}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Dictamen IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Health Score */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg relative overflow-hidden transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salud Contable</span>
            <div className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${healthBadge.color}`}>
              {audit.healthScore}%
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{audit.healthScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100 pts</span>
          </div>
          <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${audit.healthScore}%`,
                backgroundColor: healthBadge.ringColor,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">{healthBadge.label}</p>
        </div>

        {/* Card 2: Double Entry Balance */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partida Doble</span>
            <Scale
              className={`w-4 h-4 ${audit.isBalanced ? 'text-emerald-400' : 'text-rose-400 animate-bounce'}`}
            />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-extrabold ${
                  audit.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currency} {Math.abs(audit.discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-400">descuadre</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Debe: {currency} {audit.totalDebit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span>Haber: {currency} {audit.totalCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Records & Vouchers */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registros Auditados</span>
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{audit.totalRows.toLocaleString()}</span>
            <span className="text-xs text-slate-400">filas contables</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
            <span>{audit.vouchersCount} comprobantes</span>
            <span className={audit.unbalancedVouchersCount > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
              {audit.unbalancedVouchersCount} descuadrados
            </span>
          </div>
        </div>

        {/* Card 4: Total Findings */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hallazgos Totales</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{audit.findings.length}</span>
            <span className="text-xs text-slate-400">alertas detectadas</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
              {criticalCount} Críticos
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {highCount} Altos
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
              {mediumCount + lowCount} Med/Baj
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Analytics & Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Category breakdown & Benford Forensic Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Finding Categories Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Distribución de Inconsistencias</h2>
                <p className="text-xs text-slate-400">Categorías de validación contable auditadas</p>
              </div>
              <button
                onClick={() => onNavigate('results')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  label: 'Partida Doble y Descuadres',
                  count: categoryCounts.PARTIDA_DOBLE,
                  desc: 'Diferencias entre débitos y créditos en libro general o asientos individuales',
                  color: 'bg-rose-500',
                  textColor: 'text-rose-400',
                },
                {
                  label: 'Registros Duplicados',
                  count: categoryCounts.DUPLICADOS,
                  desc: 'Mismo comprobante, fecha, cuenta o monto repetido',
                  color: 'bg-amber-500',
                  textColor: 'text-amber-400',
                },
                {
                  label: 'Valores Atípicos y Montos Redondos',
                  count: categoryCounts.VALORES_ANOMALOS,
                  desc: 'Transacciones con Z-score elevado, montos negativos o cifras redondas sospechosas',
                  color: 'bg-blue-500',
                  textColor: 'text-blue-400',
                },
                {
                  label: 'Cuentas y Campos Incompletos',
                  count: categoryCounts.CAMPOS_INCOMPLETOS,
                  desc: 'Filas sin código de cuenta PUC o sin concepto/justificación',
                  color: 'bg-purple-500',
                  textColor: 'text-purple-400',
                },
                {
                  label: 'Fechas Inválidas o Fuera de Ejercicio',
                  count: categoryCounts.FECHAS_INVALIDAS,
                  desc: 'Años futuros, formatos no estandarizados o periodos inconsistentes',
                  color: 'bg-indigo-500',
                  textColor: 'text-indigo-400',
                },
              ].map((cat, idx) => {
                const total = audit.findings.length || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={idx} className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200">{cat.label}</span>
                      <span className={`text-xs font-bold ${cat.textColor}`}>
                        {cat.count} {cat.count === 1 ? 'hallazgo' : 'hallazgos'} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{cat.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benford's Law Forensic Visualizer */}
          {audit.benfordStats && audit.benfordStats.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Auditoría Forense: Ley de Benford</h2>
                </div>
                <span className="text-xs text-slate-400">Distribución de Primer Dígito (1 al 9)</span>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Compara la frecuencia observada de los importes contables frente a la curva logarítmica natural de Benford ($P(d) = \log_{10}(1 + 1/d)$). Desviaciones drásticas pueden indicar fragmentación deliberada o manipulación de cifras.
              </p>

              <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
                {audit.benfordStats.map((item) => {
                  const maxVal = 40;
                  const actualHeight = Math.min(100, (item.actualPct / maxVal) * 100);
                  const expectedHeight = Math.min(100, (item.expectedPct / maxVal) * 100);
                  const isSevere = Math.abs(item.deviation) >= 10;

                  return (
                    <div key={item.digit} className="flex flex-col items-center">
                      <div className="h-28 w-full bg-slate-950/60 rounded-lg p-1 flex items-end justify-center gap-1 border border-slate-800 relative">
                        {/* Expected Benford bar (ghost) */}
                        <div
                          className="w-1.5 sm:w-2 bg-slate-600/60 rounded-t"
                          style={{ height: `${expectedHeight}%` }}
                          title={`Teórico Benford: ${item.expectedPct}%`}
                        />
                        {/* Actual Observed bar */}
                        <div
                          className={`w-2.5 sm:w-3 rounded-t transition-all ${
                            isSevere ? 'bg-rose-500' : 'bg-blue-500'
                          }`}
                          style={{ height: `${actualHeight}%` }}
                          title={`Observado en archivo: ${item.actualPct}% (Desv: ${item.deviation}%)`}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-300 mt-1.5">d={item.digit}</span>
                      <span className="text-[10px] text-slate-400">{item.actualPct}%</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
                  <span>Observado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-slate-600 rounded-sm" />
                  <span>Teórico Benford</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: AI Summary & Action Center */}
        <div className="space-y-6">
          {/* AI Executive Summary Card */}
          <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-purple-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dictamen de Inteligencia Artificial</h3>
              </div>
              {audit.aiAnalysis && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  {audit.aiAnalysis.opinion}
                </span>
              )}
            </div>

            {audit.aiAnalysis ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-200 leading-relaxed">
                  {audit.aiAnalysis.executiveSummary}
                </p>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-semibold text-purple-300 mb-1">
                    Acción Inmediata Prioritaria:
                  </div>
                  <p className="text-xs text-slate-300">
                    {audit.aiAnalysis.actionPlan?.[0]?.description ||
                      'Efectuar conciliación de los asientos con diferencia contable.'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('ai')}
                  className="w-full mt-2 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/30"
                >
                  <span>Ver Dictamen Completo y Plan de Acción</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-300">
                  Genera un dictamen ejecutivo con IA sobre este archivo para evaluar materialidad, riesgos fiscales y asientos de ajuste recomendados.
                </p>
                <button
                  onClick={() => onNavigate('ai')}
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Dictamen con Gemini</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Critical Findings List */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Alertas de Alta Prioridad</h3>
              <span className="text-xs text-slate-400">{criticalCount + highCount} requieren atención</span>
            </div>

            <div className="space-y-2.5">
              {audit.findings
                .filter((f) => f.severity === 'CRITICA' || f.severity === 'ALTA')
                .slice(0, 4)
                .map((f) => (
                  <div
                    key={f.id}
                    onClick={() => onNavigate('results')}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          f.severity === 'CRITICA'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {f.severity}
                      </span>
                      {f.rowNumber && <span className="text-[10px] text-slate-400">Fila #{f.rowNumber}</span>}
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1 group-hover:text-blue-400 transition">
                      {f.title}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{f.description}</p>
                  </div>
                ))}

              {audit.findings.length === 0 && (
                <div className="py-6 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <span>No se detectaron hallazgos críticos. Libro contable cuadrado.</span>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('results')}
              className="w-full mt-4 py-2 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Consultar todos los hallazgos ({audit.findings.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
