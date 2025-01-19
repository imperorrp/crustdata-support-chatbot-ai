import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import { LogoGoogle, MessageIcon, VercelIcon, CrustdataLogo } from "./icons";

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
          <Image
            src="/images/crustdata_png.png"
            height={20}
            width={20}
            alt="crustdata logo"
          />
          <span>+</span>
          <Image
            src="/images/gemini-logo.png"
            height={20}
            width={20}
            alt="gemini logo"
          />
          <span>+</span>
          <MessageIcon />
        </p>
        <p className="font-bold text-center text-2xl dark:text-zinc-50">
          Welcome to the {" "}
          <Link 
            className="text-blue-500 dark:text-blue-400"
            href="https://crustdata.com/"
            target="_blank"
          >
          Crustdata 
          </Link>
          {" "}
          API Support Bot! 
        </p>
        <p>
          Ask any questions about the Crustdata API below. 
        </p>
        <p>
          This customer support bot is powered by the Google Gemini
          AI model and knowledge of the official Crustdata API docs and examples. 
        </p>
        <p>
          {" "}
          Click here to view the API{" "}
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://crustdata.notion.site/Crustdata-Discovery-And-Enrichment-API-c66d5236e8ea40df8af114f6d447ab48#3315bbdfa0054a2aa440e98bdec3ff90"
            target="_blank"
          >
            Docs
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
