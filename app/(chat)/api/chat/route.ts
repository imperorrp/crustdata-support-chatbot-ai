
import { google } from '@ai-sdk/google';
import { TaskType, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import {
  BytesOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
//import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "@supabase/supabase-js";
import { convertToCoreMessages, Message, streamText, generateText } from "ai";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { geminiProModel, geminiFlashModel } from "@/ai";
import {
  generateReservationPrice,
  generateSampleFlightSearchResults,
  generateSampleFlightStatus,
  generateSampleSeatSelection,
} from "@/ai/actions";
import { auth } from "@/app/(auth)/auth";
import {
  createReservation,
  deleteChatById,
  getChatById,
  getReservationById,
  saveChat,
} from "@/db/queries";
import { generateUUID } from "@/lib/utils";

export const runtime = "edge";


// Helper functions for document and message formatting
const combineDocumentsFn = (docs: Document[]) => { //combines both the content and metadata of the documents 
  const serializedDocs = docs.map((doc) => {
    const content = doc.pageContent;
    const metadata = JSON.stringify(doc.metadata);
    return `${content}\nMetadata: ${metadata}`;
  });
  return serializedDocs.join("\n\n");
};

const formatVercelMessages = (chatHistory: VercelChatMessage[]) => {
  const formattedDialogueTurns = chatHistory.map((message) => {
    if (message.role === "user") {
      return `Human: ${message.content}`;
    } else if (message.role === "assistant") {
      return `Assistant: ${message.content}`;
    } else {
      return `${message.role}: ${message.content}`;
    }
  });
  return formattedDialogueTurns.join("\n");
};

/*
// Prompt templates
const CONDENSE_QUESTION_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

<chat_history>
  {chat_history}
</chat_history>

Follow Up Input: {question}
Standalone question:`;

const ANSWER_TEMPLATE = `You are a helpful Crustdata API support assistant. You help users understand and use Crustdata's APIs effectively and concisely.

When providing code examples:
1. Always use correct API endpoints and parameters
2. Include proper error handling suggestions
3. Explain key parameters clearly
4. If showing a curl example, also show how to handle the response

Answer the question based only on the following context and chat history:
<context>
  {context}
</context>

<chat_history>
  {chat_history}
</chat_history>

Question: {question}

If the response includes an API call, ensure the syntax is correct and all required parameters are included.
If the user is asking about API errors, provide common troubleshooting steps.`;

const condenseQuestionPrompt = PromptTemplate.fromTemplate(CONDENSE_QUESTION_TEMPLATE);
const answerPrompt = PromptTemplate.fromTemplate(ANSWER_TEMPLATE);

// API validation schema for Crustdata API calls
const CrustdataAPISchema = z.object({
  filters: z.array(
    z.object({
      filter_type: z.string(),
      type: z.string(),
      value: z.array(z.string())
    })
  ),
  page: z.number().optional()
});
*/

// Main handler function

export async function POST(req: NextRequest) {
  console.log("POST Request received");
  try {
    //const body = await req.json();
    const { id, messages }: { id: string; messages: Array<Message> } = await req.json();
    //const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;

    const session = await auth();

    /*if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    */
    if (session) {
      console.log("Session authenticated");
    } 

    const coreMessages = convertToCoreMessages(messages).filter(
      (message) => message.content.length > 0,
    );

    // First, condense the question using the chat history
    const condenseResult = await generateText({
      model: google('gemini-1.5-flash-8b'),
      prompt: `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

      Chat History:
      ${formatVercelMessages(previousMessages)}

      Follow Up Question: ${currentMessageContent}

      Standalone question:`,
          });

    // Get the condensed question
    const condensedQuestion = condenseResult.text; //use this condensed question for embeddings search below

    console.log("Condensed question: ", condensedQuestion);

    // Initialize Supabase client
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!
    );

    // Initialize vector store
    const vectorstore = new SupabaseVectorStore(
      new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
      }),
      {
        client,
        tableName: "documents",
        queryName: "match_documents",
      }
    );
    console.log("Vector store initialized");

    // Get relevant documents
    const relevantDocs = await vectorstore.similaritySearch(condensedQuestion, 4);
    const contextText = combineDocumentsFn(relevantDocs);
    //const chatHistory = formatVercelMessages(previousMessages);

    console.log("Relevant documents retrieved.");
    //console.log(relevantDocs);

    // Use streamText with the retrieved context
    const result = await streamText({ 
      model: geminiFlashModel, //geminiProModel, (the gemini flash model has much larger context window, best suited for this API doc system)
      messages: convertToCoreMessages(messages), //message history plus current message
      system: `You are a helpful Crustdata API support assistant. You help users understand and use Crustdata's APIs effectively and concisely.
      
      Use the following context to answer the user's question:

      The Crustdata API gives you programmatic access to firmographic and growth metrics data for companies across the world from more than 16 datasets (Linkedin headcount, Glassdoor, Instagram, G2, Web Traffic, Apple App Store reviews, Google Play Store, News among others).
      
      ${contextText}
      
      Follow the pattern of answers provided to these sample questions:
      
      Sample 1. 
      Q: “How do I search for people given their current title, current company and location?”
      A: "You can use api.crustdata.com/screener/person/search endpoint. Here is an example curl 
      request to find “people with title engineer at OpenAI in San Francisco”: 
      curl --location 'https://api.crustdata.com/screener/person/search' \
        --header 'Content-Type: application/json' \
        --header 'Authorization: Token $token \
        --data '{
            "filters": [
                {
                    "filter_type": "CURRENT_COMPANY",
                    "type": "in",
                    "value": [
                        "openai.com"
                    ]
                },
                {
                    "filter_type": "CURRENT_TITLE",
                    "type": "in",
                    "value": [
                        "engineer"
                    ]
                },
                {    "filter_type": "REGION",
                    "type": "in",
                    "value": [
                        "San Francisco, California, United States"
                    ]
                }        
            ],
            "page": 1
        }' 
      " 

      Sample 2. 
      Q: " I tried using the screener/person/search API to compare against previous values this weekend. I am blocked on the filter values. It seems like there's a strict set of values for something like a region. Because of that if I pass in something that doesn't fully conform to the list of enums you support for that filter value, the API call fails. The location fields for us are not normalized so I can't make the calls.
      I tried search/enrichment by email but for many entities we have @gmails rather than business emails. Results are not the best.


      Is there a standard you're using for the region values? I get this wall of text back when I don't submit a proper region value but it's hard for me to know at a glance how I should format my input
      {
        "non_field_errors": [
            "No mapping found for REGION: San Francisco. Correct values are ['Aruba', 'Afghanistan', 'Angola', 'Anguilla', 'Åland Islands', 'Albania', 'Andorra', 'United States', 'United Kingdom', 'United Arab Emirates', 'United States Minor Outlying Islands', 'Argentina', 'Armenia', 'American Samoa', 'US Virgin Islands', 'Antarctica', 'French Polynesia', 'French Guiana', 'French Southern and Antarctic Lands', 'Antigua and Barbuda', 'Australia', 'Austria', 'Azerbaijan', 'Burundi', 'Belgium', 'Benin', 'Burkina Faso', 'Bangladesh', 'Bulgaria', 'Bahrain', 'The Bahamas', 'Bosnia and Herzegovina', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Saint Kitts and Nevis', 'Saint Helena, Ascension and Tristan da
      …
      "
      A: "Yes there is specific list of regions listed here https://crustdata-docs-region-json.s3.us-east-2.amazonaws.com/updated_regions.json . Is there a way you can find the region from this list first and then put the exact values in the search?"
      
      When providing code examples:
      1. Always use correct API endpoints and parameters
      2. Include proper error handling suggestions
      3. Explain key parameters clearly
      
      Give the user a relevant example curl API call when they ask about how to look up something that involves a particular endpoint. 
      If the response includes an API call, ensure the syntax is correct and all required parameters are included.
      If the user is asking about API errors, provide common troubleshooting steps.
      Keep your responses brief and concise. 
      If you need more information from the user to solve their problem, ask them a relevant follow-up question.
      `,
      onFinish: async ({ responseMessages }) => {
        if (session && session.user && session.user.id) { //only save chat if session is authenticated
          try {
            await saveChat({
              id,
              messages: [...coreMessages, ...responseMessages],
              userId: session.user.id,
            });
          } catch (error) {
            console.error("Failed to save chat");
          }
        }
      },
      experimental_telemetry: {
        isEnabled: true,
        functionId: "stream-text",
      },
    });
    //console.log("Stream text result:", result);


    return result.toDataStreamResponse({
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
      },
    });
  } catch (e: any) {
    console.error("Error in POST handler:", e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
