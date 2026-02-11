'use server';

/**
 * @fileOverview Provides real-time feedback on German text input, including grammar and vocabulary corrections with explanations in English.
 *
 * - textChatFeedback - A function that handles the text chat feedback process.
 * - TextChatFeedbackInput - The input type for the textChatFeedback function.
 * - TextChatFeedbackOutput - The return type for the textChatFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextChatFeedbackInputSchema = z.object({
  germanText: z.string().describe('The German text input from the user.'),
  languageLevel: z
    .enum(['A1', 'A2', 'B1', 'B2'])
    .describe('The CEFR language level of the user.'),
  conversationHistory: z
    .string()
    .optional()
    .describe('The history of the coversation, if any'),
});
export type TextChatFeedbackInput = z.infer<typeof TextChatFeedbackInputSchema>;

const TextChatFeedbackOutputSchema = z.object({
  correctedText: z.string().describe('The corrected German text.'),
  explanation: z.string().describe('The explanation of the corrections in English.'),
  followUpQuestion: z.string().describe('A follow-up question in German to continue the conversation.'),
});
export type TextChatFeedbackOutput = z.infer<typeof TextChatFeedbackOutputSchema>;

export async function textChatFeedback(input: TextChatFeedbackInput): Promise<TextChatFeedbackOutput> {
  return textChatFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textChatFeedbackPrompt',
  input: {schema: TextChatFeedbackInputSchema},
  output: {schema: TextChatFeedbackOutputSchema},
  prompt: `You are a German language tutor providing feedback to a student.

  The student is at level {{languageLevel}}. Their previous conversation, if any, is as follows:
  
  {{#if conversationHistory}}
  Conversation History:
  {{conversationHistory}}
  {{/if}}

  Their input is:
  {{germanText}}

  Correct any grammar and vocabulary mistakes in the student's input.
  Provide explanations for the corrections in English, including the correct German form.
  Ask a follow-up question in German to keep the conversation going, appropriate for the student's level.
  The output should be formatted as a JSON object with the following keys:
  - correctedText: The corrected German text.
  - explanation: The explanation of the corrections in English.
  - followUpQuestion: A follow-up question in German to continue the conversation.
  Remember to adapt your vocabulary and grammar to the student's language level.
  `,
});

const textChatFeedbackFlow = ai.defineFlow(
  {
    name: 'textChatFeedbackFlow',
    inputSchema: TextChatFeedbackInputSchema,
    outputSchema: TextChatFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
