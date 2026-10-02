import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const testGeminiImage = async () => {
  const interaction = await ai.interactions.create({
    model: "gemini-3.1-flash-image",
    input: "Create a simple fashion product image of an elegant Indian lehenga.",
    response_format: {
      type: "image",
      aspect_ratio: "1:1",
    },
  });

  return interaction.output_image;
};

export default ai;