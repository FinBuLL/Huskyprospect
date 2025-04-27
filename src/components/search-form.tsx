
'use client';

import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeCompany, type AnalyzeCompanyInput, type AnalyzeCompanyOutput } from '@/ai/flows/company-analyzer';
import { searchCompanies } from '@/services/company-search';
import type { Company, CompanySearchCriteria } from '@/types/company';


const searchFormSchema = z.object({
  searchType: z.enum(['job', 'ugc'], {
    required_error: 'Please select a search type.',
  }),
  jobTitle: z.string().optional(),
  location: z.string().optional(), // Keep location optional for both
  companyName: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
}).refine(data => {
    // If job search, require (Job Title AND Location) OR Company Name
    if (data.searchType === 'job') {
        return (data.jobTitle && data.location) || data.companyName;
    }
    // If UGC search, require Company Name
    if (data.searchType === 'ugc') {
        return !!data.companyName;
    }
    return true; // Should not happen if searchType is validated
}, {
    // Refine the error message to be more specific per type
    message: 'For Job Search: Provide Company Name OR (Job Title & Location). For UGC Search: Provide Company Name.',
    // Decide on the best path to show the error, maybe a general one or specific to the primary field
    path: ['companyName'],
});


type SearchFormValues = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
    onAnalysisComplete: (result: AnalyzeCompanyOutput, company: AnalyzeCompanyInput) => void;
    onSearchResults: (results: Company[]) => void;
}

