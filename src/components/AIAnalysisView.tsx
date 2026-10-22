import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  Scale,
  ListOrdered,
  FileText,
  Send,
  Loader2,
  RefreshCw,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { AuditConfig, AuditResult } from '../types/audit';

interface AIAnalysisViewProps {
  audit: AuditResult;
  config: AuditConfig;
  aiConnected: boolean;
  onRunExecutiveAI: () => Promise<void>;
  isAILoading: boolean;
}

export const AIAnalysisView: React.FC<AIAnalysisViewProps> = ({
  audit,
  config,
  aiConnected,
  onRunExecutiveAI,
  isAILoading,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: 'user' | 'assistant'; text: string; time: string }>
  >([
    {
      role: 'assistant',
      text: `Hola. Soy el Auditor Contable Senior de AUDITA WEB. He examinado los registros de ${audit.fileName}. Puedes consultarme sobre el impacto tributario de los descuadres, normas contables aplicables (NIIF / IFRS) o cómo estructurar los asientos de ajuste.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isChatLoading) return;

    const query = userQuery.trim();
    setUserQuery('');

    const newMsgs = [
      ...chatMessages,
      {
        role: 'user' as const,
        text: query,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setChatMessages(newMsgs);
    setIsChatLoading(true);

    try {
      if (!aiConnected) {
        // Fallback analytical response based on local audit findings
        setTimeout(() => {
          let reply = '';
          const qLower = query.toLowerCase();
          if (qLower.includes('descuadre') || qLower.includes('partida')) {
            reply = `Sobre el descuadre de ${config.currencySymbol} ${Math.abs(audit.discrepancy).toLocaleString()}: El principio de partida doble exige que Débito = Crédito. Se recomienda verificar los asientos con diferencias (como ${audit.unbalancedVouchersCount} comprobante(s) detectados) e imputar la contracuenta correspondiente en Bancos o Cuentas por Pagar.`;
          } else if (qLower.includes('duplicado') || qLower.includes('factura')) {
            reply = `Respecto a los duplicados: Se detectaron registros idénticos en el libro. El riesgo principal radica en duplicar la deducción del gasto o inflar los pasivos. Se sugiere anular el comprobante secundario mediante nota de contabilidad de ajuste.`;
          } else {
            reply = `Para una respuesta analítica profunda generada por el modelo de IA Gemini, configure la clave GEMINI_API_KEY en el panel de configuración o secretos. Sin embargo, su auditoría matemática local confirma ${audit.findings.length} hallazgos con un índice de salud contable de ${audit.healthScore}%.`;
          }

          setChatMessages([
            ...newMsgs,
            {
              role: 'assistant',
              text: reply,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
          setIsChatLoading(false);
        }, 600);
        return;
      }

      // Real query to backend
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: audit.fileName,
          totalRows: audit.totalRows,
          totalDebit: audit.totalDebit,
          totalCredit: audit.totalCredit,
          discrepancy: audit.discrepancy,
          findingsSummary: {
            critical: audit.findings.filter((f) => f.severity === 'CRITICA').length,
            high: audit.findings.filter((f) => f.severity === 'ALTA').length,
            medium: audit.findings.filter((f) => f.severity === 'MEDIA').length,
            low: audit.findings.filter((f) => f.severity === 'BAJA').length,
          },
          topFindings: audit.findings.slice(0, 5),
          currency: config.currency,
        }),
      });

      const data = await res.json();
      const reply =
        data?.analysis?.executiveSummary ||
        'El análisis contable confirma la necesidad de revisar los asientos de ajuste.';

      setChatMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: `Respuesta técnica:\n\n${reply}\n\nRecomendación de Asiento: ${data?.analysis?.adjustingEntriesRecommendation || 'Revisar soportes contables.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        {
          role: 'assistant',
          text: 'Hubo una dificultad al consultar el servicio de IA. La auditoría matemática local permanece intacta.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const analysis = audit.aiAnalysis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor Analítico Gemini 3.8 Flash</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dictamen y Análisis Ejecutivo con IA
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explicaciones avanzadas sobre hallazgos, evaluación de materialidad, impacto tributario y asientos de ajuste sugeridos.
          </p>
        </div>

        <button
          onClick={onRunExecutiveAI}
          disabled={isAILoading}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 shrink-0"
        >
          {isAILoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando Dictamen...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>{analysis ? 'Actualizar Dictamen con IA' : 'Generar Dictamen Ejecutivo'}</span>
            </>
          )}
        </button>
      </div>

      {/* AI Connection Status Notification */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
          aiConnected
            ? 'bg-purple-950/20 border-purple-500/30 text-purple-200'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <Info className={`w-5 h-5 shrink-0 mt-0.5 ${aiConnected ? 'text-purple-400' : 'text-blue-400'}`} />
        <div className="text-xs space-y-1">
          <div className="font-bold">
            {aiConnected
              ? 'Conexión segura de Backend con Gemini API activa'
              : 'Modo de Síntesis Algorítmica Local Activo'}
          </div>
          <p className="text-slate-400 leading-relaxed">
            {aiConnected
              ? 'El modelo Gemini 3.8 Flash interpreta las reglas matemáticas contables ejecutadas localmente y redacta dictámenes ejecutivos según normas internacionales de contabilidad.'
              : 'Todas las comprobaciones de sumas, partida doble, duplicados y Benford se calculan de forma 100% exacta y verificable en tu equipo. Cuando configures la clave GEMINI_API_KEY en Secrets, se habilitarán las respuestas generativas avanzadas.'}
          </p>
        </div>
      </div>

      {/* Main Analysis Display */}
      {analysis ? (
        <div className="space-y-6">
          {/* Top Banner: Opinion & Risk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Opinión Profesional
              </span>
              <div className="mt-2 text-xl font-extrabold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-purple-400" />
                <span>{analysis.opinion}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dictamen sobre estados financieros</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nivel de Riesgo
              </span>
              <div
                className={`mt-2 text-xl font-extrabold flex items-center gap-2 ${
                  analysis.riskLevel === 'Crítico' || analysis.riskLevel === 'Alto'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Riesgo {analysis.riskLevel}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Evaluación de control interno</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Cuadre Partida Doble
              </span>
              <div
                className={`mt-2 text-xl font-extrabold flex items-center gap-2 ${
                  audit.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <Scale className="w-5 h-5" />
                <span>{audit.isBalanced ? 'Sin Desfase' : `Descuadre ${config.currencySymbol}${audit.discrepancy}`}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Debe vs Haber</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Salud Contable
              </span>
              <div className="mt-2 text-xl font-extrabold text-blue-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span>{audit.healthScore}% / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{audit.totalRows} registros auditados</p>
            </div>
          </div>

          {/* Executive Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>Resumen Ejecutivo para la Dirección y Auditoría</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
              {analysis.executiveSummary}
            </p>
          </div>

          {/* Observations & Materiality Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Observations */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-purple-400" />
                <span>Observaciones Clave de Control Interno</span>
              </h3>
              <div className="space-y-2.5">
                {analysis.keyObservations?.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-300">{obs}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Impact & Taxes */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Impacto en Materialidad e Implicaciones Tributarias</span>
              </h3>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-xs font-bold text-amber-400 uppercase">Impacto de Materialidad:</div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.materialityImpact}</p>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="text-xs font-bold text-rose-400 uppercase">Implicaciones Fiscales y Legales:</div>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.taxAndLegalImplications}</p>
              </div>
            </div>
          </div>

          {/* Action Plan & Adjusting Entries */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Plan de Acción y Asientos de Ajuste Contable Recomendados</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Guía técnica para regularizar las partidas observadas antes del cierre definitivo de balance.
              </p>
            </div>

            {/* Step list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {analysis.actionPlan?.map((item) => (
                <div key={item.step} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                      {item.step}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            {/* Specific Journal Adjustments */}
            {analysis.adjustingEntriesRecommendation && (
              <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="text-xs font-bold text-blue-300 uppercase">
                  Propuesta de Asientos de Reclasificación y Ajuste:
                </div>
                <p className="text-xs font-mono text-slate-200 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {analysis.adjustingEntriesRecommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Generar Dictamen Contable Inteligente</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              AUDITA WEB sintetizará las sumas matemáticas, descuadres y duplicados de {audit.fileName} para ofrecer un dictamen formal con nivel de riesgo y recomendaciones para el auditor.
            </p>
          </div>
          <button
            onClick={onRunExecutiveAI}
            disabled={isAILoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-600/30 transition inline-flex items-center gap-2"
          >
            {isAILoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando registros con Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generar Dictamen Ahora</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Interactive CPA Assistant Chat */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Consultor Contable Inteligente</h3>
              <p className="text-xs text-slate-400">
                Formula preguntas sobre este archivo contable o procedimientos de auditoría
              </p>
            </div>
          </div>
        </div>

        {/* Chat message history */}
        <div className="space-y-3 max-h-72 overflow-y-auto p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
          {chatMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none whitespace-pre-line'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center gap-2 text-xs text-purple-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>El auditor IA está analizando los registros...</span>
            </div>
          )}
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Ejemplo: ¿Cómo registro el asiento de ajuste para el descuadre de $300?"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!userQuery.trim() || isChatLoading}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preguntar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
