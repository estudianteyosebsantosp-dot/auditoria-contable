import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UploadView } from './components/UploadView';
import { AuditResultsView } from './components/AuditResultsView';
import { AIAnalysisView } from './components/AIAnalysisView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { AuditConfig, AuditFinding, AuditResult } from './types/audit';
import {
  clearAllAuditHistory,
  createSampleAudit,
  deleteAuditFromHistory,
  loadAuditHistory,
  loadStoredConfig,
  saveAuditToHistory,
  saveStoredConfig,
} from './utils/storage';
import { exportAuditToCSV, exportAuditToExcel, exportAuditToPDF } from './utils/exportReports';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<AuditConfig>(() => loadStoredConfig());
  const [history, setHistory] = useState<AuditResult[]>(() => loadAuditHistory());
  const [activeAudit, setActiveAudit] = useState<AuditResult>(() => {
    const list = loadAuditHistory();
    return list.length > 0 ? list[0] : createSampleAudit('sample-libro-diario', loadStoredConfig());
  });
  const [aiConnected, setAiConnected] = useState<boolean>(false);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);

  // Check backend AI status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setAiConnected(Boolean(data?.aiConfigured));
      }
    } catch (e) {
      console.warn('Backend API health check failed, running in local-only mode:', e);
      setAiConnected(false);
    }
  };

  const handleUpdateConfig = (newConfig: AuditConfig) => {
    setConfig(newConfig);
    saveStoredConfig(newConfig);
  };

  const handleAuditCompleted = (newAudit: AuditResult) => {
    setActiveAudit(newAudit);
    saveAuditToHistory(newAudit);
    setHistory(loadAuditHistory());
    setCurrentTab('dashboard');

    if (newAudit.isBalanced && newAudit.healthScore >= 90) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore if confetti fails
      }
    }
  };

  const handleSelectSample = (sampleId: string) => {
    const sampleAudit = createSampleAudit(sampleId, config);
    setActiveAudit(sampleAudit);
    saveAuditToHistory(sampleAudit);
    setHistory(loadAuditHistory());
    setCurrentTab('dashboard');
  };

  const handleSelectAuditFromHistory = (audit: AuditResult) => {
    setActiveAudit(audit);
    setCurrentTab('dashboard');
  };

  const handleDeleteAudit = (id: string) => {
    const remaining = deleteAuditFromHistory(id);
    setHistory(remaining);
    if (activeAudit.id === id && remaining.length > 0) {
      setActiveAudit(remaining[0]);
    }
  };

  const handleClearHistory = () => {
    clearAllAuditHistory();
    const fallback = createSampleAudit('sample-libro-diario', config);
    saveAuditToHistory(fallback);
    setHistory([fallback]);
    setActiveAudit(fallback);
  };

  const handleUpdateFinding = (findingId: string, updates: Partial<AuditFinding>) => {
    const updatedFindings = activeAudit.findings.map((f) => {
      if (f.id === findingId) {
        return { ...f, ...updates };
      }
      return f;
    });

    const updatedAudit: AuditResult = {
      ...activeAudit,
      findings: updatedFindings,
    };

    setActiveAudit(updatedAudit);
    saveAuditToHistory(updatedAudit);
    setHistory(loadAuditHistory());
  };

  const handleExplainWithAI = async (finding: AuditFinding) => {
    setIsAILoading(true);
    try {
      if (!aiConnected) {
        // High quality programmatic analytical response
        setTimeout(() => {
          const simulated = {
            title: finding.title,
            rootCauseAnalysis:
              finding.category === 'PARTIDA_DOBLE'
                ? 'Omisión de registro en contrapartida o error en digitación de comprobante contable.'
                : finding.category === 'DUPLICADOS'
                ? 'Doble radicación del documento soporte por falta de control de folios consecutivos.'
                : 'Falta de validaciones automáticas en la parametrización del catálogo de cuentas.',
            auditingRisk:
              'Distorsión en la exactitud del balance de comprobación y posible observación por parte de revisoría fiscal o auditoría externa.',
            howToFix:
              finding.suggestedAction ||
              'Inspeccionar el documento soporte original y asentar la rectificación correspondiente.',
            preventiveControl:
              'Establecer candados de software para no permitir asientos con descuadre en el ERP.',
          };
          handleUpdateFinding(finding.id, { aiExplanation: simulated });
          setIsAILoading(false);
        }, 500);
        return;
      }

      const res = await fetch('/api/ai/explain-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding,
          context: {
            fileName: activeAudit.fileName,
            totalRows: activeAudit.totalRows,
            discrepancy: activeAudit.discrepancy,
          },
        }),
      });

      if (!res.ok) throw new Error('Error al generar explicación con IA');
      const data = await res.json();
      if (data.explanation) {
        handleUpdateFinding(finding.id, { aiExplanation: data.explanation });
      }
    } catch (err) {
      console.error('Error generating AI explanation:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRunExecutiveAI = async () => {
    setIsAILoading(true);
    try {
      if (!aiConnected) {
        // High-fidelity fallback based on strict mathematical findings
        setTimeout(() => {
          const opinion = activeAudit.isBalanced
            ? activeAudit.findings.length > 0
              ? 'Con Salvedades'
              : 'Favorable'
            : 'Desfavorable';

          const riskLevel =
            activeAudit.findings.filter((f) => f.severity === 'CRITICA').length > 0
              ? 'Crítico'
              : activeAudit.findings.filter((f) => f.severity === 'ALTA').length > 0
              ? 'Alto'
              : activeAudit.findings.length > 0
              ? 'Moderado'
              : 'Bajo';

          const fallbackAnalysis = {
            executiveSummary: `Auditoría completada para "${activeAudit.fileName}". Se examinaron ${activeAudit.totalRows} registros contables con Débitos acumulados de ${config.currencySymbol}${activeAudit.totalDebit.toLocaleString()} y Créditos de ${config.currencySymbol}${activeAudit.totalCredit.toLocaleString()}. ${
              activeAudit.isBalanced
                ? 'El principio de partida doble se cumple satisfactoriamente a nivel global.'
                : `Existe un descuadre crítico de ${config.currencySymbol}${Math.abs(activeAudit.discrepancy).toLocaleString()} que viola el principio fundamental contable.`
            } Se identificaron ${activeAudit.findings.length} inconsistencias que requieren verificación documental.`,
            riskLevel: riskLevel as any,
            opinion: opinion as any,
            keyObservations: activeAudit.findings.slice(0, 4).map((f) => `${f.title}: ${f.description}`),
            materialityImpact: `El volumen de desfase y transacciones anómalas representa un impacto directo en los estados financieros del periodo examinado.`,
            taxAndLegalImplications: `Revisar duplicados y retenciones para evitar glosas y sanciones en declaraciones tributarias.`,
            actionPlan: [
              {
                step: 1,
                title: 'Conciliación de Partida Doble',
                description: 'Verificar los comprobantes señalados con diferencias y cuadrar las sumas de débito y crédito.',
              },
              {
                step: 2,
                title: 'Depuración de Cuentas y Duplicados',
                description: 'Anular facturas o comprobantes repetidos y asignar códigos a cuentas huérfanas.',
              },
              {
                step: 3,
                title: 'Cierre Definitivo de Balance',
                description: 'Emitir balance de comprobación rectificado tras los asientos de ajuste.',
              },
            ],
            adjustingEntriesRecommendation: `Efectuar asiento de ajuste debitando o acreditando la cuenta descompensada contra contrapartida conciliada en Bancos o Cuentas por Cobrar/Pagar.`,
          };

          const updated: AuditResult = {
            ...activeAudit,
            aiAnalysis: fallbackAnalysis,
            aiStatus: 'success',
          };
          setActiveAudit(updated);
          saveAuditToHistory(updated);
          setHistory(loadAuditHistory());
          setIsAILoading(false);
        }, 700);
        return;
      }

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: activeAudit.fileName,
          totalRows: activeAudit.totalRows,
          totalDebit: activeAudit.totalDebit,
          totalCredit: activeAudit.totalCredit,
          discrepancy: activeAudit.discrepancy,
          findingsSummary: {
            critical: activeAudit.findings.filter((f) => f.severity === 'CRITICA').length,
            high: activeAudit.findings.filter((f) => f.severity === 'ALTA').length,
            medium: activeAudit.findings.filter((f) => f.severity === 'MEDIA').length,
            low: activeAudit.findings.filter((f) => f.severity === 'BAJA').length,
            doubleEntry: activeAudit.findings.filter((f) => f.category === 'PARTIDA_DOBLE').length,
            duplicates: activeAudit.findings.filter((f) => f.category === 'DUPLICADOS').length,
            anomalies: activeAudit.findings.filter((f) => f.category === 'VALORES_ANOMALOS').length,
            missingFields: activeAudit.findings.filter((f) => f.category === 'CAMPOS_INCOMPLETOS').length,
            invalidDates: activeAudit.findings.filter((f) => f.category === 'FECHAS_INVALIDAS').length,
          },
          topFindings: activeAudit.findings.slice(0, 6),
          currency: config.currency,
        }),
      });

      if (!res.ok) throw new Error('Error al procesar dictamen en backend');
      const data = await res.json();

      if (data.analysis) {
        const updated: AuditResult = {
          ...activeAudit,
          aiAnalysis: data.analysis,
          aiStatus: 'success',
        };
        setActiveAudit(updated);
        saveAuditToHistory(updated);
        setHistory(loadAuditHistory());
      }
    } catch (err) {
      console.error('Error generating executive AI analysis:', err);
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onNewAudit={() => setCurrentTab('upload')}
        aiConnected={aiConnected}
        activeFileName={activeAudit?.fileName}
        isDemo={activeAudit?.isDemo}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            audit={activeAudit}
            config={config}
            onNavigate={setCurrentTab}
            onExportPDF={() => exportAuditToPDF(activeAudit, config)}
            onExportExcel={() => exportAuditToExcel(activeAudit, config)}
            onSelectAuditFromHistory={handleSelectAuditFromHistory}
            history={history}
          />
        )}

        {currentTab === 'upload' && (
          <UploadView
            config={config}
            onAuditCompleted={handleAuditCompleted}
            onSelectSample={handleSelectSample}
          />
        )}

        {currentTab === 'results' && (
          <AuditResultsView
            audit={activeAudit}
            onUpdateFinding={handleUpdateFinding}
            onExplainWithAI={handleExplainWithAI}
            isAILoading={isAILoading}
          />
        )}

        {currentTab === 'ai' && (
          <AIAnalysisView
            audit={activeAudit}
            config={config}
            aiConnected={aiConnected}
            onRunExecutiveAI={handleRunExecutiveAI}
            isAILoading={isAILoading}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView audit={activeAudit} config={config} />
        )}

        {currentTab === 'history' && (
          <HistoryView
            history={history}
            activeAuditId={activeAudit.id}
            config={config}
            onSelectAudit={handleSelectAuditFromHistory}
            onDeleteAudit={handleDeleteAudit}
            onClearAll={handleClearHistory}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            config={config}
            onUpdateConfig={handleUpdateConfig}
            aiConnected={aiConnected}
            onCheckAIConnection={checkAIStatus}
          />
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AUDITA WEB</span>
            <span>•</span>
            <span>Precisión contable, decisiones inteligentes</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Diseñado para Contadores Públicos, Revisores Fiscales y Auditores Financieros
          </div>
        </div>
      </footer>
    </div>
  );
}
