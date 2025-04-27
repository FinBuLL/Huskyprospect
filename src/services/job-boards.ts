/**
 * Represents a job posting.
 */
export interface JobPosting {
  /**
   * The title of the job.
   */
  title: string;
  /**
   * The company offering the job.
   */
  company: string;
  /**
   * A description of the job.
   */
  description: string;
  /**
   * The URL to apply for the job.
   */
  applyUrl: string;
  /**
   * Location of job.
   */
  location: string;
}

/**
 * Asynchronously retrieves job postings for a given job title and location.
 *
 * @param jobTitle The job title to search for.
 * @param location The location to search within.
 * @returns A promise that resolves to an array of JobPosting objects.
 */
export async function getJobPostings(
  jobTitle: string,
  location: string
): Promise<JobPosting[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      title: 'Software Engineer',
      company: 'Google',
      description: '...',
      applyUrl: 'https://www.google.com/careers',
      location: 'Mountain View, CA'
    },
    {
      title: 'Senior Software Engineer',
      company: 'Lyft',
      description: '...',
      applyUrl: 'https://www.lyft.com/careers',
      location: 'San Francisco, CA'
    },
  ];
}
