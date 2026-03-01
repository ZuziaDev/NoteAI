import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const packageJsonPath = path.join(cwd, "package.json");

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const extractVersionSection = (markdown, version) => {
  const lines = markdown.split(/\r?\n/);
  const heading = `## ${version}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) {
    return null;
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
};

const listReleaseArtifacts = async (releaseDir) => {
  const entries = await fs.readdir(releaseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.name !== "README.md" && entry.name !== "CHANGELOG.md")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => `- \`${entry.name}${entry.isDirectory() ? "/" : ""}\``);
};

const run = async () => {
  const packageJson = await readJson(packageJsonPath);
  const version = String(packageJson.version ?? "").trim();
  const productName = String(
    packageJson.build?.productName ?? packageJson.productName ?? packageJson.name ?? "App",
  );

  if (!version) {
    throw new Error("package.json version is missing.");
  }

  const releaseDir = path.join(cwd, "version", version);
  const versionReadmePath = path.join(cwd, "version", "README.md");

  await fs.mkdir(releaseDir, { recursive: true });

  let versionReadme = "";
  try {
    versionReadme = await fs.readFile(versionReadmePath, "utf8");
  } catch {
    versionReadme = "";
  }

  const versionSection = extractVersionSection(versionReadme, version);
  const artifacts = await listReleaseArtifacts(releaseDir);
  const artifactLines =
    artifacts.length > 0 ? artifacts.join("\n") : "- _(No build artifacts found yet)_";

  const readmeContent = `# ${productName} ${version} Release Notes

This folder contains packaged artifacts for \`${productName} ${version}\`.

## Included Files

${artifactLines}

## Notes

- Full changelog is available at [../README.md](../README.md).
- Generated at: ${new Date().toISOString()}
`;

  const changelogSection = versionSection
    ? `${versionSection}\n`
    : `## ${version}

- No version section found in [../README.md](../README.md).
`;

  const changelogContent = `# ${productName} ${version} Changelog

${changelogSection}
## Full History

See [../README.md](../README.md).
`;

  await fs.writeFile(path.join(releaseDir, "README.md"), readmeContent, "utf8");
  await fs.writeFile(path.join(releaseDir, "CHANGELOG.md"), changelogContent, "utf8");

  console.log(`[release:docs] Updated ${path.join("version", version, "README.md")}`);
  console.log(`[release:docs] Updated ${path.join("version", version, "CHANGELOG.md")}`);
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[release:docs] Failed: ${message}`);
  process.exit(1);
});
