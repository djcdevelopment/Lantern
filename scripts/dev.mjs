/* Runs the Lantern server and the Vite dev server together so
   `npm run dev` is one command. Ctrl+C stops both. */

import { spawn } from "node:child_process";

const procs = [
  spawn("node", ["server/server.mjs"], { stdio: "inherit", shell: true }),
  spawn("npx", ["vite"], { stdio: "inherit", shell: true }),
];

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const p of procs) {
    try {
      p.kill();
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}

for (const p of procs) {
  p.on("exit", (code) => stopAll(code ?? 0));
}
process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
