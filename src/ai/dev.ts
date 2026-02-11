import { config } from 'dotenv';
config();

import '@/ai/flows/voice-chat-error-correction.ts';
import '@/ai/flows/text-chat-feedback.ts';
import '@/ai/flows/progressive-conversation.ts';