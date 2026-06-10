import { readdir, writeFile, readFile } from "fs/promises";
import { join } from "path";

const ASSETS_DIR = "dist/client/assets";
const OUT_FILE = "dist/client/index.html";

const files = await readdir(ASSETS_DIR);

// Find CSS
const cssFile = files.find((f) => f.endsWith(".css"));

// Find the main JS entry: the index-*.js that contains hydrateRoot
const jsFiles = files.filter((f) => f.startsWith("index-") && f.endsWith(".js"));
let mainJsFile = null;
for (const f of jsFiles) {
  const content = await readFile(join(ASSETS_DIR, f), "utf-8");
  if (content.includes("hydrateRoot")) {
    mainJsFile = f;
    break;
  }
}

if (!mainJsFile) {
  // Fallback: largest index-*.js
  const withSize = await Promise.all(
    jsFiles.map(async (f) => {
      const content = await readFile(join(ASSETS_DIR, f), "utf-8");
      return { f, size: content.length };
    })
  );
  mainJsFile = withSize.sort((a, b) => b.size - a.size)[0]?.f;
}

if (!mainJsFile) {
  console.error("Could not find main JS entry in", ASSETS_DIR);
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LexPanel — Gestión Jurídica</title>
    ${cssFile ? `<link rel="stylesheet" crossorigin href="/assets/${cssFile}" />` : ""}
  </head>
  <body>
    <script type="module" crossorigin src="/assets/${mainJsFile}"></script>
  </body>
</html>`;

await writeFile(OUT_FILE, html);
console.log(`Generated ${OUT_FILE} (entry: ${mainJsFile})`);
