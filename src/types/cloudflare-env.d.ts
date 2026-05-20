declare global {
  interface CloudflareEnv {
    DATABASE_URL: string;
    AUTH_SECRET: string;
  }
}

export {};
