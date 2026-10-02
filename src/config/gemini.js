// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });

// export default ai;
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const testGemini = async () => {
  const response = await ai.models.generateContent({
  model: "gemini-3.6-flash",
    contents: "Reply with exactly: Gemini connection successful",
  });

  return response.text;
};

export default ai;