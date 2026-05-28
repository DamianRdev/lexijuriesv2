import server from "../dist/server/server.js";

export const config = {
  runtime: "edge",
};

export default async function handler(request: Request) {
  return server.fetch(request, {}, {});
}
