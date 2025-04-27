
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, QueryConstraint } from 'firebase/firestore';
import type { Company, CompanySearchCriteria } from '@/types/company';

/**
 * Searches for companies in Firestore based on the provided criteria.
 *
 * @param criteria The search criteria (e.g., name, industry, location).
 * @param searchLimit The maximum number of companies to return.
 * @returns A promise that resolves to an array of Company objects.
 */
export async function searchCompanies(
  criteria: CompanySearchCriteria,
  searchLimit: number = 10
): Promise<Company[]> {
  const companiesRef = collection(db, 'companies');
  const queryConstraints: QueryConstraint[] = [];

  // Basic search by name (case-insensitive prefix match if possible, otherwise requires exact match or more complex indexing like Algolia)
  // Firestore doesn't support case-insensitive or partial string matches natively for non-equality checks without workarounds.
  // For simplicity, we'll filter by name equality if provided, or allow all if not.
  // A more robust solution might involve storing a lowercased name field or using a dedicated search service.
  if (criteria.name) {
    // Simple equality check - assumes name is indexed
     queryConstraints.push(where('name', '>=', criteria.name));
     queryConstraints.push(where('name', '<=', criteria.name + '\uf8ff'));
    // For a real app, consider storing a lowercase version of the name
    // queryConstraints.push(where('nameLowercase', '==', criteria.name.toLowerCase()));
  }

  if (criteria.industry) {
    queryConstraints.push(where('industry', '==', criteria.industry));
  }

  if (criteria.location) {
    // Assumes 'locations' is an array field in Firestore
    queryConstraints.push(where('locations', 'array-contains', criteria.location));
  }

  // Add limit
  queryConstraints.push(limit(searchLimit));

  const q = query(companiesRef, ...queryConstraints);

  try {
    const querySnapshot = await getDocs(q);
    const companies: Company[] = [];
    querySnapshot.forEach((doc) => {
      companies.push({ id: doc.id, ...doc.data() } as Company);
    });
    console.log(`Found ${companies.length} companies matching criteria:`, criteria);
    return companies;
  } catch (error) {
    console.error("Error searching companies:", error);
    // Depending on requirements, you might want to throw the error
    // or return an empty array / specific error object.
    return []; // Return empty array on error
  }
}

// Example function to add a company (for testing/seeding)
// In a real app, this might be part of an admin interface or data import process
/*
import { addDoc } from 'firebase/firestore';

export async function addSampleCompany() {
  try {
    const docRef = await addDoc(collection(db, "companies"), {
      name: "Acme Corporation",
      nameLowercase: "acme corporation", // Example for case-insensitive search
      websiteUrl: "https://acme.com",
      description: "A sample company for testing.",
      industry: "Technology",
      locations: ["San Francisco, CA", "New York, NY"],
      socialMedia: [{ platform: "LinkedIn", url: "https://linkedin.com/company/acme" }]
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}
*/
