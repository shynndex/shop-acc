/**
 * ShopAccLQ — Backend Setup Script
 *
 * Usage:   node script/setup.js
 * Also:    npm run setup
 *
 * What it does:
 *   1. Checks if `sharp` (image processing) is installed; installs if missing
 *   2. Runs `node --check` on all backend source files to verify syntax
 *   3. Does a dry-run import of server.js to catch import resolution errors
 *   4. Reports a summary
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

let exitCode = 0;

// ── Helpers ─────────────────────────────────────────────────────
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function ok(msg) {
  console.log(`  ${colors.green}\u2713${colors.reset} ${msg}`);
}

function warn(msg) {
  console.log(`  ${colors.yellow}\u26A0${colors.reset} ${msg}`);
}

function fail(msg) {
  console.log(`  ${colors.red}\u2717${colors.reset} ${msg}`);
  exitCode = 1;
}

function header(title) {
  console.log(`\n${colors.cyan}${title}${colors.reset}`);
  console.log(`  ${colors.dim}${"\u2500".repeat(60)}${colors.reset}`);
}

// Recursively collect .js files from a directory
function collectJsFiles(dir) {
  if (!existsSync(dir)) return [];
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
    } else if (entry.isFile() && extname(entry.name) === ".js") {
      files.push(fullPath);
    }
  }
  return files;
}

// ── Step 1: Check & Install sharp ─────────────────────────────
header("Step 1: Image Processing (sharp)");

try {
  await import("sharp");
  ok("sharp is installed");
} catch {
  warn("sharp is missing \u2014 installing via npm\u2026");
  try {
    execSync("npm install sharp", { cwd: root, stdio: "inherit", timeout: 300_000 });
  } catch {
    fail("sharp installation failed \u2014 run 'npm install sharp' manually");
  }
  // Re-verify installation only if previous step didn't fail
  if (exitCode === 0) {
    try {
      await import("sharp");
      ok("sharp has been installed");
    } catch {
      fail("sharp installation failed \u2014 run 'npm install sharp' manually");
    }
  }
}

// ── Step 2: Syntax Check ──────────────────────────────────────
header("Step 2: Syntax Validation");

const srcDir = resolve(root, "src");
const jsFiles = collectJsFiles(srcDir);

if (jsFiles.length === 0) {
  warn("no source files found in src/ \u2014 empty or missing directory");
} else {
  let checkedCount = 0;
  for (const fullPath of jsFiles) {
    const relPath = relative(root, fullPath);
    try {
      execSync(`node --check "${fullPath}"`, { stdio: "pipe", timeout: 30_000 });
      checkedCount++;
    } catch (err) {
      const stderr = err.stderr?.toString() || err.message;
      const lines = stderr.split("\n").filter(Boolean);
      fail(`${relPath}\n     ${lines.slice(0, 3).join("\n     ")}`);
    }
  }

  if (exitCode === 0) {
    ok(`all ${checkedCount} source files parsed successfully`);
  } else {
    warn(`${checkedCount}/${jsFiles.length} files passed, some failed (see above)`);
  }
}

// ── Step 3: Import Resolution Check ───────────────────────────
header("Step 3: Import Resolution Check");

const serverPath = resolve(root, "src/server.js");
if (!existsSync(serverPath)) {
  warn("src/server.js not found \u2014 skipping import check");
} else {
  // Escape backslashes for the shell command (Windows compat)
  const escapedPath = serverPath.replace(/\\/g, "\\\\");
  try {
    // NOTE: No .catch(() => {}) here! If import fails for ANY reason,
    // --unhandled-rejections=strict ensures process exits with code 1.
    // We then classify the error by inspecting stderr.
    execSync(
      `node --unhandled-rejections=strict -e "import('${escapedPath}')"`,
      { cwd: root, stdio: "pipe", timeout: 15_000 },
    );
    ok("server.js loaded without errors");
  } catch (err) {
    const stderr = err.stderr?.toString() || "";
    if (
      stderr.includes("ERR_MODULE_NOT_FOUND") ||
      stderr.includes("ERR_MODULE_RESOLUTION_LEGACY") ||
      stderr.includes("Cannot find module")
    ) {
      const lines = stderr.split("\n").filter(Boolean);
      fail(`import resolution error\n     ${lines.slice(0, 3).join("\n     ")}`);
    } else {
      // DB connection refused or other runtime error — expected without MongoDB
      ok("no module resolution errors detected (runtime errors may still exist)");
    }
  }
}

// ── Step 4: Check .env exists (warn only) ─────────────────────
header("Step 4: Configuration Check");

const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  ok(".env file found");
} else {
  warn(`.env file missing at ${envPath}\n     Create one from .env.example or env template`);
}

// ── Summary ────────────────────────────────────────────────────
console.log(`\n${colors.dim}${"\u2550".repeat(60)}${colors.reset}`);
if (exitCode === 0) {
  console.log(`\n${colors.green}Setup complete \u2014 syntax and imports are valid.${colors.reset}`);
  console.log(`  Run ${colors.cyan}npm start${colors.reset} or ${colors.cyan}npm run dev${colors.reset} to start the server.\n`);
} else {
  console.log(`\n${colors.red}Setup completed with issues \u2014 review the errors above.${colors.reset}\n`);
  process.exit(exitCode);
}
