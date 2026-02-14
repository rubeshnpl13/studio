import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';

export const ai = genkit({
  plugins: [
    googleAI(),
    groq(),
  ],
  model: 'groq/llama3-8b-8192',
});
