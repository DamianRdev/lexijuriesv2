import { copyFile, access } from "fs/promises";

// TanStack Start SPA mode prerenders the client shell to _shell.html.
// Vercel serves index.html as the default document, so copy the shell over.
const SHELL = "dist/client/_shell.html";
const INDEX = "dist/client/index.html";

try {
  await access(SHELL);
} catch {
  console.error(`SPA shell not found at ${SHELL} — did the build run with spa.enabled?`);
  process.exit(1);
}

await copyFile(SHELL, INDEX);
console.log(`Copied ${SHELL} -> ${INDEX}`);
