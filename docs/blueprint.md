# **App Name**: ProspectWise

## Core Features:

- Company Analyzer: Use a tool to analyze company websites, LinkedIn profiles, and social media accounts to identify companies involved in UGC/social media marketing or hiring for specific roles. Generate a comprehensive report on each company's profile, needs, and potential fit.
- Email Generator: Draft personalized emails proposing collaborations (for UGC/social media) or expressing interest in employment (for job search), highlighting how your skills match their needs and suggesting next steps. Use a tool to tailor the email based on the company analysis report.
- Dashboard: Provide a user interface to search for companies, view detailed analysis reports, and manage generated emails. Save reports to Firestore for future access.

## Style Guidelines:

- Primary color: Teal (#008080) for a professional and trustworthy feel.
- Secondary color: Light gray (#F0F0F0) for backgrounds and content separation.
- Accent: Orange (#FFA500) for call-to-action buttons and highlights.
- Clean and readable fonts for easy information consumption.
- Use clear and concise icons to represent different data points and actions.
- Well-structured layout with clear sections for search, analysis, and email generation.
- Subtle animations for loading states and transitions to improve user experience.

## Original User Request:
I want you to create app that finds companies who are hiring for (insert job title) in (insert location) OR companies involved in UGC/social media marketing.
The App has to do a full analysis of each company: search their websites, LinkedIn profiles, social media accounts, and any other relevant information. Provide a comprehensive report and a strategic plan on how to approach them.
It has to draft a personalized email for each company proposing a collaboration (for UGC/social media work) or expressing interest in employment (for job search).

The app has to Provide a comprehensive report and a strategic game plan on how to contact them.
The email should highlight how my skills match their needs and suggest the next steps for cooperation.

Here is something that can help you:
- [x] Clarify user requirements
- [x] Set up development environment with Next.js
- [x] Design application architecture
- [x] Create database schema design

## Implementation
- [x] Set up database tables
- [x] Implement company search functionality
  - [x] Create API service for company search
  - [x] Implement job board search integration
  - [x] Implement social media company search
- [x] Implement company analysis functionality
  - [x] Create company profile analyzer
  - [x] Implement website content analyzer
  - [x] Implement social media presence analyzer
- [x] Implement email generation functionality
  - [x] Create email template system
  - [x] Implement personalization logic
- [x] Create user interface
  - [x] Build search form component
  - [x] Build results list component
  - [x] Build company detail component
  - [x] Build email generator component
  - [x] Build saved reports component
- [ ] Test and deploy application
  - [ ] Perform unit testing
  - [ ] Perform integration testing
  - [ ] Deploy to production environment
  