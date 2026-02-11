'use server';

/**
 * @fileOverview Implements voice chat error correction for the Sprachheld app.
 *
 * This file defines a Genkit flow that handles error correction during voice conversations.
 * When the user makes a mistake, the tutor switches to English to explain the correction
 * before continuing the conversation in German.
 *
 * @exports correctVoiceChatError - The main function to correct voice chat errors.
 * @exports VoiceChatErrorCorrectionInput - The input type for the correctVoiceChatError function.
 * @exports VoiceChatErrorCorrectionOutput - The output type for the correctVoiceChatError function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceChatErrorCorrectionInputSchema = z.object({
  userMessage: z.string().describe('The user\'s message in German.'),
  correctedMessage: z.string().describe('The corrected version of the user\'s message in German.'),
  explanation: z.string().describe('The explanation of the error in English.'),
  germanLevel: z.enum(['A1', 'A2', 'B1', 'B2']).describe('The CEFR level of the user.'),
});
export type VoiceChatErrorCorrectionInput = z.infer<typeof VoiceChatErrorCorrectionInputSchema>;

const VoiceChatErrorCorrectionOutputSchema = z.object({
  englishExplanation: z.string().describe('The tutor\'s explanation of the error in English.'),
  germanFollowUp: z.string().describe('The tutor\'s follow-up question in German.'),
});
export type VoiceChatErrorCorrectionOutput = z.infer<typeof VoiceChatErrorCorrectionOutputSchema>;

export async function correctVoiceChatError(
  input: VoiceChatErrorCorrectionInput
): Promise<VoiceChatErrorCorrectionOutput> {
  return voiceChatErrorCorrectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceChatErrorCorrectionPrompt',
  input: {
    schema: VoiceChatErrorCorrectionInputSchema,
  },
  output: {
    schema: VoiceChatErrorCorrectionOutputSchema,
  },
  prompt: `You are a German language tutor. The student made a mistake in their spoken German.

  First, provide the explanation in English: {{{explanation}}}.

  Then, provide a follow-up question in German appropriate for CEFR level {{{germanLevel}}} to encourage them to continue the conversation. The original (incorrect) message was: {{{userMessage}}}. The corrected message is: {{{correctedMessage}}}.

  The response should be formatted as follows:

  {"englishExplanation": "[Explanation in English]", "germanFollowUp": "[Follow-up question in German]"}`,
});

const voiceChatErrorCorrectionFlow = ai.defineFlow(
  {
    name: 'voiceChatErrorCorrectionFlow',
    inputSchema: VoiceChatErrorCorrectionInputSchema,
    outputSchema: VoiceChatErrorCorrectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
