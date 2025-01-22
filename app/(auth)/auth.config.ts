import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/",
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      let isLoggedIn = !!auth?.user;
      //let isOnChat = nextUrl.pathname.startsWith("/");
      let isOnRegister = nextUrl.pathname.startsWith("/register");
      let isOnLogin = nextUrl.pathname.startsWith("/login");
      //let isOnAnonymous = nextUrl.pathname.startsWith("/anonymous");
      let isAnonymous = nextUrl.searchParams.get('anonymous') === 'true';
      let isOnMainChat = nextUrl.pathname === "/";
      //let isOnMainChat = nextUrl.pathname.startsWith("/");

      // Allow anonymous access to main chat
      if (isOnMainChat && isAnonymous) {
        return true;
      }

      // Handle login/register pages
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (isOnRegister || isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      // Main chat auth check
      if (isOnMainChat) {
        return isLoggedIn;
      }

      /*
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL("/", nextUrl));
      }

      if (isOnRegister || isOnLogin) {
        return true; // Always allow access to register and login pages
      }

      if (isOnMainChat) {
        //console.log(`anonymous = ${nextUrl.searchParams.get('anonymous')}`);
        if (isLoggedIn   || nextUrl.searchParams.get('anonymous') === 'true' ) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn  || nextUrl.searchParams.get('anonymous') === 'true') {
        return Response.redirect(new URL("/", nextUrl));
      } // Redirect authenticated users to main chat page if logged in or in anonymous mode
      */

      return true;
    },
  },
} satisfies NextAuthConfig;
