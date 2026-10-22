import React from 'react';
import {
  History,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Calendar,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { AuditConfig, AuditResult } from '../types/audit';

interface HistoryViewProps {
  history: AuditResult[];
  activeAuditId: string;
  config: AuditConfig;
  onSelectAudit: (audit: AuditResult) => void;
  onDeleteAudit: (auditId: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  activeAuditId,
  config,
  onSelectAudit,
  onDeleteAudit,
  onClearAll,
}) => {
  const currency = config.currencySymbol || '$';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Historial de Auditorías Realizadas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consulta y reabre los informes de revisiones contables procesadas en esta estación de trabajo.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Historial</span>
          </button>
        )}
      </div>

      {/* Storage Architecture Explanation Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-white">Almacenamiento Local del Navegador (Offline-First)</div>
          <p className="text-slate-400 leading-relaxed">
            Las auditorías se guardan de forma privada y encriptada en el almacenamiento local de tu navegador para máxima confidencialidad contable. Tus datos nunca se comparten con terceros. Si deseas sincronización centralizada multi-usuario en la nube para firmas contables, se puede vincular una base de datos segura.
          </p>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {history.map((audit) => {
          const isActive = audit.id === activeAuditId;
          const criticalCount = audit.findings.filter((f) => f.severity === 'CRITICA').length;

          return (
            <div
              key={audit.id}
              className={`p-5 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-slate-900 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-white">{audit.fileName}</span>
                    {audit.sheetName && (
                      <span className="text-xs text-slate-400">({audit.sheetName})</span>
                    )}
                    {audit.isDemo && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded">
                        Demostración
                      </span>
                    )}
                    {isActive && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded">
                        Activo en Pantalla
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(audit.auditDate).toLocaleString('es-ES')}</span>
                    </div>
                    <div>{audit.totalRows.toLocaleString()} registros</div>
                    <div className={audit.isBalanced ? 'text-emerald-400' : 'text-rose-400 font-semibold'}>
                      {audit.isBalanced ? 'Partida Doble Cuadrada' : `Descuadre ${currency}${audit.discrepancy}`}
                    </div>
                    <div className="text-blue-400 font-semibold">{audit.healthScore}% Salud</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onSelectAudit(audit)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Cargar en Panel</span>
                  </button>
                  <button
                    onClick={() => onDeleteAudit(audit.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-400 transition"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom findings preview bar */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {audit.findings.length} inconsistencias detectadas
                  {criticalCount > 0 && (
                    <span className="text-rose-400 font-semibold ml-2">({criticalCount} críticas)</span>
                  )}
                </span>
                {audit.aiAnalysis && (
                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                    Dictamen IA: {audit.aiAnalysis.opinion}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {history.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
            No hay auditorías registradas en el historial. Carga un archivo para comenzar.
          </div>
        )}
      </div>
    </div>
  );
};
