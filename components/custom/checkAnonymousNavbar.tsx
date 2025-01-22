"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SlashIcon } from "./icons";
import { Button } from "../ui/button";


export const AnonymousCheck = () => {
  const searchParams = useSearchParams();
  const isAnonymous = searchParams.get("anonymous") === "true";

  if (isAnonymous) {
    return null;
  }

  return (
    <div>
        <div className="text-zinc-500">
            <SlashIcon size={16} />
        </div>
        <div className="text-sm dark:text-zinc-300 truncate w-28 md:w-fit">
            Guest Mode 
        </div>          
    </div>
  );
};