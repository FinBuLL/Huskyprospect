
'use server';

/**
 * @fileOverview Analyzes company information using GenAI to generate a comprehensive report and strategic approach.
 *
 * - analyzeCompany - A function that handles the company analysis process.
 * - AnalyzeCompanyInput - The input type for the analyzeCompany function.
 * - AnalyzeCompanyOutput - The return type for the analyzeCompany function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getSocialMediaProfiles, type SocialMediaProfile} from '@/services/social-media';
import {getJobPostings, type JobPosting} from '@/services/job-boards';
import { getWebsiteContentSummary } from '@/services/website-analyzer'; // Assuming this service exists

const AnalyzeCompanyInputSchema = z.object({
  companyName: z.string().describe('The name of the company to analyze.'),
  websiteUrl: z.string().optional().describe('The URL of the company website (if available).'),
  jobTitle: z.string().optional().describe('The specific job title the user is interested in (if applicable).'),
  location: z.string().optional().describe('The location context for the analysis (e.g., for job search or regional UGC focus).'), // Location now applies to both
  analysisType: z.enum(['job', 'ugc']).describe('The primary focus of the analysis: finding a job or proposing UGC/social collaboration.'),
});
export type AnalyzeCompanyInput = z.infer<typeof AnalyzeCompanyInputSchema>;

const AnalyzeCompanyOutputSchema = z.object({
  companyOverview: z.string().describe('A comprehensive overview of the company, including mission, values, industry, estimated size, and recent activities based on provided data.'),
  socialMediaPresence: z.string().describe('An analysis of the company\'s social media presence, summarizing platforms used, follower engagement (if available), and content themes relevant to the analysis type (UGC/Job).'),
  websiteAnalysis: z.string().optional().describe('Summary of the company website content, focusing on aspects relevant to the analysis type (e.g., careers page info for jobs, marketing/community info for UGC).'),
  jobAnalysis: z.string().optional().describe('If analysisType is job and jobTitle/location provided, analysis of the role\'s potential fit, required skills based on simulated postings, and alignment with company culture/activities.'), // Refined description
  ugcAnalysis: z.string().optional().describe('If analysisType is UGC, assessment of the company\'s suitability for UGC/social media collaboration based on their online presence and marketing activities. Consider location if provided.'), // Refined description
  strategicApproach: z.string().describe('A strategic game plan outlining how to approach the company, including suggested contact points, key talking points for email/outreach, and next steps tailored to the analysis type (Job application or UGC proposal).'),
});
export type AnalyzeCompanyOutput = z.infer<typeof AnalyzeCompanyOutputSchema>;

export async function analyzeCompany(input: AnalyzeCompanyInput): Promise<AnalyzeCompanyOutput> {
  return analyzeCompanyFlow(input);
}

// Define prompt input schema incorporating fetched data
const AnalyzeCompanyPromptInputSchema = AnalyzeCompanyInputSchema.extend({
    simulatedWebsiteSummary: z.string().optional().describe('Simulated summary of the company website content.'),
    simulatedSocialProfiles: z.array(z.object({ // Pass structured data
        platform: z.string(),
        profileUrl: z.string(),
        followers: z.number(),
    })).optional().describe('Simulated social media profile data.'),
    simulatedJobPostings: z.array(z.object({ // Pass structured data
        title: z.string(),
        company: z.string(),
        description: z.string(),
        applyUrl: z.string(),
        location: z.string(),
    })).optional().describe('Simulated job postings relevant to the search criteria.'),
});


const analyzeCompanyPrompt = ai.definePrompt({
  name: 'analyzeCompanyPrompt',
  input: {
    schema: AnalyzeCompanyPromptInputSchema,
  },
  output: {
    schema: AnalyzeCompanyOutputSchema, // Use the refined output schema
  },
  prompt: `
You are a Company Analyst and Strategist AI. Your task is to generate a comprehensive report and strategic approach plan for a user looking to engage with a specific company.

The user's goal is to either find a job opportunity or propose a UGC/Social Media collaboration.

**Analysis Context:**
- Company Name: {{{companyName}}}
- Company Website: {{{websiteUrl}}}
- Analysis Focus: {{analysisType}}
{{#if jobTitle}}
- Target Job Title: {{{jobTitle}}}
{{/if}}
{{#if location}}
- Target Location: {{{location}}}
{{/if}}


**Provided Information (Simulated):**

{{#if simulatedWebsiteSummary}}
**Website Summary:**
{{{simulatedWebsiteSummary}}}
{{else}}
**Website Summary:** Not available.
{{/if}}

{{#if simulatedSocialProfiles}}
**Social Media Profiles:**
{{#each simulatedSocialProfiles}}
- Platform: {{platform}}, URL: {{profileUrl}}, Followers: {{followers}}
{{/each}}
{{else}}
**Social Media Profiles:** No specific data available.
{{/if}}

{{#if simulatedJobPostings}}
**Relevant Job Postings Found (Simulated):**
{{#each simulatedJobPostings}}
- Title: {{title}} at {{company}} (Location: {{location}})
  Description Snippet: {{description}}
  Apply Link: {{applyUrl}}
{{/each}}
{{else}}
**Relevant Job Postings Found (Simulated):** {{#if (eq analysisType 'job')}}None found based on criteria.{{else}}Not applicable for UGC analysis focus.{{/if}}
{{/if}}

**Analysis Task:**

Based *only* on the provided information above, generate the following sections:

1.  **Company Overview:** Provide a summary covering the company's likely mission/values, industry, estimated size, and recent activities as inferred *from the provided data*. Mention location if relevant.
2.  **Social Media Presence:** Analyze their activity on the listed platforms. Comment on follower counts (if significant) and infer content themes. Relate this to the user's 'Analysis Focus' ({{analysisType}}).
3.  **Website Analysis:** (If website summary provided) Summarize key takeaways from the website relevant to the 'Analysis Focus'. For 'job' focus, mention careers info. For 'ugc' focus, mention marketing/community pages.
4.  **Job Analysis:** (Only if 'Analysis Focus' is 'job' AND 'Target Job Title' is provided AND 'Target Location' is provided AND simulatedJobPostings exist) Analyze the potential fit for the '{{jobTitle}}' role based *only* on the simulated postings. Mention likely required skills and alignment with company activities inferred from other data. If no postings found, state that.
5.  **UGC Analysis:** (Only if 'Analysis Focus' is 'ugc') Assess the company's suitability for UGC/Social Media collaboration based on their social media presence and website summary (if available). Are they active? Do they engage with community? If location '{{{location}}}' was provided, comment if their online presence seems relevant to that location.
6.  **Strategic Approach:** Create a step-by-step game plan for the user.
    - If 'Analysis Focus' is 'job': Suggest how to tailor their application/outreach, mention key skills to highlight based on the job analysis, potential contact points (e.g., apply link, LinkedIn connection), and next steps.
    - If 'Analysis Focus' is 'ugc': Suggest how to frame a collaboration proposal, highlight relevant aspects of their online presence (mentioning location relevance if applicable), potential benefits for the company, and next steps for outreach.

**Important:** Base your entire analysis *strictly* on the simulated data provided above. Do not invent information or assume external knowledge. If data for a section is missing, state that clearly.
`,
});

const analyzeCompanyFlow = ai.defineFlow<
  typeof AnalyzeCompanyInputSchema,
  typeof AnalyzeCompanyOutputSchema
>(
  {
    name: 'analyzeCompanyFlow',
    inputSchema: AnalyzeCompanyInputSchema,
    outputSchema: AnalyzeCompanyOutputSchema,
  },
  async (input) => {
    // 1. Fetch Simulated Data
    let simulatedWebsiteSummary: string | undefined;
    if (input.websiteUrl) {
      // In a real scenario, you'd scrape or use an API. Here, we simulate.
      simulatedWebsiteSummary = await getWebsiteContentSummary(input.websiteUrl);
    }

    const simulatedSocialProfiles: SocialMediaProfile[] = await getSocialMediaProfiles(input.companyName);

    let simulatedJobPostings: JobPosting[] | undefined;
    // Only fetch job postings if analysis type is 'job' and title/location are provided
    if (input.analysisType === 'job' && input.jobTitle && input.location) {
      simulatedJobPostings = await getJobPostings(input.jobTitle, input.location);
      // Filter postings to roughly match the company if needed (simulation might return broader results)
      // More specific filtering might be needed depending on the job board service quality
      simulatedJobPostings = simulatedJobPostings.filter(job =>
          job.company.toLowerCase().includes(input.companyName.toLowerCase().split(' ')[0].toLowerCase()) &&
          job.location.toLowerCase().includes(input.location?.toLowerCase() ?? '')
      );
    }

    // 2. Prepare Prompt Input
    const promptInput: z.infer<typeof AnalyzeCompanyPromptInputSchema> = {
        ...input,
        simulatedWebsiteSummary,
        simulatedSocialProfiles: simulatedSocialProfiles.length > 0 ? simulatedSocialProfiles : undefined,
        simulatedJobPostings: simulatedJobPostings && simulatedJobPostings.length > 0 ? simulatedJobPostings : undefined,
    };


    // 3. Call the LLM
    const {output} = await analyzeCompanyPrompt(promptInput);

    // 4. Return the structured output
    // Ensure all fields from AnalyzeCompanyOutputSchema are present, even if empty/null based on logic
    return {
      companyOverview: output?.companyOverview ?? "Could not generate company overview.",
      socialMediaPresence: output?.socialMediaPresence ?? "Could not generate social media analysis.",
      websiteAnalysis: output?.websiteAnalysis, // Optional based on prompt logic
      jobAnalysis: output?.jobAnalysis, // Optional based on prompt logic
      ugcAnalysis: output?.ugcAnalysis, // Optional based on prompt logic
      strategicApproach: output?.strategicApproach ?? "Could not generate strategic approach.",
    };
  }
);

