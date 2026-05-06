import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function summarizeIncident(description: string, language: string = 'en-US'): Promise<string> {
  const model = "gemini-3-flash-preview";
  const prompt = `Summarize the following traffic incident description in a very concise, professional way (max 15 words) for a technical dashboard. 
  The summary MUST be in the following language: ${language}.
  Use uppercase for the output if appropriate for the language:
  
  Description: ${description}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "SUMMARY UNAVAILABLE";
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    return "ERROR GENERATING SUMMARY";
  }
}

export async function summarizeSystemStatus(incidents: any[], language: string = 'en-US'): Promise<string> {
  const model = "gemini-3-flash-preview";
  const incidentList = incidents.map(i => `${i.type} at ${i.location}: ${i.description}`).join('\n');
  
  const prompt = `You are a Tactical Traffic Intelligence Officer. Provide a high-level situational awareness briefing (max 30 words) based on the following active incidents. 
  Focus on the overall system health and critical bottlenecks.
  Language: ${language}.
  AESTHETIC: PROFESSIONAL, TECHNICAL, UPPERCASE.
  
  INCIDENTS:
  ${incidentList}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return response.text || "STATUS_ANALYSIS_OFFLINE";
  } catch (error) {
    console.error("Gemini System Status Error:", error);
    return "TACTICAL_LINK_ERROR";
  }
}
