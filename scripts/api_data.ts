import { readFileSync } from 'fs';
import { join } from 'path';

// Crustdata API docs chunked:

/* RAG Method 1: 

Content from the API Docs, data dictionary, examples should all be chunked in semantically sensible chunks (such
as one endpoint per chunk, one data dictionary term per chunk, etc.). Each chunk should be an object with a `content` 
field containing the text content and a `metadata` field containing any relevant metadata (e.g. endpoint, method, etc.).
*/


export const customChunks_method1 = [
    {
      content:`Enrichment: Company Data API
        Overview: This endpoint enriches company data by retrieving detailed information about one or multiple companies using either their domain, name, or ID.
        Required: authentication token auth_token for authorization.
        Request
        Parameters
        company_domain: string (comma-separated list, up to 25 domains)
        Description: The domain(s) of the company(ies) you want to retrieve data for.
        Example: company_domain=hubspot.com,google.com
        company_name: string (comma-separated list, up to 25 names; use double quotes if names contain commas)
        Description: The name(s) of the company(ies) you want to retrieve data for.
        Example: company_name="Acme, Inc.","Widget Co"
        company_linkedin_url: string (comma-separated list, up to 25 URLs)
        Description: The LinkedIn URL(s) of the company(ies).
        Example: company_linkedin_url=https://linkedin.com/company/hubspot,https://linkedin.com/company/clay-hq
        company_id: integer (comma-separated list, up to 25 IDs)
        Description: The unique ID(s) of the company(ies) you want to retrieve data for.
        Example: company_id=12345,67890
        fields: string (comma-separated list of fields)
        Description: Specifies the fields you want to include in the response. Supports nested fields up to a certain level.
        Example: fields=company_name,company_domain,glassdoor.glassdoor_review_count
        enrich_realtime: boolean (False by default)
        Description: When True and the requested company is not present in Crustdata’s database, the company is enriched within 10 minutes of the request
        Using the fields Parameter
        The fields parameter allows you to customize the response by specifying exactly which fields you want to retrieve. This can help reduce payload size and improve performance.
        Important Notes
        Nested Fields: You can specify nested fields up to the levels defined in the response structure (see Field Structure below). Fields nested beyond the allowed levels or within lists (arrays) cannot be individually accessed.
        Default Fields:
        Top-Level Non-Object Fields: If you do not specify the fields parameter, the response will include all top-level non-object fields by default (e.g., company_name, company_id).
        Object Fields: By default, the response will not include object fields like decision_makers and founders.profiles, even if you have access to them. To include these fields, you must explicitly specify them using the fields parameter.
        User Permissions: Access to certain fields may be restricted based on your user permissions. If you request fields you do not have access to, the API will return an error indicating unauthorized access.
        Examples
        Request by Company Domain:
        Use Case: Ideal for users who have one or more company website domains and need to fetch detailed profiles.
        Note: You can provide up to 25 domains in a comma-separated list.
        Request:
        curl 'https://api.crustdata.com/screener/company?company_domain=hubspot.com,google.com' \
          --header 'Accept: application/json, text/plain, */*' \
          --header 'Accept-Language: en-US,en;q=0.9' \
          --header 'Authorization: Token $token'
        ​
        Request by Company Name:
        Use Case: Suitable for users who have one or more company names and need to retrieve detailed profiles.
        Note: You can provide up to 25 names in a comma-separated list. If a company name contains a comma, enclose the name in double quotes.
        Request:
        curl 'https://api.crustdata.com/screener/company?company_name="HubSpot","Google, Inc."' \
          --header 'Accept: application/json, text/plain, */*' \
          --header 'Accept-Language: en-US,en;q=0.9' \
          --header 'Authorization: Token $token'
        ​
        Request by Company LinkedIn URL:
        Use Case: Suitable for users who have one or more company Linkedin urls and need to retrieve detailed profiles.
        Note: You can provide up to 25 names in a comma-separated list. If a company name contains a comma, enclose the name in double quotes.
        Request:
        curl 'https://api.crustdata.com/screener/company?company_linkedin_url=https://linkedin.com/company/hubspot,https://linkedin.com/company/clay-hq' \
          --header 'Accept: application/json, text/plain, */*' \
          --header 'Accept-Language: en-US,en;q=0.9' \
          --header 'Authorization: Token $token'
        ​
        Request by Company ID:
        Use Case: Suitable for users who have ingested one or more companies from Crustdata already and want to enrich their data by Crustdata’s company_id. Users generally use this when they want time-series data for specific companies after obtaining the company_id from the screening endpoint.
        Note: You can provide up to 25 IDs in a comma-separated list.
        Request:
        curl 'https://api.crustdata.com/screener/company?company_id=631480,789001' \
          --header 'Accept: application/json, text/plain, */*' \
          --header 'Accept-Language: en-US,en;q=0.9' \
          --header 'Authorization: Token $token'
        ​
        Request with Specific Fields
        Use Case: Fetch only specific fields to tailor the response to your needs.
        Request
        curl 'https://api.crustdata.com/screener/company?company_domain=swiggy.com&fields=company_name,headcount.linkedin_headcount' \
          --header 'Authorization: Token $token' \
          --header 'Accept: application/json'
        ​
        More examples of Using fields parameter
        Example 1: Request Specific Top-Level Fields
        Request:
        curl 'https://api.crustdata.com/screener/company?company_id=123&fields=company_name,company_website_domain' \
          --header 'Authorization: Token $token' \
          --header 'Accept: application/json'
        ​
        Response Includes:
        company_name
        company_website_domain
        rest of top-level fields
        Example 2: Request Nested Fields
        Request:
        curl 'https://api.crustdata.com/screener/company?company_id=123&fields=glassdoor.glassdoor_overall_rating,glassdoor.glassdoor_review_count' \
          --header 'Authorization: Token $token' \
          --header 'Accept: application/json'
        ​
        Response Includes:
        glassdoor
        glassdoor_overall_rating
        glassdoor_review_count
        rest of top-level fields
        Example 3: Include 'decision_makers' and 'founders.profiles'
        Request:
        curl 'https://api.crustdata.com/screener/company?company_id=123&fields=decision_makers,founders.profiles' \
          --header 'Authorization: Token $token' \
          --header 'Accept: application/json'
        ​
        Response Includes:
        decision_makers: Full array of decision-maker profiles.
        founders
        profiles: Full array of founder profiles.
        rest of top-level fields
        Example 4: Requesting Unauthorized Fields
        Assuming you do not have access to the headcount field.
        Request:
        curl 'https://api.crustdata.com/screener/company?company_id=123&fields=company_name,headcount' \
          --header 'Authorization: Token $token' \
          --header 'Accept: application/json'
        ​
        Error Response:
        {
          "error": "Unauthorized access to field(s): headcount"
        }


        ​
        Request with Realtime Enrichment
        Use Case: For companies not tracked by Crustdata, you want to enrich them within 10 minutes of the request
        curl --location 'https://api.crustdata.com/screener/company?company_linkedin_url=https://www.linkedin.com/company/usebramble&enrich_realtime=True' \
        --header 'Accept: application/json, text/plain, /' \
        --header 'Accept-Language: en-US,en;q=0.9' \
        --header 'Authorization: Token $token'`,
      metadata: {
        "category": "Endpoints",
        "api_name": "Crustdata Discovery and Enrichment API",
        "section_title": "Enrichment: Company Data API",
        "chunk_type": "Request Parameters and Examples",
        "keywords": ["company_domain", "company_name", "company_linkedin_url", "company_id", "fields", "enrich_realtime", "curl"],
        "links": []
      },
    },
  ];

