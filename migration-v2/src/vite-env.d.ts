/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly APP_VERSION: string;
  readonly APP_GIT_SHA: string;
  readonly APP_BUILD_DATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
