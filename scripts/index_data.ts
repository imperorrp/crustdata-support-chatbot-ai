import { TaskType} from "@google/generative-ai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { createClient } from "@supabase/supabase-js";
import { config } from 'dotenv';
import { customChunks } from "./api_data";
config();

// Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY!;


async function ingest() {
  try {
    // Initialize Supabase client
    const client = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);

    // Convert custom chunks into LangChain Documents
    const documents = customChunks.map(
      (chunk) =>
        new Document({
          pageContent: chunk.content,
          metadata: chunk.metadata,
        }),
    );

    // Embed documents into Supabase Vector Store
    const vectorstore = await SupabaseVectorStore.fromDocuments(
      documents,
      new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004", // 768 dimensions, can generate embeddings for text of up to 2048 tokens
        taskType: TaskType.RETRIEVAL_DOCUMENT,
        title: "Document title",
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
