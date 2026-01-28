import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const MedicineChatBot = (() => {
  
  const generateMedicineSuggestion = async (userMessage) => {
    try {
      const prompt = `
You are an AI medical assistant.  
Understand the user's symptoms (may be in English, Hindi, or Hinglish) 
and provide a clear diagnosis, probable disease, and proper medicine suggestions.

Rules:
- Translate Hinglish automatically.
- Identify the most likely disease.
- Recommend **safe, over-the-counter medicines only**.
- Include dosage, precautions, when to see a doctor.
- Keep explanation simple.
- Output in structured JSON like this:

{
  "disease": "",
  "medicine": "",
  "dosage": "",
  "precautions": "",
  "when_to_visit_doctor": "",
  "translated_message": ""
}

User message: "${userMessage}"
      `;

      const result = await model.generateContent(prompt);
      const replyText = result.response.text();

      // Try parsing JSON
      try {
        return JSON.parse(replyText);
      } catch (e) {
        return { reply: replyText }; // Raw text fallback
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      return { reply: "Something went wrong while contacting AI." };
    }
  };

  return { generateMedicineSuggestion };
})();

export default MedicineChatBot;
