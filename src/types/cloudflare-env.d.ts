declare global {
  interface CloudflareEnv {
    DATABASE_URL: string;
    AUTH_SECRET: string;
    MICROSOFT_TENANT_ID: string;
    MICROSOFT_CLIENT_ID: string;
    MICROSOFT_CLIENT_SECRET: string;
    MICROSOFT_SHARED_MAILBOX: string;
    MICROSOFT_DEFAULT_TIMEZONE: string;
  }
}

export {};
