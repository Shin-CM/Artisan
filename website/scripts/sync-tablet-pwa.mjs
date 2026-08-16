import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(websiteRoot, "..");
const tabletRoot = path.join(repoRoot, "pwa-tablet");
const outDir = path.join(websiteRoot, "public", "tablet-app");

function run(command, args, cwd, env = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      ...env,
    },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(tabletRoot)) {
  console.error("Dossier pwa-tablet introuvable.");
  process.exit(1);
}

run("npm", ["install"], tabletRoot);
run("npm", ["run", "build"], tabletRoot, { VITE_TABLET_BASE: "/tablet-app/" });

const tabletDist = path.join(tabletRoot, "dist");
if (!existsSync(tabletDist)) {
  console.error("Build PWA non genere (dossier dist manquant).");
  process.exit(1);
}

mkdirSync(path.dirname(outDir), { recursive: true });
rmSync(outDir, { recursive: true, force: true });
cpSync(tabletDist, outDir, { recursive: true });

console.log("PWA tablette synchronisee dans website/public/tablet-app.");
