import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

loadDotenv({ path: ".env.local" });
loadDotenv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7: datasource URL is configured here (not in schema.prisma).
    // Migrations should use DIRECT_URL when pooling is enabled.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"] ?? "",
  },
});
