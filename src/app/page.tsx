
'use client'; // Make this a client component to manage state

import type { Metadata } from 'next'; // Keep type import if needed elsewhere or remove if not used server-side
import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarTrigger, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { ProspectHuskyLogo } from '@/components/prospecthusky-logo'; // Changed import
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/search-form';
import { Github } from 'lucide-react';
import type { Company } from '@/types/company';
import type { AnalyzeCompanyOutput, AnalyzeCompanyInput } from '@/ai/flows/company-analyzer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { generateEmail, type GenerateEmailInput } from '@/ai/flows/email-generator';
import { Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';


// Metadata object might need adjustment if this page relies heavily on client-side state for its core content title/description.
// For dynamic titles based on state, use `document.title` inside useEffect or consider moving state management higher if needed.
// export const metadata: Metadata = {
//   title: 'ProspectHusky Dashboard', // Changed from ProspectWise
//   description: 'Analyze companies and generate personalized outreach emails.',
// };


export default function DashboardPage() {
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCompanyOutput | null>(null);
  const [analyzedCompany, setAnalyzedCompany] = useState<AnalyzeCompanyInput | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const { toast } = useToast();

  const handleSearchResults = (results: Company[]) => {
    setSearchResults(results);
    setAnalysisResult(null); // Clear previous analysis when new search results arrive
    setAnalyzedCompany(null);
    setGeneratedEmail(null);
  };

  const handleAnalysisComplete = (result: AnalyzeCompanyOutput, company: AnalyzeCompanyInput) => {
    setAnalysisResult(result);
    setAnalyzedCompany(company);
    setSearchResults([]); // Clear search results when analysis is shown
    setGeneratedEmail(null); // Clear previous email
  };

  const handleGenerateEmail = async (emailType: 'collaboration' | 'job_application') => {
    if (!analysisResult || !analyzedCompany) {
        toast({ title: "Error", description: "No analysis available to generate email from.", variant: "destructive" });
        return;
    }
    setIsGeneratingEmail(true);
    setGeneratedEmail(null);

    // TODO: Get user details (name, skills) - replace placeholders
    const userInput: GenerateEmailInput = {
        companyName: analyzedCompany.companyName,
        // Pass the structured analysis report for better context
        analysisReport: JSON.stringify(analysisResult, null, 2),
        emailType: emailType,
        userName: "Your Name", // Placeholder - ideally fetch from user profile/state
        userSkills: "Relevant Skill 1, Relevant Skill 2, Detail about Skill 3", // Placeholder - user should input this
    };

    try {
        toast({ title: "Generating Email...", description: `Drafting ${emailType === 'job_application' ? 'job application' : 'collaboration'} email.` });
        const emailOutput = await generateEmail(userInput);
        setGeneratedEmail(emailOutput.email);
        toast({ title: "Email Generated", description: "Review the draft below." });
    } catch (error) {
        console.error("Error generating email:", error);
        toast({ title: "Email Generation Failed", description: "Could not generate the email.", variant: "destructive" });
        setGeneratedEmail(null);
    } finally {
        setIsGeneratingEmail(false);
    }
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon"> {/* Allow collapsing to icons */}
        <SidebarHeader className="items-center gap-2 border-b border-sidebar-border p-2">
          <ProspectHuskyLogo className="size-6 text-primary" /> {/* Changed component */}
          <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
            ProspectHusky {/* Changed text */}
          </h1>
        </SidebarHeader>
        <SidebarContent className="p-0"> {/* Remove default padding */}
            {/* SearchForm now handles its own padding */}
            <SearchForm onSearchResults={handleSearchResults} onAnalysisComplete={handleAnalysisComplete} />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border mt-auto">
           <Button variant="ghost" size="sm" asChild className="justify-start group-data-[collapsible=icon]:justify-center">
              <a href="https://github.com/firebase/firebase-studio" target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden ml-2">GitHub</span>
              </a>
           </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <SidebarTrigger className="md:hidden" /> {/* Only show trigger on mobile */}
             <h2 className="text-xl font-semibold">
                {analyzedCompany ? `Analysis: ${analyzedCompany.companyName}` : 'Dashboard'}
            </h2>
          </div>
           {/* Add Header actions if needed */}
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {/* Conditional Rendering based on state */}

          {!analysisResult && searchResults.length === 0 && (
             <div className="text-center text-muted-foreground py-10">
                <p>Enter search criteria in the sidebar to find and analyze companies.</p>
             </div>
          )}

          {/* Display Search Results - Basic list for now */}
          {searchResults.length > 0 && !analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>Select a company from the sidebar search form to analyze.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">({searchResults.length} companies found - selection handled in sidebar)</p>
                {/* The selection logic is now inside SearchForm, this is just informational */}
              </CardContent>
            </Card>
          )}


          {/* Display Analysis Result */}
          {analysisResult && analyzedCompany && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Company Overview</CardTitle>
                         {analyzedCompany.websiteUrl && (
                            <a href={analyzedCompany.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                {analyzedCompany.websiteUrl}
                            </a>
                         )}
                         <CardDescription>Analysis Focus: {analyzedCompany.analysisType === 'job' ? 'Job Opportunity' : 'UGC/Social Collaboration'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{analysisResult.companyOverview}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Presence</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{analysisResult.socialMediaPresence}</p>
                    </CardContent>
                </Card>

                 {analysisResult.websiteAnalysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Website Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{analysisResult.websiteAnalysis}</p>
                        </CardContent>
                    </Card>
                )}

                 {analysisResult.jobAnalysis && analyzedCompany.analysisType === 'job' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Analysis</CardTitle>
                            <CardDescription>For role: {analyzedCompany.jobTitle} in {analyzedCompany.location}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{analysisResult.jobAnalysis}</p>
                        </CardContent>
                    </Card>
                 )}

                 {analysisResult.ugcAnalysis && analyzedCompany.analysisType === 'ugc' && (
                     <Card>
                         <CardHeader>
                             <CardTitle>UGC/Social Collaboration Analysis</CardTitle>
                              {analyzedCompany.location && <CardDescription>Location Context: {analyzedCompany.location}</CardDescription>}
                         </CardHeader>
                         <CardContent>
                             <p className="whitespace-pre-wrap">{analysisResult.ugcAnalysis}</p>
                         </CardContent>
                     </Card>
                 )}


                <Card>
                    <CardHeader>
                        <CardTitle>Strategic Approach</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap">{analysisResult.strategicApproach}</p>
                    </CardContent>
                </Card>

                {/* Email Generation Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Outreach Email</CardTitle>
                         <CardDescription>Draft an email based on the analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-wrap gap-2">
                            {analyzedCompany.analysisType === 'ugc' && (
                                 <Button
                                    onClick={() => handleGenerateEmail('collaboration')}
                                    disabled={isGeneratingEmail}
                                    size="sm"
                                    variant="accent"
                                 >
                                    {isGeneratingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                    Generate Collaboration Email
                                 </Button>
                            )}
                            {analyzedCompany.analysisType === 'job' && (
                                  <Button
                                    onClick={() => handleGenerateEmail('job_application')}
                                    disabled={isGeneratingEmail}
                                    size="sm"
                                    variant="accent"
                                 >
                                    {isGeneratingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                    Generate Job Application Email
                                 </Button>
                            )}
                         </div>
                         {generatedEmail && (
                            <div className="pt-4">
                                <Label htmlFor="generated-email" className="mb-2 block">Generated Email Draft:</Label>
                                <Textarea
                                    id="generated-email"
                                    readOnly
                                    value={generatedEmail}
                                    rows={15}
                                    className="font-mono text-sm bg-muted"
                                />
                            </div>
                         )}
                    </CardContent>
                </Card>
            </div>
          )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
