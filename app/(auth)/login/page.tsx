"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/custom/auth-form";
import { Overview2 } from "@/components/custom/overview-unauth";
import { SubmitButton } from "@/components/custom/submit-button";

import { login, LoginActionState } from "../actions";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    },
  );

  useEffect(() => {
    if (state.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state.status === "success") {
      router.refresh();
    }
  }, [state.status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    formAction(formData);
  };

  return (
    <div>
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex w-full max-w-4xl flex-col md:flex-row gap-8">
          {/* Left column - Overview */}
          <div className="flex-1 w-full md:w-1/2 flex items-center justify-center">
            <Overview2 />
          </div>
    
          {/* Right column - Sign in form */}
          <div className="w-full md:w-1/2 flex items-center justify-center">
            <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
              <div className="flex flex-col items-center justify-center px-4 text-center sm:px-16">
                <h3 className="text-xl font-semibold dark:text-zinc-50 py-10">Sign In</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Use your email and password to sign in
                </p>
              </div>
              <AuthForm action={handleSubmit} defaultEmail={email}>
                <SubmitButton>Sign in</SubmitButton>
                <div className="flex flex-col gap-4 items-center mt-4">
                  <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
                    {"Don't have an account? "}
                    <Link
                      href="/register"
                      className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
                    >
                      Sign up
                    </Link>
                  </p>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                  <Link 
                    href="/?anonymous=true"
                    className="text-sm text-gray-500 hover:text-gray-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Continue without an account
                  </Link>
                </div>
              </AuthForm>
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden py-10"></div> 
    </div>

  );
}