export function SearchForm({ onAnalysisComplete, onSearchResults }: SearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const { toast } = useToast();

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      searchType: 'job',
      jobTitle: '',
      location: '',
      companyName: '',
      websiteUrl: '',
    },
  });

  const searchType = form.watch('searchType');

  async function performAnalysis(analysisInput: AnalyzeCompanyInput) {
      setIsAnalyzing(true);
      try {
           toast({ title: "Analyzing Company...", description: `Running analysis for ${analysisInput.companyName}` });
           const result = await analyzeCompany(analysisInput);
           toast({ title: "Analysis Complete", description: `Report generated for ${analysisInput.companyName}` });
           onAnalysisComplete(result, analysisInput); // Pass analysis up
      } catch (error) {
          console.error("Error during analysis:", error);
          toast({ title: "Analysis Failed", description: "Could not analyze the company.", variant: "destructive" });
          // Clear results on failure in parent? Or handle there?
          // onAnalysisComplete(null, null); // Indicate failure if needed
      } finally {
          setIsAnalyzing(false);
          setIsLoading(false); // Ensure loading stops regardless of path
      }
  }


  async function onSubmit(data: SearchFormValues) {
    setIsLoading(true);
    setSearchResults([]); // Clear previous local search results
    onSearchResults([]); // Clear parent search results
    // Do not clear analysis results here, let the parent handle it based on new analysis

    let companyToAnalyze: AnalyzeCompanyInput | null = null;
    const analysisType = data.searchType; // Capture the analysis type

    try {
      if (data.searchType === 'job') {
        if (data.companyName) {
            // Prioritize direct company search if name provided
            toast({ title: "Searching Database...", description: `Looking up ${data.companyName}` });
            const criteria: CompanySearchCriteria = { name: data.companyName };
            const companies = await searchCompanies(criteria, 1);
            if (companies.length > 0) {
                const foundCompany = companies[0];
                companyToAnalyze = {
                    companyName: foundCompany.name,
                    websiteUrl: foundCompany.websiteUrl || data.websiteUrl || undefined,
                    jobTitle: data.jobTitle || undefined,
                    location: data.location || undefined, // Pass location if provided
                    analysisType: analysisType,
                };
                 await performAnalysis(companyToAnalyze);
            } else {
                 toast({ title: "Database Search Failed", description: `Could not find ${data.companyName}. Trying analysis with provided info...` });
                 // Fallback: Analyze directly if DB search fails but job info exists
                 if (data.jobTitle && data.location) {
                    companyToAnalyze = {
                        companyName: data.companyName,
                        websiteUrl: data.websiteUrl || undefined,
                        jobTitle: data.jobTitle,
                        location: data.location,
                        analysisType: analysisType,
                    };
                    await performAnalysis(companyToAnalyze);
                 } else {
                    // Need company name OR job+location for job search
                    toast({ title: "Missing Information", description: "Please provide Job Title & Location if Company Name is not found.", variant: "destructive" });
                    setIsLoading(false);
                 }
            }
        } else if (data.jobTitle && data.location) {
          // Simulate external job board search
          toast({ title: "Simulating Job Board Search...", description: `Searching for ${data.jobTitle} in ${data.location}.` });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
          // Assume we found a company (or multiple, but we pick one for direct analysis simulation)
          const simulatedCompanyName = "Simulated Job Board Co."; // Example
          companyToAnalyze = {
             companyName: simulatedCompanyName,
             websiteUrl: `https://${simulatedCompanyName.toLowerCase().replace(/\s+/g, '')}.com` || undefined, // Generate plausible fake URL
             jobTitle: data.jobTitle,
             location: data.location,
             analysisType: analysisType
          };
          await performAnalysis(companyToAnalyze);
        } else {
             // Need company name OR job+location for job search
             toast({ title: "Missing Information", description: "Please provide Company Name or both Job Title & Location.", variant: "destructive" });
             setIsLoading(false);
        }

      } else if (data.searchType === 'ugc' && data.companyName) {
        toast({ title: "Searching Database...", description: `Looking up ${data.companyName}` });
        // UGC search primarily uses company name, location is optional context
        const criteria: CompanySearchCriteria = { name: data.companyName };
        const companies = await searchCompanies(criteria, 5);

        if (companies.length === 1) {
          const foundCompany = companies[0];
          companyToAnalyze = {
            companyName: foundCompany.name,
            websiteUrl: foundCompany.websiteUrl || data.websiteUrl || undefined,
            analysisType: analysisType,
            jobTitle: data.jobTitle || undefined, // Pass along if user entered it
            location: data.location || undefined, // Pass location if provided
          };
          await performAnalysis(companyToAnalyze);
        } else if (companies.length > 1) {
          toast({ title: "Multiple Companies Found", description: `Select one to analyze.` });
          setSearchResults(companies);
          onSearchResults(companies); // Pass results up for display/selection
          setIsLoading(false);
        } else {
          toast({ title: "Company Not Found", description: `Could not find ${data.companyName}. Analyzing based on provided info...` });
          companyToAnalyze = {
            companyName: data.companyName,
            websiteUrl: data.websiteUrl || undefined,
            analysisType: analysisType,
            jobTitle: data.jobTitle || undefined,
            location: data.location || undefined, // Pass location if provided
         };
          await performAnalysis(companyToAnalyze);
        }
      } else {
            // Should be caught by validation, but just in case
            toast({ title: "Invalid Input", description: "Please check your search criteria.", variant: "destructive" });
            setIsLoading(false);
       }

    } catch (error) {
      console.error("Error during search:", error);
      toast({ title: "Search Failed", description: "An error occurred during the search.", variant: "destructive" });
      setIsLoading(false);
      setIsAnalyzing(false);
    }
    // No finally block setting loading to false here, it's handled within performAnalysis or error paths
  }

  // Function to handle selecting a company from multiple results
  const handleSelectCompany = async (company: Company) => {
      setSearchResults([]); // Clear the list display in sidebar
      const analysisInput : AnalyzeCompanyInput = {
          companyName: company.name,
          websiteUrl: company.websiteUrl || undefined,
          analysisType: form.getValues('searchType'), // Use the current form value for type
          // Include job/location if relevant to the original search context
          jobTitle: form.getValues('jobTitle') || undefined,
          location: form.getValues('location') || undefined, // Pass location if user entered it
      };
      await performAnalysis(analysisInput); // Reuse the analysis function
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4"> {/* Added padding */}
        <FormField
          control={form.control}
          name="searchType"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Search For:</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => {
                     field.onChange(value);
                     // Reset fields when switching types to avoid confusion
                     form.reset({
                        searchType: value as 'job' | 'ugc', // Keep the selected type
                        jobTitle: '',
                        location: '',
                        companyName: '',
                        websiteUrl: '',
                     });
                  }}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="job" id="searchTypeJob"/>
                    </FormControl>
                    <FormLabel htmlFor="searchTypeJob" className="font-normal cursor-pointer">
                      Companies Hiring
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="ugc" id="searchTypeUGC" />
                    </FormControl>
                    <FormLabel htmlFor="searchTypeUGC" className="font-normal cursor-pointer">
                      Companies for UGC/Social
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Fields */}
        {searchType === 'job' && (
          <>
            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Social Media Manager" {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Required if no Company Name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Remote, New York" {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Required if no Company Name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="text-center text-xs text-muted-foreground my-2">OR</div>
             <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Specific Company Inc." {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Searches database directly first.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (Optional)</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://..." {...field} />
                    </FormControl>
                     <FormDescription className="text-xs">Used for analysis if company found.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </>
        )}

        {searchType === 'ugc' && (
          <>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cool Startup Brands" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Added Location field for UGC */}
             <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Los Angeles, CA" {...field} />
                    </FormControl>
                     <FormDescription className="text-xs">Provides context for analysis.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
             <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://..." {...field} />
                  </FormControl>
                   <FormDescription className="text-xs">Helps analysis if company not in DB.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

         {/* Display refine error message */}
         {form.formState.errors.root?.message && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
         )}
         {/* Also display specific field errors if not handled by root */}
         {form.formState.errors.companyName?.message && !form.formState.errors.root?.message && (
             <p className="text-sm font-medium text-destructive">{form.formState.errors.companyName.message}</p>
         )}


        <Button type="submit" className="w-full" disabled={isLoading || isAnalyzing}>
          {isLoading || isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : (isLoading ? 'Searching...' : 'Search & Analyze')}
        </Button>
      </form>

       {/* Display multiple search results for selection */}
       {searchResults.length > 0 && (
          <div className="mt-4 p-4 border-t"> {/* Separator and padding */}
            <h3 className="font-semibold mb-2 text-sm">Multiple Companies Found</h3>
            <p className="text-xs text-muted-foreground mb-3">Please select one company to analyze:</p>
             <ul className="space-y-2 max-h-60 overflow-y-auto"> {/* Scrollable list */}
                {searchResults.map(company => (
                    <li key={company.id}>
                        <Button
                            variant="outline"
                            className="w-full justify-start text-left h-auto py-2 px-3" // Adjusted padding
                            onClick={() => handleSelectCompany(company)}
                            disabled={isLoading || isAnalyzing} // Disable while loading/analyzing
                            size="sm" // Smaller button size
                        >
                            <div>
                                <p className="font-medium text-sm">{company.name}</p> {/* Slightly larger name */}
                                {company.websiteUrl && <p className="text-xs text-muted-foreground truncate">{company.websiteUrl}</p>} {/* Truncate long URLs */}
                                {company.locations && <p className="text-xs text-muted-foreground truncate">{company.locations.join(', ')}</p>} {/* Truncate locations */}
                            </div>
                        </Button>
                    </li>
                ))}
             </ul>
          </div>
        )}

       {/* Analysis result display is now handled in the main page component */}
    </Form>
  );
}
