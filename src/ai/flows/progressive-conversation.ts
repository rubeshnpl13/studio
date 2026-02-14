// 'use server';

// /**
//  * @fileOverview An AI agent that progressively adapts the conversation based on the user's understanding and progress.
//  *
//  * - progressiveConversation - A function that handles the progressive conversation flow.
//  * - ProgressiveConversationInput - The input type for the progressiveConversation function.
//  * - ProgressiveConversationOutput - The return type for the progressiveConversation function.
//  */

// import {ai} from '@/ai/genkit';
// import {z} from 'genkit';
// import Groq from 'groq-sdk';

// // Initialize Groq with your API Key
// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// const ProgressiveConversationInputSchema = z.object({
//   level: z.enum(['A1', 'A2', 'B1', 'B2']).describe('The CEFR language level.'),
//   topic: z.string().describe('The current topic of the conversation.'),
//   userMessage: z.string().describe('The user message in German.'),
//   conversationHistory: z.array(z.object({
//     role: z.enum(['user', 'tutor']),
//     content: z.string(),
//   })).optional().describe('The history of the conversation.'),
// });
// export type ProgressiveConversationInput = z.infer<typeof ProgressiveConversationInputSchema>;

// const ProgressiveConversationOutputSchema = z.object({
//   tutorMessage: z.string().describe('The tutor message in German.'),
//   shouldIntroduceNewConcept: z.boolean().describe('Whether the tutor should introduce a new concept.'),
// });
// export type ProgressiveConversationOutput = z.infer<typeof ProgressiveConversationOutputSchema>;

// export async function progressiveConversation(input: ProgressiveConversationInput): Promise<ProgressiveConversationOutput> {
//   return progressiveConversationFlow(input);
// }

// const prompt = ai.definePrompt({
//   name: 'progressiveConversationPrompt',
//   input: {schema: ProgressiveConversationInputSchema},
//   output: {schema: ProgressiveConversationOutputSchema},
//   prompt: `You are a German language tutor adapting to the user's level ({{{level}}}) and current topic ({{{topic}}}).

//   The user will send a message in German, and your job is to respond in German, and help them improve their German language skills.
//   The CEFR level is an important aspect of this task. You should use vocabulary appropriate for the level, keep sentence structure appropriate for the level, and correct any mistakes that the user makes.

//   Conversation History:
//   {{#each conversationHistory}}
//     {{role}}: {{{content}}}
//   {{/each}}

//   User: {{{userMessage}}}

//   Consider the user's message and conversation history. Decide whether to introduce a new concept or reinforce familiar ones. Set the shouldIntroduceNewConcept boolean accordingly.
//   If they are struggling, reinforce familiar concepts. If they are doing well, introduce new concepts.

//   Respond with a tutor message in German, formatted in markdown.

//   Make sure to respond using the following JSON format:
//   {
//     "tutorMessage": "...",
//     "shouldIntroduceNewConcept": true|false
//   }
// `,
//   config: {
//     safetySettings: [
//       {
//         category: 'HARM_CATEGORY_HATE_SPEECH',
//         threshold: 'BLOCK_ONLY_HIGH',
//       },
//       {
//         category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
//         threshold: 'BLOCK_NONE',
//       },
//       {
//         category: 'HARM_CATEGORY_HARASSMENT',
//         threshold: 'BLOCK_MEDIUM_AND_ABOVE',
//       },
//       {
//         category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
//         threshold: 'BLOCK_LOW_AND_ABOVE',
//       },
//     ],
//   },
// });

// const progressiveConversationFlow = ai.defineFlow(
//   {
//     name: 'progressiveConversationFlow',
//     inputSchema: ProgressiveConversationInputSchema,
//     outputSchema: ProgressiveConversationOutputSchema,
//   },
//   async input => {
//     const {output} = await prompt(input);
//     return output!;
//   }
// );


'use server';

import { z } from 'zod';
import Groq from 'groq-sdk';

// Initialize Groq with your API Key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// --- Input/Output Schemas (Kept exactly the same so your app doesn't break) ---

const ProgressiveConversationInputSchema = z.object({
  level: z.enum(['A1', 'A2', 'B1', 'B2']).describe('The CEFR language level.'),
  topic: z.string().describe('The current topic of the conversation.'),
  userMessage: z.string().describe('The user message in German.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'tutor']),
    content: z.string(),
  })).optional().describe('The history of the conversation.'),
});

export type ProgressiveConversationInput = z.infer<typeof ProgressiveConversationInputSchema>;

const ProgressiveConversationOutputSchema = z.object({
  tutorMessage: z.string().describe('The tutor message in German.'),
  shouldIntroduceNewConcept: z.boolean().describe('Whether the tutor should introduce a new concept.'),
});

export type ProgressiveConversationOutput = z.infer<typeof ProgressiveConversationOutputSchema>;

// --- The Main Function (Now Powered by Groq) ---

export async function progressiveConversation(input: ProgressiveConversationInput): Promise<ProgressiveConversationOutput> {
  
  // 1. Create the System Prompt
  const systemPrompt = `You are a helpful German language tutor.
  User Level: ${input.level}
  Topic: ${input.topic}

  Your goal is to help the user improve their German speaking skills.
  
  RULES:
  - Respond ONLY in German.
  - Use vocabulary and grammar appropriate for ${input.level}.
  - Keep responses concise (1-2 sentences) since this is a voice conversation.
  - If the user makes a mistake, correct it gently in your reply.
  
  You must respond in valid JSON format:
  {
    "tutorMessage": "Your German response here",
    "shouldIntroduceNewConcept": true (if they are doing well) or false (if struggling)
  }`;

  // 2. Build the message history for Groq
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Convert your app's history format to Groq's format
  if (input.conversationHistory) {
    input.conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role === 'tutor' ? 'assistant' : 'user',
        content: msg.content
      });
    });
  }

  // Add the latest user message
  messages.push({ role: 'user', content: input.userMessage });

  try {
    // 3. Call Groq (Llama 3.3 is excellent for languages)
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' }, // Forces JSON output
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from Groq");

    const parsed = JSON.parse(content);

    return {
      tutorMessage: parsed.tutorMessage,
      shouldIntroduceNewConcept: parsed.shouldIntroduceNewConcept
    };

  } catch (error) {
    console.error("Groq API Error:", error);
    return {
      tutorMessage: "Entschuldigung, ich habe ein Verbindungsproblem. Bitte sagen Sie das noch einmal.",
      shouldIntroduceNewConcept: false
    };
  }
}