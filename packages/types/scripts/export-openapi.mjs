import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const sourceUrl = process.env.OPENAPI_URL ?? "http://localhost:8000/openapi.json";
const targetPath = resolve(process.cwd(), "openapi.snapshot.json");

const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI schema from ${sourceUrl}: ${response.status}`);
}

const schema = await response.json();
await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, JSON.stringify(schema, null, 2));
console.log(`Wrote ${targetPath}`);
