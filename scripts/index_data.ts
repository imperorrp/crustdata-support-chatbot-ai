/*import { readFileSync } from 'fs';
import { join } from 'path';

import { TaskType} from "@google/generative-ai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "@supabase/supabase-js";
import { config } from 'dotenv';
*/
const { readFileSync } = require('fs');
const { join } = require('path');

const { TaskType } = require("@google/generative-ai");
const { SupabaseVectorStore } = require("@langchain/community/vectorstores/supabase");
const { Document: LangChainDocument } = require("@langchain/core/documents");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { createClient } = require("@supabase/supabase-js");
const { config } = require('dotenv');

//import { customChunks } from "./api_data";
config();

const customChunks = [
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
];

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY!;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;


async function ingest() {
  try {
    console.log("Ingesting documents into Supabase...");

    console.log(customChunks[2]);

    console.log('-----------------------------------------------------\n---------------------------------------\n');

    console.log(SUPABASE_URL);

    // Initialize Supabase client
    const client = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);
    console.log("Supabase client initialized.");

    // Convert custom chunks into LangChain Documents
    const documents = customChunks.map(
      (chunk) =>
        new LangChainDocument({
          pageContent: chunk.content, // Note: only the pageContent field is used to create the embeddings for each document, not the metadata. 
          metadata: {more_info: chunk.metadata},
        }),
    );
    console.log("Documents created from custom chunks.");

    // Embed documents into Supabase Vector Store
    const vectorstore = await SupabaseVectorStore.fromDocuments(
      documents,
      new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions, can generate embeddings for text of up to 2048 tokens
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
        apiKey: GOOGLE_API_KEY,
      }),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      },
    );

    console.log("Documents successfully ingested into Supabase.");
  } catch (error) {
    console.error("Error during ingestion:", error);
  }
}

// Run the script
ingest();
