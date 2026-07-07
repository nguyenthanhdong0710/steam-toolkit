import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { callAuthService } from "@/lib/auth-service-client";

type VerifiedUser = { id: string; username: string };

const handleCredentialFlow = async (credentialId: string) => {
  if (process.env.USE_EXTERNAL_AUTH_SERVICE !== "true") {
    throw new Error("Biometric login is disabled");
  }

  const { ok, data } = await callAuthService<VerifiedUser>(
    "/biometric/verify",
    { credentialId },
  );
  if (!ok) throw new Error("User not found");
  return data;
};

const handlePasswordFlow = async (username: string, password: string) => {
  if (!password) throw new Error("Password required");

  if (process.env.USE_EXTERNAL_AUTH_SERVICE !== "true") {
    if (
      username !== process.env.STEAM_ACCOUNT_NAME ||
      password !== process.env.STEAM_PASSWORD
    ) {
      throw new Error("Invalid password");
    }
    return { id: username, username };
  }

  const { ok, data } = await callAuthService<VerifiedUser>("/verify-password", {
    username,
    password,
  });
  if (!ok) throw new Error("Invalid password");
  return data;
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        credentialId: { label: "credentialId", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) throw new Error("Missing credentials");
          const { username, password, credentialId } = credentials;
          if (credentialId) return handleCredentialFlow(credentialId);
          return handlePasswordFlow(username, password);
        } catch (error) {
          console.error(error);
          throw new Error("Login process failed");
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.accessToken = user.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
