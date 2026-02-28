/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_DEEP_LINK_SCHEME?: string;
  readonly VITE_DEEP_LINK_HOST?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type CashfreeCheckoutInstance = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
  }) => Promise<unknown>;
};

type CashfreeFactory = (options: {
  mode: "sandbox" | "production";
}) => CashfreeCheckoutInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

export {};
