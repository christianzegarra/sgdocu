/// <reference types="vite/client" />

export declare global {}

interface ImportMetaEnv {
  readonly PACKAGE_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
