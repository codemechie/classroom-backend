import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from '../db/schema/auth'

const AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET environment variable is required");
}

if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL environment variable is required");
}

export const auth = betterAuth({
    secret: AUTH_SECRET,
    trustedOrigins: [FRONTEND_URL],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string", required: true, defaultValue: 'student', input: true
            },
            imageCldPubId: {
                type: "string", required: false, input: true
            }
        }
    }
});
