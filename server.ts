import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize GoogleGenAI client if key is available
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(aiClient),
    timestamp: new Date().toISOString(),
    service: 'AUDITA WEB Engine API',
  });
});

// AI Executive Analysis Endpoint
app.post('/api/ai/analyze', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Servicio de Inteligencia Artificial no configurado en el servidor.',
        fallbackSummary: 'La auditoría matemática local se ha completado satisfactoriamente con precisión estricta. Para generar análisis narrativos y recomendaciones ejecutivas con IA, configure la clave GEMINI_API_KEY.',
      });
    }

    const {
      fileName,
      totalRows,
      totalDebit,
      totalCredit,
      discrepancy,
      findingsSummary,
      topFindings,
      currency = 'USD',
    } = req.body;

    const prompt = `Actúa como un Auditor Contable y Financiero Senior (CPA / Revisor Fiscal) especializado en auditoría forense, control interno y normas internacionales de contabilidad (NIIF / IFRS).
Analiza el siguiente resumen de auditoría contable computacional generada por el software AUDITA WEB:

- Nombre del archivo contable: ${fileName || 'Libro_Contable.xlsx'}
- Registros totales examinados: ${totalRows}
- Total Débitos calculados: ${totalDebit} ${currency}
- Total Créditos calculados: ${totalCredit} ${currency}
- Descuadre en Partida Doble: ${discrepancy} ${currency}
- Resumen de hallazgos por severidad:
  * Críticos: ${findingsSummary?.critical || 0}
  * Altos: ${findingsSummary?.high || 0}
  * Medios: ${findingsSummary?.medium || 0}
  * Bajos: ${findingsSummary?.low || 0}
- Categorías de anomalías detectadas:
  * Descuadre o inconsistencias de partida doble: ${findingsSummary?.doubleEntry || 0}
  * Registros duplicados: ${findingsSummary?.duplicates || 0}
  * Valores anómalos o montos sospechosos: ${findingsSummary?.anomalies || 0}
  * Campos vacíos o cuentas sin código: ${findingsSummary?.missingFields || 0}
  * Fechas inválidas o fuera de ejercicio: ${findingsSummary?.invalidDates || 0}

Muestra de los hallazgos más relevantes:
${JSON.stringify(topFindings || [], null, 2)}

Por favor, genera un informe técnico ejecutivo en formato JSON estricto con la siguiente estructura:
{
  "executiveSummary": "Párrafo conciso y riguroso evaluando la fiabilidad de la información contable y el estado del libro/balance.",
  "riskLevel": "Bajo" | "Moderado" | "Alto" | "Crítico",
  "opinion": "Favorable" | "Con Salvedades" | "Desfavorable" | "Abstención",
  "keyObservations": ["observación clave 1", "observación clave 2", "observación clave 3"],
  "materialityImpact": "Explicación del impacto económico o material de los descuadres y duplicados.",
  "taxAndLegalImplications": "Posibles riesgos ante la autoridad tributaria o fiscalización por los errores observados.",
  "actionPlan": [
    { "step": 1, "title": "...", "description": "..." },
    { "step": 2, "title": "...", "description": "..." },
    { "step": 3, "title": "...", "description": "..." }
  ],
  "adjustingEntriesRecommendation": "Orientación sobre qué asientos de ajuste contable son requeridos inmediatamente."
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch {
      parsedData = {
        executiveSummary: text,
        riskLevel: 'Moderado',
        opinion: 'Con Salvedades',
        keyObservations: ['Revisión general requerida'],
        materialityImpact: 'Revisión pendiente',
        taxAndLegalImplications: 'Revisar soporte documental de las partidas observadas',
        actionPlan: [],
        adjustingEntriesRecommendation: 'Efectuar conciliación detallada',
      };
    }

    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze:', error);
    res.status(500).json({
      error: 'Error al procesar el análisis con Inteligencia Artificial.',
      details: error?.message || 'Error desconocido',
    });
  }
});

// AI Finding Explanation Endpoint
app.post('/api/ai/explain-finding', async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({
        error: 'Servicio de Inteligencia Artificial no disponible.',
      });
    }

    const { finding, context } = req.body;

    const prompt = `Como auditor contable experto, explica de manera clara y profesional el siguiente hallazgo contable detectado por AUDITA WEB:

Tipo de regla violada: ${finding.rule}
Severidad: ${finding.severity}
Fila o registro: ${finding.rowNumber || 'N/A'}
Columna o Campo: ${finding.field || 'N/A'}
Valor detectado: ${finding.detectedValue}
Valor esperado o regla contable: ${finding.expectedValue}
Detalle: ${finding.description}
Contexto adicional: ${JSON.stringify(context || {})}

Proporciona una respuesta en formato JSON con:
{
  "title": "Título profesional del hallazgo",
  "rootCauseAnalysis": "¿Por qué suele ocurrir este tipo de error contable?",
  "auditingRisk": "¿Qué riesgo implica para la veracidad de los estados financieros?",
  "howToFix": "Procedimiento paso a paso para que el contador corrija o justifique esta partida.",
  "preventiveControl": "Recomendación de control interno para que no vuelva a suceder."
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        title: finding.rule,
        rootCauseAnalysis: finding.description,
        auditingRisk: 'Riesgo de presentación errónea en estados financieros.',
        howToFix: 'Verificar comprobante fuente y realizar asiento de ajuste.',
        preventiveControl: 'Implementar validaciones previas al cierre contable.',
      };
    }

    res.json({ success: true, explanation: parsed });
  } catch (error: any) {
    console.error('Error in /api/ai/explain-finding:', error);
    res.status(500).json({
      error: 'Error al generar explicación del hallazgo.',
      details: error?.message || 'Error desconocido',
    });
  }
});

// Setup Vite development middlewares or serve static production build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AUDITA WEB Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
