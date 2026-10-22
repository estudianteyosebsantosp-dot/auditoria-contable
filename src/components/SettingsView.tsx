import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Calendar,
  Sliders,
  CheckCircle2,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { DEFAULT_AUDIT_CONFIG } from '../data/sampleAudits';
import { AuditConfig } from '../types/audit';

interface SettingsViewProps {
  config: AuditConfig;
  onUpdateConfig: (newConfig: AuditConfig) => void;
  aiConnected: boolean;
  onCheckAIConnection: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  aiConnected,
  onCheckAIConnection,
}) => {
  const [localConfig, setLocalConfig] = useState<AuditConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setLocalConfig(DEFAULT_AUDIT_CONFIG);
    onUpdateConfig(DEFAULT_AUDIT_CONFIG);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const checkConnection = async () => {
    setIsCheckingAI(true);
    await onCheckAIConnection();
    setIsCheckingAI(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Configuración y Parámetros de Auditoría
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Personaliza la moneda, umbrales de materialidad, reglas activas y verifica el estado de la inteligencia artificial.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">Configuración guardada correctamente.</span>
        </div>
      )}

      {/* Section 1: Financial & Regional Formats */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <DollarSign className="w-4 h-4 text-blue-400" />
          <span>Moneda y Formatos Contables</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Moneda de Presentación
            </label>
            <select
              value={localConfig.currency}
              onChange={(e) => {
                const val = e.target.value;
                const symbols: Record<string, string> = {
                  USD: '$',
                  EUR: '€',
                  COP: '$',
                  MXN: '$',
                  PEN: 'S/.',
                  ARS: '$',
                  CLP: '$',
                };
                setLocalConfig({
                  ...localConfig,
                  currency: val,
                  currencySymbol: symbols[val] || '$',
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
            >
              <option value="USD">USD ($) - Dólar Estadounidense</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="COP">COP ($) - Peso Colombiano</option>
              <option value="MXN">MXN ($) - Peso Mexicano</option>
              <option value="PEN">PEN (S/.) - Sol Peruano</option>
              <option value="ARS">ARS ($) - Peso Argentino</option>
              <option value="CLP">CLP ($) - Peso Chileno</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Formato de Fecha Preferente
            </label>
            <select
              value={localConfig.dateFormat}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, dateFormat: e.target.value as any })
              }
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Latinoamérica / España)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (Estándar ISO 8601)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (Estados Unidos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Audit Engine Rules Toggles */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Reglas y Módulos de Validación Activos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              key: 'enableDoubleEntryCheck' as const,
              title: 'Partida Doble (Débito = Crédito)',
              desc: 'Comprueba el cuadre general y por asiento contable individual',
            },
            {
              key: 'enableDuplicatesCheck' as const,
              title: 'Detección de Duplicidades',
              desc: 'Identifica transacciones idénticas o facturas contabilizadas dos veces',
            },
            {
              key: 'enableMissingFieldsCheck' as const,
              title: 'Cuentas y Campos Incompletos',
              desc: 'Alerta sobre asientos sin código contable PUC o conceptos en blanco',
            },
            {
              key: 'enableInvalidDatesCheck' as const,
              title: 'Validación de Ejercicios y Fechas',
              desc: 'Detecta fechas futuras, periodos extemporáneos o formatos rotos',
            },
            {
              key: 'enableOutlierCheck' as const,
              title: 'Valores Atípicos (Outliers Estadísticos)',
              desc: 'Calcula Z-Score para identificar montos desproporcionados a la media',
            },
            {
              key: 'enableRoundNumbersCheck' as const,
              title: 'Montos Redondos de Alto Valor',
              desc: 'Marca transferencias o pagos de cifras exactas sin desglose fiscal',
            },
            {
              key: 'enableBenfordCheck' as const,
              title: 'Análisis Forense (Ley de Benford)',
              desc: 'Examina la distribución del primer dígito para detectar manipulación de cifras',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition"
            >
              <input
                type="checkbox"
                checked={Boolean(localConfig[item.key])}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, [item.key]: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700"
              />
              <div className="text-xs">
                <div className="font-semibold text-slate-200">{item.title}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section 3: Materiality & Sensitivity Thresholds */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-white">Umbrales de Tolerancia y Sensibilidad</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Tolerancia de Descuadre ({localConfig.currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              value={localConfig.balanceTolerance}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  balanceTolerance: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Diferencia máxima admisible por redondeo de centavos.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Sensibilidad a Outliers
            </label>
            <select
              value={localConfig.outlierSensitivity}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  outlierSensitivity: e.target.value as any,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
            >
              <option value="alta">Alta (Z-score &gt; 2.5)</option>
              <option value="media">Media (Z-score &gt; 3.0 estándar)</option>
              <option value="baja">Baja (Z-score &gt; 3.5)</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Nivel de rigurosidad para clasificar transacciones atípicas.
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Umbral Monto Redondo ({localConfig.currencySymbol})
            </label>
            <input
              type="number"
              step="1000"
              value={localConfig.roundNumberThreshold}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  roundNumberThreshold: parseFloat(e.target.value) || 50000,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Cifra mínima a partir de la cual se evalúan ceros finales.
            </span>
          </div>
        </div>
      </div>

      {/* Section 4: AI & Security Architecture */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Estado del Motor de Inteligencia Artificial (Backend Proxy)</span>
          </div>
          <button
            onClick={checkConnection}
            disabled={isCheckingAI}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAI ? 'animate-spin' : ''}`} />
            <span>Comprobar Estado</span>
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                aiConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-white">
                {aiConnected ? 'Gemini 3.8 Flash Conectado' : 'Modo Motor Local Activo'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {aiConnected
                  ? 'Las solicitudes se autentican de forma segura a través del servidor Express sin exponer secretos.'
                  : 'Para habilitar explicaciones generativas avanzadas con IA, asegúrate de tener configurada la variable GEMINI_API_KEY en Secrets.'}
              </div>
            </div>
          </div>
        </div>

        {/* Security policy notice */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Seguridad y Confidencialidad de Datos Contables:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              AUDITA WEB no expone API Keys en el código de cliente. Los archivos contables se procesan localmente en memoria y únicamente las sumatorias y hallazgos resumidos se transmiten al backend para la redacción de informes cuando el usuario lo solicita expresamente.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Save & Reset Controls */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={handleResetDefaults}
          className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Parámetros Predeterminados</span>
        </button>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition"
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};
