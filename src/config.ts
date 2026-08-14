import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
    const dotenv = await import("dotenv");
    dotenv.config();
}

const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
        PORT: z.coerce.number().int().positive().default(3000),
        MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
        JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
        JWT_EXPIRATION_TIME: z.string().trim().min(1).default("1h"),
        LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error("Invalid environment configuration");
    console.error(z.prettifyError(parsedEnv.error));
    process.exit(1);
}

export const { NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRATION_TIME, LOG_LEVEL } =
    parsedEnv.data;
