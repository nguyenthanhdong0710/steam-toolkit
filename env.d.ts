declare namespace NodeJS {
  interface ProcessEnv {
    STEAM_REFRESH_TOKEN: string;
    STEAM_ACCOUNT_NAME: string;
    STEAM_PASSWORD: string;
    STEAM_WEBAPI_KEY: string;
    CRON_SECRET: string;
    NEXTAUTH_SECRET: string;
    AUTH_SERVICE_URL: string;
    AUTH_SERVICE_API_KEY: string;
    USE_EXTERNAL_AUTH_SERVICE: string;
    NEXT_PUBLIC_USE_EXTERNAL_AUTH_SERVICE: string;
    NEXT_PUBLIC_BASE_URL: string;
  }
}
