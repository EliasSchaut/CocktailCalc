// The Tauri app is a static SPA talking to a remote API; the web build uses SSR.
export const ssr = !__TAURI_BUILD__;
export const prerender = false;
