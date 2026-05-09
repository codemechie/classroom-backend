import "dotenv/config";
import {defineConfig} from "drizzle-kit";

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be defined in .env file');
}

export default defineConfig({
    schema: "./src/db/schema/index.ts",
    out: "./src/drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    }
})