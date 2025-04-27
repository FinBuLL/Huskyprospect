
export interface Company {
  id: string; // Firestore document ID
  name: string;
  websiteUrl?: string;
  description?: string;
  // Add other relevant fields as needed, e.g., location, industry, size
  locations?: string[];
  industry?: string;
  socialMedia?: {
    platform: string;
    url: string;
  }[];
}

// Define input type for search criteria
export type CompanySearchCriteria = {
    name?: string;
    industry?: string;
    location?: string;
    // Add other search fields as needed
};
