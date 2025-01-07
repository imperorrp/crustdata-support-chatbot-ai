import { motion } from "framer-motion";
import Link from "next/link";

import { LogoGoogle, MessageIcon, VercelIcon } from "./icons";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <VercelIcon />
          <span>+</span>
          <MessageIcon />
        </p>
        <p>
          Welcome to Crustdata API Support Bot! Ask any questions about the Crustdata API below. This customer support bot is powered by the Google Gemini
          model and knowledge of the official Crustdata API docs and examples. 
        </p>
        <p>
          {" "}
          Click here to view the API{" "}
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://crustdata.notion.site/Crustdata-Discovery-And-Enrichment-API-c66d5236e8ea40df8af114f6d447ab48#3315bbdfa0054a2aa440e98bdec3ff90"
            target="_blank"
          >
            docs 
          </Link>
          {" "}and{" "} 
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://crustdata.notion.site/Crustdata-Dataset-API-Detailed-Examples-b83bd0f1ec09452bb0c2cac811bba88c"
            target="_blank"
          >
            examples
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
