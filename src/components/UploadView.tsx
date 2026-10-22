import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Table,
  ArrowRight,
  Layers,
  Sparkles,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleAudits';
import { AuditConfig, AuditResult, ColumnMapping, RawRow } from '../types/audit';
import { detectColumnMapping, runAccountingAudit } from '../utils/auditEngine';

interface UploadViewProps {
  config: AuditConfig;
  onAuditCompleted: (result: AuditResult) => void;
  onSelectSample: (sampleId: string) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  config,
  onAuditCompleted,
  onSelectSample,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [parsedRows, setParsedRows] = useState<RawRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    setErrorMsg(null);
    setIsLoading(true);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!hasValidExt) {
      setErrorMsg('Formato de archivo no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV (.csv).');
      setIsLoading(false);
      return;
    }

    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

      if (!wb.SheetNames || wb.SheetNames.length === 0) {
        setErrorMsg('El archivo no contiene hojas de cálculo legibles.');
        setIsLoading(false);
        return;
      }

      setFile(selectedFile);
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);
      loadSheetData(wb, firstSheet);
    } catch (err: any) {
      console.error('Error reading spreadsheet:', err);
      setErrorMsg(`Error al leer el archivo contable: ${err?.message || 'Archivo dañado o cifrado'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = wb.Sheets[sheetName];
      if (!ws) {
        setErrorMsg(`La hoja "${sheetName}" no contiene datos.`);
        return;
      }

      const jsonData: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (!jsonData || jsonData.length === 0) {
        setErrorMsg(`La hoja "${sheetName}" está vacía.`);
        setParsedRows([]);
        setHeaders([]);
        return;
      }

      // Extract unique headers
      const detectedHeaders = Object.keys(jsonData[0] || {});
      setHeaders(detectedHeaders);
      setParsedRows(jsonData);

      // Auto-detect columns
      const autoMapping = detectColumnMapping(detectedHeaders);
      setMapping(autoMapping);
    } catch (err: any) {
      console.error('Error loading sheet:', err);
      setErrorMsg(`Error al procesar la hoja de cálculo: ${err.message}`);
    }
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSheet = e.target.value;
    setSelectedSheet(newSheet);
    if (workbook) {
      loadSheetData(workbook, newSheet);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const executeAudit = () => {
    if (!parsedRows || parsedRows.length === 0) {
      setErrorMsg('No hay datos disponibles para auditar. Carga un archivo con registros contables.');
      return;
    }

    setIsLoading(true);
    try {
      const auditResult = runAccountingAudit(
        parsedRows,
        headers,
        mapping,
        config,
        file ? file.name : 'Archivo_Contable.xlsx',
        selectedSheet,
        false // Not a demo, user uploaded real file
      );

      onAuditCompleted(auditResult);
    } catch (err: any) {
      console.error('Error executing audit:', err);
      setErrorMsg(`Error durante la ejecución del motor de auditoría: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="h-20 sm:h-22 px-3.5 py-1.5 bg-white rounded-2xl shadow-xl border border-white/60 flex items-center justify-center shrink-0">
          <img
            src="/assets/aistudio/Captura_de_pantalla_2026-10-21_logooooooooooo_56d6bd4a.png"
            alt="AUDITA WEB Logo"
            className="h-16 sm:h-18 w-auto object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Carga y Configuración de Archivo Contable
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Sube tu libro diario, balance de comprobación o registro contable en Excel (.xlsx, .xls) o CSV. El motor analizará las operaciones sin enviar datos no autorizados al exterior.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900/90'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-600/10">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <p className="text-base font-bold text-white">
              {file ? file.name : 'Arrastra y suelta tu archivo contable aquí'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              o haz clic para explorar en tu computadora (.xlsx, .xls, .csv)
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Archivo cargado ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Atención: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Sample Files Fast Selector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              ¿No tienes un archivo a mano? Prueba con libros de muestra
            </h2>
          </div>
          <span className="text-xs text-slate-400">Casos reales con hallazgos intencionales</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSelectSample(sample.id)}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 group-hover:text-blue-300">
                  {sample.name}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{sample.rows.length} filas</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sample.description}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>{sample.company}</span>
                <span className="text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  Cargar dataset <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sheets & Column Mapping Options (Shown when file is loaded) */}
      {parsedRows.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sheet Selector */}
          {sheets.length > 1 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-bold text-white">Hoja de Cálculo Activa</div>
                  <div className="text-xs text-slate-400">
                    El archivo contiene múltiples hojas. Selecciona cuál deseas auditar:
                  </div>
                </div>
              </div>
              <select
                value={selectedSheet}
                onChange={handleSheetChange}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Column Mapping Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">Mapeo Inteligente de Columnas</h2>
                <p className="text-xs text-slate-400">
                  Verifica que las columnas de tu archivo correspondan a los campos contables requeridos:
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                {headers.length} columnas detectadas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Debit Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Columna Débito (Debe)</span>
                  <span className="text-[10px] text-rose-400">*Clave</span>
                </label>
                <select
                  value={mapping.debitCol || ''}
                  onChange={(e) => setMapping({ ...mapping, debitCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Columna Crédito (Haber)</span>
                  <span className="text-[10px] text-rose-400">*Clave</span>
                </label>
                <select
                  value={mapping.creditCol || ''}
                  onChange={(e) => setMapping({ ...mapping, creditCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Code Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Código de Cuenta (PUC)</label>
                <select
                  value={mapping.accountCol || ''}
                  onChange={(e) => setMapping({ ...mapping, accountCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Voucher / Asiento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nº Asiento / Comprobante</label>
                <select
                  value={mapping.voucherCol || ''}
                  onChange={(e) => setMapping({ ...mapping, voucherCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Fecha de Transacción</label>
                <select
                  value={mapping.dateCol || ''}
                  onChange={(e) => setMapping({ ...mapping, dateCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description / Concept */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Concepto / Glosa / Detalle</label>
                <select
                  value={mapping.descriptionCol || ''}
                  onChange={(e) => setMapping({ ...mapping, descriptionCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Third party / Entity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tercero / Beneficiario / NIT</label>
                <select
                  value={mapping.thirdPartyCol || ''}
                  onChange={(e) => setMapping({ ...mapping, thirdPartyCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Generic Amount Column */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Monto / Saldo Único</label>
                <select
                  value={mapping.amountCol || ''}
                  onChange={(e) => setMapping({ ...mapping, amountCol: e.target.value || undefined })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
                >
                  <option value="">-- No asignada --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview of first 5 rows */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Vista Previa de Datos ({parsedRows.length} filas totales)</h3>
              </div>
              <span className="text-xs text-slate-400">Primeras 5 líneas cargadas</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2.5 border-b border-slate-800">#</th>
                    {headers.slice(0, 8).map((h) => (
                      <th key={h} className="px-3 py-2.5 border-b border-slate-800">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="px-3 py-2 font-mono text-slate-400">{i + 1}</td>
                      {headers.slice(0, 8).map((h) => (
                        <td key={h} className="px-3 py-2 max-w-[180px] truncate">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Big Action Button to Run Audit */}
          <div className="pt-2">
            <button
              onClick={executeAudit}
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-400 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Ejecutar Auditoría Contable Completa</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
