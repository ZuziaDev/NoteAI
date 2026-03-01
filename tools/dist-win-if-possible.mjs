import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.platform !== "win32") {
  console.log(
    "[dist] Skipping .exe build: Windows is required. Run `npm run dist:win` on a Windows machine or CI runner."
  );
  process.exit(0);
}

const result = spawnSync("npm", ["run", "dist:win"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

if (result.error) {
  console.error(`[dist] .exe build failed: ${result.error.message}`);
}

process.exit(1);
