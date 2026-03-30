import type { PrismaConfig } from "@prisma/client";

const config: PrismaConfig = {
  datasources: {
    db: {
      provider: "postgresql",
      url:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/ai_chatboard",
    },
  },
  generator: {
    client: {
      provider: "prisma-client-js",
    },
  },
};

export default config;
