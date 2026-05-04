/**
 * Cross-platform checks before push: ESLint, TypeScript, backend pytest (same env as CI).
 * Run manually: npm run verify
 * Skip hook: git push --no-verify   or   SKIP_VERIFY=1 git push
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const backend = path.join(root, "backend");

if (process.env.SKIP_VERIFY === "1") {
  console.log("[verify] SKIP_VERIFY=1 — skipping checks.");
  process.exit(0);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    ...opts,
  });
  if (r.status !== 0 && r.status !== null) {
    process.exit(r.status);
  }
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
}

const backendEnv = {
  ...process.env,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "sk-or-test-placeholder",
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
  DATABASE_URL: process.env.DATABASE_URL ?? "sqlite+aiosqlite:///:memory:",
  SECRET_KEY: process.env.SECRET_KEY ?? "ci-secret-key-not-for-prod",
};

console.log("[verify] eslint …");
run("npm", ["run", "lint"], { cwd: root });

console.log("[verify] tsc --noEmit …");
run("npx", ["tsc", "--noEmit"], { cwd: root });

console.log("[verify] backend pytest …");
const pytest = spawnSync(
  "python",
  ["-m", "pytest", "tests/", "-v", "--asyncio-mode=auto", "--tb=short"],
  { cwd: backend, env: backendEnv, stdio: "inherit", shell: true },
);
if (pytest.status !== 0 && pytest.status !== null) {
  process.exit(pytest.status);
}
if (pytest.error) {
  console.error("[verify] Could not run Python/pytest. Is Python on PATH and backend deps installed (pip install -r backend/requirements.txt)?");
  console.error(pytest.error);
  process.exit(1);
}

console.log("[verify] OK.");
