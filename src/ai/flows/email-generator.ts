'use server';
/**
 * @fileOverview Generates personalized emails for outreach.
 *
 * - generateEmail - A function that generates a personalized email.
 * - GenerateEmailInput - The input type for the generateEmail function.
 * - GenerateEmailOutput - The return type for the generateEmail function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { enforceRateLimit } from '@/lib/rate-limit';

const GenerateEmailInputSchema = z.object({
  companyName: z.string().trim().min(1).max(200).describe('The name of the company to send the email to.'),
  analysisReport: z.string().max(20_000).describe('The comprehensive analysis report of the company.'),
  emailType: z.enum(['collaboration', 'job_application']).describe('The type of email to generate.'),
  userName: z.string().trim().max(200).describe('The name of the user.'),
  userSkills: z.string().max(2_000).describe('The skills of the user.'),
});
export type GenerateEmailInput = z.infer<typeof GenerateEmailInputSchema>;

const GenerateEmailOutputSchema = z.object({
  email: z.string().describe('The generated personalized email.'),
});
export type GenerateEmailOutput = z.infer<typeof GenerateEmailOutputSchema>;

export async function generateEmail(input: GenerateEmailInput): Promise<GenerateEmailOutput> {
  await enforceRateLimit('generateEmail', 10, 60_000);
  // Server actions are public endpoints: re-validate input on the server.
  return generateEmailFlow(GenerateEmailInputSchema.parse(input));
}

const prompt = ai.definePrompt({
  name: 'generateEmailPrompt',
  input: {
    schema: GenerateEmailInputSchema,
  },
  output: {
    schema: z.object({
      email: z.string().describe('The generated personalized email.'),
    }),
  },
  prompt: `You are an expert email writer specializing in personalized outreach.

You will use the company analysis report, the user's skills, and the email type to draft a personalized email.

Company Name: {{{companyName}}}
Analysis Report: {{{analysisReport}}}
Email Type: {{emailType}}
User Name: {{{userName}}}
User Skills: {{{userSkills}}}

Draft a personalized email based on the information above. If the email type is collaboration, propose a collaboration for UGC/social media work. If the email type is job_application, express interest in employment.

Make sure the email is professional and highlights how the user's skills match the company's needs. Suggest the next steps for cooperation.

Email:
`,
});

const generateEmailFlow = ai.defineFlow<
  typeof GenerateEmailInputSchema,
  typeof GenerateEmailOutputSchema
>(
  {
    name: 'generateEmailFlow',
    inputSchema: GenerateEmailInputSchema,
    outputSchema: GenerateEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
