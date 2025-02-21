// Mock implementation of undici's fetch
const fetch = globalThis.fetch;
const Headers = globalThis.Headers;
const Request = globalThis.Request;
const Response = globalThis.Response;
const FormData = globalThis.FormData;

export {
  fetch,
  Headers,
  Request,
  Response,
  FormData
}; 