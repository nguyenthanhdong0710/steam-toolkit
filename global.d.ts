import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username?: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    accessToken?: string;
  }
}

export {};