/* RAG Method 2: [LATEST METHOD]

Alternative possible method: chunk the descriptions of each API endpoint only, and put the actual code and other info in the metadata.

EXAMPLE:
  {
    content: "", // description of API endpoint to be embedded 
    metadata: {}, // metadata object containing the actual code and other info to feed Crustdata support bot context
  }

*/


export const customChunks = [
  {
    content: `## **Enrichment: Company Data API**

**Overview:** This endpoint enriches company data by retrieving detailed information about one or multiple companies using either their domain, name, or ID.

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'enrichment-company-data.txt'), 'utf-8'),
  },
  {
    content: `## **Company Discovery: Screening API**

**Overview:** The company screening API request allows you to screen and filter companies based on various growth and firmographic criteria. 

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-discovery-screening.txt'), 'utf-8'),
  },
  {
    content: `## Company Identification API

Given a company’s name, website or LinkedIn profile, you can identify the company in Crustdata’s database with company identification API

The input to this API is any combination of the following fields

- name of the company
- website of the company
- LinkedIn profile url of the company`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-identification.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 1. Job Listings

Crustdata’s company_id is the unique identifier of a company in our database. It is unique and it never changes. It is numeric.

Use this request to get job listings that were last updated by the company on 1st Feb, 2024 for all companies with  \`company_id\` equal to any one of [680992, 673947, 631280, 636304, 631811]
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-job-listings.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.
### 2. Funding Milestones

Use this request to get a time-series of funding milestones with  \`company_id\` equal to any one of [637158, 674265, 674657]
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-funding-milestones.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

3. Decision Makers/People Info 
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-decision-makers.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 4. LinkedIn Employee Headcount and LinkedIn Follower Count

Use this request to get weekly and monthly timeseries of employee headcount as a JSON blob.

You either provide with list a list of Crustdata \`company_id\`  or \`linkedin_id\` or \`company_website_domain\`

In the following example, we request the employee headcount timeseries of companies with \`company_id\` equal to any one of [680992, 673947, 631280, 636304, 631811]
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-linkedin-employee-headcount.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 5. Employee Headcount By Function

Use this request to get the headcount by function for the given company.

You either provide with a list of Crustdata’s \`company_id\`  or \`company_website_domain\` in the filters
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-employee-headcount-by-function.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 6. Glassdoor Profile Metrics

Use this request to get the rating of a company on Glassdoor, number of reviews, business outlook, CEO approval rating etc.  

You either provide with a list of Crustdata’s \`company_id\`  or \`company_website_domain\` in the filters
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-glassdoor-profile-metrics.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 7. G2 Profile Metrics

Use this request to get the rating of a company’s product on G2 and number of reviews etc.
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-g2-profile-metrics.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 8. Web Traffic

Use this request to get historical web-traffic of a company by domain
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-web-traffic.txt'), 'utf-8'),
  },
  {
    content: `## **Company Dataset API**

**Overview:** The Company Dataset API allows users to retrieve specific datasets related to companies, such as job listings, decision makers, news articles, G2 etc.

### 9. Investor Portfolio

Retrieve portfolio details for a specified investor. Each investor, as returned in the [company enrichment endpoint](https://www.notion.so/Crustdata-Discovery-And-Enrichment-API-c66d5236e8ea40df8af114f6d447ab48?pvs=21), 
has a unique identifier (UUID), name, and type. This API allows you to fetch the full portfolio of companies associated with an investor, using either the investor's \`uuid\` or \`name\` as an identifier.
`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'company-dataset-investor-portfolio.txt'), 'utf-8'),
  },
  {
    content: `## Search: LinkedIn Company Search API (real-time)

**Overview**: Search for company profiles using either directly a LinkedIn Sales Navigator accounts search URL or a custom search criteria as a filter. This endpoint allows you to retrieve detailed information about companies matching specific criteria.

Each request returns up-to 25 results. To paginate, update the page number of the Sales Navigator search URL and do the request again.

In the request payload, either set the url of the Sales Navigator Accounts search from your browser in the parameter \`linkedin_sales_navigator_search_url\` or specify the search criteria as a JSON object in the parameter \`filters\`

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'search-linkedin-company-search.txt'), 'utf-8'),
  },
  {
    content: `## **LinkedIn Posts by Company API (real-time)**

**Overview:** This endpoint retrieves recent LinkedIn posts and related engagement metrics for a specified company.

Each request returns up-to 5 results per page. To paginate, increment the \`page\` query param.

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'linkedin-posts-by-company.txt'), 'utf-8'),
  },
  {
    content: `## **LinkedIn Posts Keyword Search (real-time)**

**Overview:** This endpoint retrieves LinkedIn posts containing specified keywords along with related engagement metrics.

Each request returns 5 posts per page. To paginate, increment the \`page\`  in the payload.

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'linkedin-posts-keyword-search.txt'), 'utf-8'),
  },
  {
    content: `## **Enrichment: People Profile(s) API**

**Overview:** Enrich data for one or more individuals using LinkedIn profile URLs or business email addresses. This API allows you to retrieve enriched person data from Crustdata’s database or perform a real-time search from the web if the data is not available.

**Key Features:**

- Enrich data using **LinkedIn profile URLs** or **business email addresses** (3 credit per profile/email)
- Option to perform a **real-time search** if data is not present in the database (5 credit per profile/email)
- Retrieve data for up to **25 profiles or emails** in a single request.

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'enrichment-people-profiles.txt'), 'utf-8'),
  },
  {
    content: `## Search: LinkedIn People Search API (real-time)

**Overview**: Search for people profiles based on either a direct LinkedIn Sales Navigator search URL or a custom search criteria as a filter. This endpoint allows you to retrieve detailed information about individuals matching specific criteria.

Each request returns upto 25 results. To paginate, update the page number of the Sales Navigator search URL and do the request again.

In the request payload, either set the url of the Sales Navigator Leads search from your browser in the parameter \`linkedin_sales_navigator_search_url\` or specify the search criteria as a JSON object in the parameter \`filters\`

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'search-linkedin-people-search.txt'), 'utf-8'),
  },
  {
    content: `## **LinkedIn Posts by Person API (real-time)**

**Overview:** This endpoint retrieves recent LinkedIn posts and related engagement metrics for a specified person.

Each request returns up-to 5 results per page. To paginate, increment the \`page\` query param.

Required: authentication token \`auth_token\` for authorization.`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'linkedin-posts-by-person.txt'), 'utf-8'),
  },
  {
    content: `# API Usage Endpoints

## Get remaining credits`,
    metadata: readFileSync(join(__dirname, '..', 'chunks', 'api-usage-get-remaining-credits.txt'), 'utf-8'),
  },
]