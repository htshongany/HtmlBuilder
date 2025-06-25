import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GenerationParams, GroundingChunk } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Please ensure it is configured.");
  // alert("Gemini API Key is not configured. Please contact support or check environment variables.");
  // In a real app, you might want to prevent API calls or show a more prominent error.
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Provide a fallback to avoid crash if API_KEY is undefined

function buildPrompt(params: GenerationParams): string {
  let prompt = `You are an expert AI assistant that generates clean, responsive HTML code with Tailwind CSS classes.
Based on the provided image and the following user specifications, generate the HTML code for the requested component or page.
If the "Include Functional JavaScript" option is true, also generate any necessary JavaScript to make the component interactive (e.g., for hamburger menus, carousels, modals).
The JavaScript should be included within a single <script> tag, ideally placed at the end of the generated HTML body or component.
Do NOT include any explanatory text or comments outside the HTML and script tags. Do NOT use markdown code fences (like \`\`\`html ... \`\`\`) around the output. Output only the raw HTML code (and script tag if applicable).

User Specifications:
- Target Component Type: "${params.componentType}"
- Desired Structure/Template: "${params.templateStructure}"`;

  if (params.customPromptText && params.customPromptText.trim() !== "") {
    prompt += `\n- Custom Instructions: "${params.customPromptText.trim()}"`;
  }

  prompt += `
- Include Responsive Design: ${params.advancedOptions.responsive}
- Optimize for Semantic HTML and Performance: ${params.advancedOptions.performance}
- Include Accessibility Features (ARIA attributes, etc.): ${params.advancedOptions.accessibility}
- Include Functional JavaScript: ${params.advancedOptions.javascript}

The user has provided an image as a visual reference for the desired output. Analyze the image and incorporate its design elements (layout, colors, typography if discernible) into the generated HTML and Tailwind CSS.
Generate the HTML code block (and a single <script> tag if JavaScript is requested and necessary).`;
  return prompt;
}

export const generateHtmlFromImage = async (
  params: GenerationParams,
  signal?: AbortSignal
): Promise<{html: string, sources: GroundingChunk[] | null}> => {
  if (!API_KEY) {
    throw new Error("API_KEY is not configured. Cannot call Gemini API.");
  }

  const imagePart: Part = {
    inlineData: {
      mimeType: params.mimeType,
      data: params.imageDataBase64.split(',')[1], // Remove the "data:mime/type;base64," prefix
    },
  };

  const textPart: Part = {
    text: buildPrompt(params),
  };

  try {
    // Ajout du signal d'annulation si supporté
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT, 
      contents: [{ parts: [imagePart, textPart] }],
      ...(signal ? { signal } : {})
    } as any); // cast as any pour supporter le signal si la lib le permet
    
    let generatedText = response.text || "";

    // Clean potential markdown fences (though prompt tries to prevent them)
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = generatedText.match(fenceRegex);
    if (match && match[2]) {
      generatedText = match[2].trim();
    }
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.filter(chunk => chunk.web) as GroundingChunk[] || null;

    return { html: generatedText.trim(), sources };

  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      throw new Error('Génération annulée.');
    }
    console.error("Error generating content with Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("The provided API key is not valid. Please check your configuration.");
        }
         throw new Error(`Failed to generate HTML from image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating HTML.");
  }
};