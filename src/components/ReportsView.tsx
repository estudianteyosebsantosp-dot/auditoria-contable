import React, { useState } from 'react';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { AuditConfig, AuditResult } from '../types/audit';
import { exportAuditToCSV, exportAuditToExcel, exportAuditToPDF } from '../utils/exportReports';

interface ReportsViewProps {
  audit: AuditResult;
  config: AuditConfig;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ audit, config }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    exportAuditToPDF(audit, config);
    triggerSuccess('Informe PDF descargado con éxito.');
  };

  const handleDownloadExcel = () => {
    exportAuditToExcel(audit, config);
    triggerSuccess('Libro de Auditoría Excel (.xlsx) exportado con éxito.');
  };

  const handleDownloadCSV = () => {
    exportAuditToCSV(audit);
    triggerSuccess('Matriz de Hallazgos CSV exportada con éxito.');
  };

  const triggerSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const currency = config.currencySymbol || '$';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Generación y Descarga de Informes Oficiales
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Exporta dictámenes ejecutivos, papeles de trabajo contables y matrices de hallazgos en formatos estándar para juntas directivas, socios o ERPs.
        </p>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{downloadSuccess}</span>
        </div>
      )}

      {/* 3 Main Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: PDF Official Audit Report */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-md shadow-rose-500/10">
              <FileDown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                Informe Oficial en PDF
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Documento formal membretado con dictamen del auditor, balanza de partida doble, tablas de hallazgos técnicos y cláusula de confidencialidad.
              </p>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Membrete corporativo AUDITA WEB</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dictamen y resumen ejecutivo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Paginación y firma técnica</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="mt-6 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Informe PDF</span>
          </button>
        </div>

        {/* Card 2: Multi-tab Excel Book */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md shadow-emerald-500/10">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                Libro de Auditoría en Excel (.xlsx)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Libro de trabajo completo con 4 hojas organizadas: Resumen Ejecutivo, Hallazgos, Datos Auditados y Análisis Forense de Benford.
              </p>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hojas estructuradas con fórmulas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cálculos de partida doble</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Compatible con Microsoft Excel y LibreOffice</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadExcel}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Libro Excel</span>
          </button>
        </div>

        {/* Card 3: CSV Export for ERP */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-md shadow-blue-500/10">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                Matriz de Hallazgos en CSV
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Archivo de texto plano delimitado por comas con codificación UTF-8, ideal para importar incidencias a software contable (SAP, Siigo, Concar, Contpaqi).
              </p>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delimitado por comas con escape</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identificadores unívocos por hallazgo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Integrable con scripts y bases de datos</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Archivo CSV</span>
          </button>
        </div>
      </div>

      {/* Live Preview of the Document Contents */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">Vista Previa del Dictamen Generado</h2>
              <p className="text-xs text-slate-400">
                Así se estructurarán los datos en el informe exportable:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Ref: {audit.id}</span>
          </div>
        </div>

        {/* Paper-like Preview Container */}
        <div className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6 font-sans">
          {/* Header block */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 px-3 py-1 bg-white rounded-xl shadow-md border border-white/50 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/Captura_de_pantalla_2026-10-21_logooooooooooo_56d6bd4a.png"
                  alt="AUDITA WEB Logo"
                  className="h-11 w-auto object-contain"
                />
              </div>
              <div>
                <div className="text-xl font-extrabold text-blue-400">AUDITA WEB</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-widest">
                  Tu aliado en una auditoría contable más inteligente
                </div>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Fecha: {new Date(audit.auditDate).toLocaleDateString('es-ES')}</div>
              <div>Archivo: {audit.fileName}</div>
            </div>
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Salud Contable</span>
              <div className="text-lg font-bold text-white">{audit.healthScore}%</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Débito</span>
              <div className="text-lg font-bold text-slate-200">
                {currency} {audit.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Crédito</span>
              <div className="text-lg font-bold text-slate-200">
                {currency} {audit.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Diferencia Cuadre</span>
              <div
                className={`text-lg font-bold ${audit.isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {currency} {Math.abs(audit.discrepancy).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* AI Opinion summary preview */}
          {audit.aiAnalysis && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase">
                  Dictamen Ejecutivo: {audit.aiAnalysis.opinion}
                </span>
                <span className="text-xs text-slate-400">Riesgo: {audit.aiAnalysis.riskLevel}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{audit.aiAnalysis.executiveSummary}</p>
            </div>
          )}

          {/* Sample of findings */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">
              Primeros Hallazgos Registrados en Informe ({audit.findings.length} totales):
            </div>
            <div className="space-y-1.5">
              {audit.findings.slice(0, 3).map((f, i) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">#{i + 1}</span>
                    <span className="text-slate-200 font-semibold">{f.title}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-400">{f.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
