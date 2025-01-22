import { Chat } from "@/components/custom/chat";
import { generateUUID } from "@/lib/utils";

export default async function Page({
  searchParams,
}: {
  searchParams: { anonymous?: string };
}) {
  const id = generateUUID();
  const isAnonymous = searchParams.anonymous === "true";
  return <Chat key={id} id={id} initialMessages={[]} isAnonymous={isAnonymous} />;
}
