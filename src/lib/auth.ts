import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  throw new Error(
    "BETTER_AUTH_SECRET must be configured with at least 32 characters.",
  );
}

const authBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
if (process.env.NODE_ENV === "production" && !authBaseURL) {
  throw new Error(
    "BETTER_AUTH_URL or NEXT_PUBLIC_APP_URL must be configured in production.",
  );
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "STUDENT",
        input: false,
      },
    },
  },
  baseURL: authBaseURL || "http://localhost:3000",
  secret: authSecret,
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
