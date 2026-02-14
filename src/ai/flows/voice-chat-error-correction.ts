// 'use server';

// /**
//  * @fileOverview Implements voice chat error correction for the Sprachheld app.
//  *
//  * This file defines a Genkit flow that handles error correction during voice conversations.
//  * When the user makes a mistake, the tutor switches to English to explain the correction
//  * before continuing the conversation in German.
//  *
//  * @exports correctVoiceChatError - The main function to correct voice chat errors.
//  * @exports VoiceChatErrorCorrectionInput - The input type for the correctVoiceChatError function.
//  * @exports VoiceChatErrorCorrectionOutput - The output type for the correctVoiceChatError function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';

// const VoiceChatErrorCorrectionInputSchema = z.object({
//   userMessage: z.string().describe('The user\'s message in German.'),
//   correctedMessage: z.string().describe('The corrected version of the user\'s message in German.'),
//   explanation: z.string().describe('The explanation of the error in English.'),
//   germanLevel: z.enum(['A1', 'A2', 'B1', 'B2']).describe('The CEFR level of the user.'),
// });
// export type VoiceChatErrorCorrectionInput = z.infer<typeof VoiceChatErrorCorrectionInputSchema>;

// const VoiceChatErrorCorrectionOutputSchema = z.object({
//   englishExplanation: z.string().describe('The tutor\'s explanation of the error in English.'),
//   germanFollowUp: z.string().describe('The tutor\'s follow-up question in German.'),
// });
// export type VoiceChatErrorCorrectionOutput = z.infer<typeof VoiceChatErrorCorrectionOutputSchema>;

// export async function correctVoiceChatError(
//   input: VoiceChatErrorCorrectionInput
// ): Promise<VoiceChatErrorCorrectionOutput> {
//   return voiceChatErrorCorrectionFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'voiceChatErrorCorrectionPrompt',
//   input: {
//     schema: VoiceChatErrorCorrectionInputSchema,
//   },
//   output: {
//     schema: VoiceChatErrorCorrectionOutputSchema,
//   },
//   prompt: `You are a German language tutor. The student made a mistake in their spoken German.

//   First, provide the explanation in English: {{{explanation}}}.

//   Then, provide a follow-up question in German appropriate for CEFR level {{{germanLevel}}} to encourage them to continue the conversation. The original (incorrect) message was: {{{userMessage}}}. The corrected message is: {{{correctedMessage}}}.

//   The response should be formatted as follows:

//   {"englishExplanation": "[Explanation in English]", "germanFollowUp": "[Follow-up question in German]"}`,
// });

// const voiceChatErrorCorrectionFlow = ai.defineFlow(
//   {
//     name: 'voiceChatErrorCorrectionFlow',
//     inputSchema: VoiceChatErrorCorrectionInputSchema,
//     outputSchema: VoiceChatErrorCorrectionOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );


'use server';

import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Input/Output Schemas ---

const VoiceChatErrorCorrectionInputSchema = z.object({
  userMessage: z.string().describe('The message the user actually said.'),
  correctedMessage: z.string().describe('The grammatically correct version.'),
  explanation: z.string().describe('A brief explanation of why it was wrong.'),
  germanLevel: z.string().describe('The CEFR level of the user.'),
});

export type VoiceChatErrorCorrectionInput = z.infer<typeof VoiceChatErrorCorrectionInputSchema>;

const VoiceChatErrorCorrectionOutputSchema = z.object({
  englishExplanation: z.string().describe('A friendly explanation in English.'),
  germanFollowUp: z.string().describe('A follow-up practice sentence in German.'),
});

export type VoiceChatErrorCorrectionOutput = z.infer<typeof VoiceChatErrorCorrectionOutputSchema>;

// --- The Main Function ---

export async function correctVoiceChatError(input: VoiceChatErrorCorrectionInput): Promise<VoiceChatErrorCorrectionOutput> {
  
  const systemPrompt = `You are a friendly German tutor. The user made a mistake.
  
  User said: "${input.userMessage}"
  Correct form: "${input.correctedMessage}"
  Context: ${input.explanation}
  Target Level: ${input.germanLevel}

  Please provide a JSON response with:
  1. "englishExplanation": A short, encouraging explanation in English suitable for a beginner.
  2. "germanFollowUp": A simple practice sentence or question in German using the correct form.
  
  Example JSON:
  {
    "englishExplanation": "In German, we use 'to have' for hunger, not 'to be'.",
    "germanFollowUp": "Hast du auch Durst?"
  }`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: "Please explain my mistake." }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from Groq");

    const parsed = JSON.parse(content);

    return {
      englishExplanation: parsed.englishExplanation,
      germanFollowUp: parsed.germanFollowUp
    };

  } catch (error) {
    console.error("Groq Correction Error:", error);
    return {
      englishExplanation: "You made a small mistake, but that's okay!",
      germanFollowUp: input.correctedMessage
    };
  }
}