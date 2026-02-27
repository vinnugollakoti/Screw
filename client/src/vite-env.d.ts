/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUI_PACKAGE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
