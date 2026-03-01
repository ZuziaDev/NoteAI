import { spawnSync } from "node:child_process";
import process from "node:process";

if (process.platform !== "darwin") {
  console.log(
    "[dist] Skipping .dmg build: macOS is required. Run `npm run dist:mac` on a macOS machine or CI runner."
  );
  process.exit(0);
}

const result = spawnSync("npm", ["run", "dist:mac"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

if (result.error) {
  console.error(`[dist] .dmg build failed: ${result.error.message}`);
}

process.exit(1);
