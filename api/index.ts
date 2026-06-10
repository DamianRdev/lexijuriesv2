// @ts-nocheck
import server from "../dist/server/server.js";

export default async function handler(request: Request) {
  // Vercel passes relative URLs — reconstruct the full URL so new URL() doesn't throw
  const url = new URL(request.url, `https://${request.headers.get("host") ?? "localhost"}`);
  const fullRequest = new Request(url.toString(), request);
  return server.fetch(fullRequest, {}, {});
}
