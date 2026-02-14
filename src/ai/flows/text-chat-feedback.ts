'use server';

/**
 * @fileOverview Provides real-time feedback on German text input using Groq SDK.
 *
 * - textChatFeedback - A function that handles the text chat feedback process.
 * - TextChatFeedbackInput - The input type for the textChatFeedback function.
 * - TextChatFeedbackOutput - The return type for the textChatFeedback function.
 */

import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
  englishTranslation: z.string().describe('The English translation of the follow-up question.'),
});
export type TextChatFeedbackOutput = z.infer<typeof TextChatFeedbackOutputSchema>;

export async function textChatFeedback(input: TextChatFeedbackInput): Promise<TextChatFeedbackOutput> {
  const systemPrompt = `You are a helpful German language tutor. 
  The student is at level ${input.languageLevel}.
  
  Your task:
  1. Correct any grammar or vocabulary mistakes in the student's input.
  2. Provide a brief explanation in English for the corrections.
  3. Ask a follow-up question in German appropriate for their level (${input.languageLevel}).
  4. Provide an English translation for that follow-up question.

  You must respond strictly in JSON format:
  {
    "correctedText": "...",
    "explanation": "...",
    "followUpQuestion": "...",
    "englishTranslation": "..."
  }`;

  const userMessage = `Student Input: "${input.germanText}"
  ${input.conversationHistory ? `Context/History:\n${input.conversationHistory}` : ''}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from Groq");

    const parsed = JSON.parse(content);
    return {
      correctedText: parsed.correctedText,
      explanation: parsed.explanation,
      followUpQuestion: parsed.followUpQuestion,
      englishTranslation: parsed.englishTranslation,
    };

  } catch (error) {
    console.error("Groq Text Feedback Error:", error);
    return {
      correctedText: input.germanText,
      explanation: "Entschuldigung, ich konnte das gerade nicht analysieren.",
      followUpQuestion: "Können wir über etwas anderes sprechen?",
      englishTranslation: "Can we talk about something else?"
    };
  }
}
