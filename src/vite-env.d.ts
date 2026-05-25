/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANALYTICS_WORKER_URL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_ANALYTICS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
