declare module 'undici' {
  export const fetch: typeof globalThis.fetch;
  export const Headers: typeof globalThis.Headers;
  export const Request: typeof globalThis.Request;
  export const Response: typeof globalThis.Response;
  export const FormData: typeof globalThis.FormData;
} 