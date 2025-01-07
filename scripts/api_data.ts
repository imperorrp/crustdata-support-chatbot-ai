// Crustdata API docs chunked:

// Content from the API Docs, data dictionary, examples should all be chunked in semantically sensible chunks (such
// as one endpoint per chunk, one data dictionary term per chunk, etc.). Each chunk should be an object with a `content` 
// field containing the text content and a `metadata` field containing any relevant metadata (e.g. endpoint, method, etc.).

export const customChunks = [
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
