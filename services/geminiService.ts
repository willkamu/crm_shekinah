import { GoogleGenAI } from "@google/genai";
import { Member, HistoryRecord } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY; 
  // In a real app, this comes from env. For this demo we gracefully fail if missing.
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generatePastoralInsight = async (member: Member, history: HistoryRecord[]): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "API Key no configurada. Por favor configure su API Key de Google Gemini para recibir asistencia pastoral.";
  }

  const historyText = history.map(h => `- ${h.fecha} [${h.tipo}]: ${h.detalle}`).join('\n');

  const prompt = `
    Actúa como un asistente pastoral sabio y experimentado para la iglesia 'La Shekinah'.
    Analiza el siguiente perfil de un miembro y su historial pastoral.
    Proporciona un resumen breve de su estado espiritual y 3 sugerencias concretas de ministración o consejería.
    
    Perfil del Miembro:
    - Nombre: ${member.nombres}
    - Estatus: ${member.estatus}
    - Nivel de Asistencia: ${member.attendance_level}
    - Cursos Completados: ${member.coursesCompletedIds.length}/7
    
    Historial Reciente:
    ${historyText}
    
    Mantén el tono respetuoso, confidencial y enfocado en el crecimiento espiritual.
    Responde en formato Markdown limpio.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al conectar con el asistente pastoral. Verifique su conexión.";
  }
};