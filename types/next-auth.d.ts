import "next-auth";
import "next-auth/jwt";
import type { AuthUser } from "@/lib/auth/types";

declare module "next-auth" {
  interface Session {
    accessToken?: string | null;
    user?: AuthUser;
  }

  interface User extends AuthUser {
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    user?: AuthUser;
  }
}

export {};
