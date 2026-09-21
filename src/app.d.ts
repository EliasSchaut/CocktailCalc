// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  /** Injected by vite `define` (see vite.config.ts). */
  const __TAURI_BUILD__: boolean;
  const __API_BASE__: string;
}

export {};
