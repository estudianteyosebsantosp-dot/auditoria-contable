import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  Sparkles,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Share2,
  FileCheck2,
  BookOpen,
  Send,
  Loader2,
} from 'lucide-react';
import { AuditFinding, AuditResult, RawRow, Severity } from '../types/audit';

interface AuditResultsViewProps {
  audit: AuditResult;
  onUpdateFinding: (findingId: string, updates: Partial<AuditFinding>) => void;
  onExplainWithAI: (finding: AuditFinding) => Promise<void>;
  isAILoading: boolean;
}

export const AuditResultsView: React.FC<AuditResultsViewProps> = ({
  audit,
  onUpdateFinding,
  onExplainWithAI,
  isAILoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, PENDING, REVIEWED
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [selectedRowData, setSelectedRowData] = useState<RawRow | null>(null);
  const [auditorNoteInput, setAuditorNoteInput] = useState('');

  // Filter findings
  const filteredFindings = useMemo(() => {
    return audit.findings.filter((f) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        f.title.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower) ||
        String(f.detectedValue ?? '').toLowerCase().includes(searchLower) ||
        String(f.rowNumber ?? '').includes(searchLower) ||
        String(f.voucherNumber ?? '').includes(searchLower) ||
        String(f.field ?? '').toLowerCase().includes(searchLower);

      // Severity
      const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;

      // Category
      const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;

      // Status
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'REVIEWED' && f.reviewed) ||
        (statusFilter === 'PENDING' && !f.reviewed);

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
    });
  }, [audit.findings, searchTerm, severityFilter, categoryFilter, statusFilter]);

  const handleOpenDetail = (finding: AuditFinding) => {
    setSelectedFinding(finding);
    setAuditorNoteInput(finding.auditorNotes || '');

    if (finding.rowNumber && audit.rows && audit.rows[finding.rowNumber - 1]) {
      setSelectedRowData(audit.rows[finding.rowNumber - 1]);
    } else {
      setSelectedRowData(null);
    }
  };

  const handleSaveNotes = () => {
    if (selectedFinding) {
      onUpdateFinding(selectedFinding.id, { auditorNotes: auditorNoteInput });
      setSelectedFinding({ ...selectedFinding, auditorNotes: auditorNoteInput });
    }
  };

  const handleToggleReviewed = (finding: AuditFinding, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newStatus = !finding.reviewed;
    onUpdateFinding(finding.id, { reviewed: newStatus });
    if (selectedFinding && selectedFinding.id === finding.id) {
      setSelectedFinding({ ...selectedFinding, reviewed: newStatus });
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'CRITICA':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          icon: AlertOctagon,
        };
      case 'ALTA':
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          icon: AlertTriangle,
        };
      case 'MEDIA':
        return {
          bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          icon: Info,
        };
      case 'BAJA':
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600',
          icon: CheckCircle,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Hallazgos e Inconsistencias Contables
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explora las alertas generadas por el motor de auditoría. Puedes filtrar, marcar como revisado y solicitar dictámenes analíticos con IA.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Total Hallazgos</div>
            <div className="text-xl font-extrabold text-white">
              {filteredFindings.length} <span className="text-xs text-slate-400">/ {audit.findings.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por concepto, cuenta, importe, número de fila o asiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 placeholder-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Severity Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'CRITICA', label: 'Críticos' },
              { id: 'ALTA', label: 'Altos' },
              { id: 'MEDIA', label: 'Medios' },
              { id: 'BAJA', label: 'Bajos' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSeverityFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  severityFilter === s.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 outline-none"
            >
              <option value="ALL">Todas las reglas</option>
              <option value="PARTIDA_DOBLE">Partida Doble / Descuadres</option>
              <option value="DUPLICADOS">Registros Duplicados</option>
              <option value="VALORES_ANOMALOS">Valores Atípicos / Montos Redondos</option>
              <option value="CAMPOS_INCOMPLETOS">Cuentas y Campos Incompletos</option>
              <option value="FECHAS_INVALIDAS">Fechas Inválidas o Fuera de Ejercicio</option>
              <option value="LEY_BENFORD">Ley de Benford</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 outline-none"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendientes de Revisión</option>
              <option value="REVIEWED">Revisados por Auditor</option>
            </select>
          </div>

          {(searchTerm || severityFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('ALL');
                setCategoryFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="text-xs text-blue-400 hover:underline ml-auto"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 w-10 text-center">Estado</th>
                <th className="px-3 py-3 w-28">Severidad</th>
                <th className="px-3 py-3 w-36">Categoría</th>
                <th className="px-3 py-3 w-28">Ubicación</th>
                <th className="px-4 py-3">Hallazgo y Descripción</th>
                <th className="px-3 py-3 w-36 text-center">Valores</th>
                <th className="px-4 py-3 w-28 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFindings.map((finding) => {
                const badge = getSeverityBadge(finding.severity);
                const Icon = badge.icon;

                return (
                  <tr
                    key={finding.id}
                    onClick={() => handleOpenDetail(finding)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    {/* Reviewed checkbox */}
                    <td className="px-4 py-3 text-center" onClick={(e) => handleToggleReviewed(finding, e)}>
                      <button
                        title={finding.reviewed ? 'Marcar como pendiente' : 'Marcar como revisado'}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          finding.reviewed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-700 hover:border-blue-400 bg-slate-950'
                        }`}
                      >
                        {finding.reviewed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Severity */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}
                      >
                        <Icon className="w-3 h-3" />
                        {finding.severity}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-300">
                      {finding.category.replace(/_/g, ' ')}
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {finding.rowNumber ? (
                        <span className="text-blue-300 font-semibold">Fila #{finding.rowNumber}</span>
                      ) : finding.voucherNumber ? (
                        <span className="text-purple-300 font-semibold">Asiento #{finding.voucherNumber}</span>
                      ) : (
                        <span>Balanza Global</span>
                      )}
                      {finding.field && <div className="text-[10px] text-slate-500">{finding.field}</div>}
                    </td>

                    {/* Title & Description */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-200 group-hover:text-blue-400 transition">
                        {finding.title}
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{finding.description}</p>
                      {finding.auditorNotes && (
                        <div className="mt-1 text-[10px] text-amber-300/90 italic flex items-center gap-1">
                          <span>Nota auditor: {finding.auditorNotes}</span>
                        </div>
                      )}
                    </td>

                    {/* Detected / Expected preview */}
                    <td className="px-3 py-3 text-center whitespace-nowrap text-[11px]">
                      {finding.detectedValue !== undefined ? (
                        <div>
                          <span className="text-rose-400 font-medium">{String(finding.detectedValue)}</span>
                          {finding.expectedValue && (
                            <div className="text-[10px] text-slate-500">Esp: {String(finding.expectedValue)}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(finding);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="Ver detalles"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredFindings.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No se encontraron hallazgos con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finding Detail Modal / Drawer */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      getSeverityBadge(selectedFinding.severity).bg
                    }`}
                  >
                    {selectedFinding.severity}
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedFinding.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{selectedFinding.title}</h2>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description & Cause */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-400">Detalle del Hallazgo:</div>
              <p className="text-xs text-slate-200 leading-relaxed">{selectedFinding.description}</p>
            </div>

            {/* Values Comparison */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-rose-400 uppercase">Valor Observado</div>
                <div className="text-sm font-semibold text-white mt-1 break-all">
                  {String(selectedFinding.detectedValue ?? 'N/A')}
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-400 uppercase">Valor Esperado / Regla</div>
                <div className="text-sm font-semibold text-white mt-1 break-all">
                  {String(selectedFinding.expectedValue ?? 'Conforme a norma contable')}
                </div>
              </div>
            </div>

            {/* Action suggested */}
            {selectedFinding.suggestedAction && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-[11px] font-bold text-blue-400 uppercase mb-1">
                  Acción Sugerida para el Contador / Auditor:
                </div>
                <p className="text-xs text-slate-300">{selectedFinding.suggestedAction}</p>
              </div>
            )}

            {/* Raw Row in File Context */}
            {selectedRowData && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  <span>Registro Completo en el Archivo (Fila #{selectedFinding.rowNumber})</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-800/80">
                      {Object.entries(selectedRowData)
                        .filter(([k]) => k !== '__rowNum')
                        .map(([k, v]) => (
                          <tr key={k}>
                            <td className="py-1 font-semibold text-slate-400 w-1/3">{k}:</td>
                            <td className="py-1 text-slate-200">{String(v ?? '')}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Explanation Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Explicación Analítica de Auditoría (Gemini AI)</span>
                </div>
                {!selectedFinding.aiExplanation && (
                  <button
                    onClick={() => onExplainWithAI(selectedFinding)}
                    disabled={isAILoading}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    {isAILoading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Analizando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Explicar con IA</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {selectedFinding.aiExplanation ? (
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 text-xs space-y-3">
                  <div>
                    <span className="font-bold text-purple-300">Causa Raíz Típica: </span>
                    <span className="text-slate-300">{selectedFinding.aiExplanation.rootCauseAnalysis}</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-300">Riesgo en Estados Financieros: </span>
                    <span className="text-slate-300">{selectedFinding.aiExplanation.auditingRisk}</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-300">Procedimiento de Corrección: </span>
                    <span className="text-slate-300">{selectedFinding.aiExplanation.howToFix}</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-300">Control Preventivo Recomendado: </span>
                    <span className="text-slate-300">{selectedFinding.aiExplanation.preventiveControl}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Haz clic en &quot;Explicar con IA&quot; para obtener un análisis técnico detallado sobre el riesgo material y el procedimiento de ajuste contable.
                </p>
              )}
            </div>

            {/* Auditor Notes Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Notas de Trabajo del Auditor</label>
              <textarea
                rows={2}
                value={auditorNoteInput}
                onChange={(e) => setAuditorNoteInput(e.target.value)}
                placeholder="Escribe tus notas, papeles de trabajo o referencias de comprobante..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                >
                  Guardar Nota
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => handleToggleReviewed(selectedFinding)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                  selectedFinding.reviewed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{selectedFinding.reviewed ? 'Marcado como Revisado' : 'Marcar como Revisado'}</span>
              </button>

              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
