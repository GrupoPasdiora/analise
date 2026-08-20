import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, "client", "assets"), { recursive: true });
await mkdir(resolve(dist, "server"), { recursive: true });

await Promise.all([
  cp(resolve(root, "index.html"), resolve(dist, "client", "diagnostico.html")),
  cp(resolve(root, "index.html"), resolve(dist, "client", "index.html")),
  cp(resolve(root, "assets", "mel.jpg"), resolve(dist, "client", "assets", "mel.jpg")),
  cp(resolve(root, "worker", "index.js"), resolve(dist, "server", "index.js")),
]);

await writeFile(resolve(dist, "client", "_headers"), `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: DENY
`);

console.log("Build concluído em dist/");
