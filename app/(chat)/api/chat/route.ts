
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

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.log("Session authenticated");

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
      
      If the response includes an API call, ensure the syntax is correct and all required parameters are included.
      If the user is asking about API errors, provide common troubleshooting steps.
      Keep your responses brief and concise. 
      If you need more information from the user to solve their problem, ask them a relevant follow-up question.
      `,
      onFinish: async ({ responseMessages }) => {
        if (session.user && session.user.id) {
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

/*
export async function POST_more_recent_but_deprecated(req: NextRequest) {
  console.log("POST Request received");
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const previousMessages = messages.slice(0, -1);
    const currentMessageContent = messages[messages.length - 1].content;
    console.log("Current message content: ", currentMessageContent);

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.0-pro",
      maxOutputTokens: 2048,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
        },
      ],
    });
    console.log("Model initialized");

    // Initialize Supabase client for vector storage
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PRIVATE_KEY!,
    );
    console.log("Supabase client initialized");
    
    const vectorstore = new SupabaseVectorStore(new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004", // 768 dimensions
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      title: "Document title",
    }), {
      client,
      tableName: "documents",
      queryName: "match_documents",
    });
    console.log("Vector store initialized");

    // Set up the retrieval chain
    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser(),
    ]);
    console.log("Standalone question chain initialized");

    // Document promise for tracking retrieved documents
    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });
    console.log("Document promise initialized");

    // Configure retriever with callbacks
    const retriever = vectorstore.asRetriever({
      callbacks: [
        {
          handleRetrieverEnd(documents) {
            resolveWithDocuments(documents);
          },
        },
      ],
    });
    console.log("Retriever configured");

    const retrievalChain = retriever.pipe(combineDocumentsFn);

    // Set up the answer chain
    const answerChain = RunnableSequence.from([
      {
        context: RunnableSequence.from([
          (input) => input.question,
          retrievalChain,
        ]),
        chat_history: (input) => input.chat_history,
        question: (input) => input.question,
      },
      answerPrompt,
      model,
    ]);
    console.log("Answer chain initialized");

    // Combine the chains
    const conversationalRetrievalQAChain = RunnableSequence.from([
      {
        question: standaloneQuestionChain,
        chat_history: (input) => input.chat_history,
      },
      answerChain,
      new BytesOutputParser(),
    ]);
    console.log("Conversational retrieval QA chain initialized");

    // Stream the response
    const stream = await conversationalRetrievalQAChain.stream({
      question: currentMessageContent,
      chat_history: formatVercelMessages(previousMessages),
    });
    console.log("Response streaming started");

    // Handle document sources
    const documents = await documentPromise;
    const serializedSources = Buffer.from(
      JSON.stringify(
        documents.map((doc) => ({
          pageContent: doc.pageContent.slice(0, 50) + "...",
          metadata: doc.metadata,
        })),
      ),
    ).toString("base64");
    console.log("Document sources serialized");

    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (previousMessages.length + 1).toString(),
        "x-sources": serializedSources,
      },
    });
  } catch (e: any) {
    console.log(`error: ${e}`);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function POST_deprecated(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );

  const result = await streamText({
    model: geminiProModel,
    system: `\n
        - you help users book flights!
        - keep your responses limited to a sentence.
        - DO NOT output lists.
        - after every tool call, pretend you're showing the result to the user and keep your response limited to a phrase.
        - today's date is ${new Date().toLocaleDateString()}.
        - ask follow up questions to nudge user into the optimal flow
        - ask for any details you don't know, like name of passenger, etc.'
        - C and D are aisle seats, A and F are window seats, B and E are middle seats
        - assume the most popular airports for the origin and destination
        - here's the optimal flow
          - search for flights
          - choose flight
          - select seats
          - create reservation (ask user whether to proceed with payment or change reservation)
          - authorize payment (requires user consent, wait for user to finish payment and let you know when done)
          - display boarding pass (DO NOT display boarding pass without verifying payment)
        '
      `,
    messages: coreMessages,
    tools: {
      getWeather: {
        description: "Get the current weather at a location",
        parameters: z.object({
          latitude: z.number().describe("Latitude coordinate"),
          longitude: z.number().describe("Longitude coordinate"),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
          );

          const weatherData = await response.json();
          return weatherData;
        },
      },
      displayFlightStatus: {
        description: "Display the status of a flight",
        parameters: z.object({
          flightNumber: z.string().describe("Flight number"),
          date: z.string().describe("Date of the flight"),
        }),
        execute: async ({ flightNumber, date }) => {
          const flightStatus = await generateSampleFlightStatus({
            flightNumber,
            date,
          });

          return flightStatus;
        },
      },
      searchFlights: {
        description: "Search for flights based on the given parameters",
        parameters: z.object({
          origin: z.string().describe("Origin airport or city"),
          destination: z.string().describe("Destination airport or city"),
        }),
        execute: async ({ origin, destination }) => {
          const results = await generateSampleFlightSearchResults({
            origin,
            destination,
          });

          return results;
        },
      },
      selectSeats: {
        description: "Select seats for a flight",
        parameters: z.object({
          flightNumber: z.string().describe("Flight number"),
        }),
        execute: async ({ flightNumber }) => {
          const seats = await generateSampleSeatSelection({ flightNumber });
          return seats;
        },
      },
      createReservation: {
        description: "Display pending reservation details",
        parameters: z.object({
          seats: z.string().array().describe("Array of selected seat numbers"),
          flightNumber: z.string().describe("Flight number"),
          departure: z.object({
            cityName: z.string().describe("Name of the departure city"),
            airportCode: z.string().describe("Code of the departure airport"),
            timestamp: z.string().describe("ISO 8601 date of departure"),
            gate: z.string().describe("Departure gate"),
            terminal: z.string().describe("Departure terminal"),
          }),
          arrival: z.object({
            cityName: z.string().describe("Name of the arrival city"),
            airportCode: z.string().describe("Code of the arrival airport"),
            timestamp: z.string().describe("ISO 8601 date of arrival"),
            gate: z.string().describe("Arrival gate"),
            terminal: z.string().describe("Arrival terminal"),
          }),
          passengerName: z.string().describe("Name of the passenger"),
        }),
        execute: async (props) => {
          const { totalPriceInUSD } = await generateReservationPrice(props);
          const session = await auth();

          const id = generateUUID();

          if (session && session.user && session.user.id) {
            await createReservation({
              id,
              userId: session.user.id,
              details: { ...props, totalPriceInUSD },
            });

            return { id, ...props, totalPriceInUSD };
          } else {
            return {
              error: "User is not signed in to perform this action!",
            };
          }
        },
      },
      authorizePayment: {
        description:
          "User will enter credentials to authorize payment, wait for user to repond when they are done",
        parameters: z.object({
          reservationId: z
            .string()
            .describe("Unique identifier for the reservation"),
        }),
        execute: async ({ reservationId }) => {
          return { reservationId };
        },
      },
      verifyPayment: {
        description: "Verify payment status",
        parameters: z.object({
          reservationId: z
            .string()
            .describe("Unique identifier for the reservation"),
        }),
        execute: async ({ reservationId }) => {
          const reservation = await getReservationById({ id: reservationId });

          if (reservation.hasCompletedPayment) {
            return { hasCompletedPayment: true };
          } else {
            return { hasCompletedPayment: false };
          }
        },
      },
      displayBoardingPass: {
        description: "Display a boarding pass",
        parameters: z.object({
          reservationId: z
            .string()
            .describe("Unique identifier for the reservation"),
          passengerName: z
            .string()
            .describe("Name of the passenger, in title case"),
          flightNumber: z.string().describe("Flight number"),
          seat: z.string().describe("Seat number"),
          departure: z.object({
            cityName: z.string().describe("Name of the departure city"),
            airportCode: z.string().describe("Code of the departure airport"),
            airportName: z.string().describe("Name of the departure airport"),
            timestamp: z.string().describe("ISO 8601 date of departure"),
            terminal: z.string().describe("Departure terminal"),
            gate: z.string().describe("Departure gate"),
          }),
          arrival: z.object({
            cityName: z.string().describe("Name of the arrival city"),
            airportCode: z.string().describe("Code of the arrival airport"),
            airportName: z.string().describe("Name of the arrival airport"),
            timestamp: z.string().describe("ISO 8601 date of arrival"),
            terminal: z.string().describe("Arrival terminal"),
            gate: z.string().describe("Arrival gate"),
          }),
        }),
        execute: async (boardingPass) => {
          return boardingPass;
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
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

  return result.toDataStreamResponse({});
}
*/

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
