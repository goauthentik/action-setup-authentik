import * as fs from "node:fs";
import * as path from "node:path";
import * as core from "@actions/core";
import type { ComposeCommand } from "./dockerCompose.js";

export function discoverBlueprintFiles(absPath: string): string[] {
  const results: string[] = [];

  function walk(dir: string, rel: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryRel = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), entryRel);
      } else if (entry.isFile()) {
        results.push(entryRel);
      }
    }
  }

  walk(absPath, "");
  results.sort();
  return results;
}

export function buildOverrideComposeContent(hostPath: string): string {
  if (hostPath.includes('"')) {
    throw new Error(
      `blueprints_path resolves to a path containing a double quote, which would break the generated compose override: ${hostPath}`,
    );
  }
  return `services:\n  worker:\n    volumes:\n      - "${hostPath}:/blueprints/action-setup-authentik"\n`;
}

export function writeOverrideFile(destPath: string, hostPath: string): void {
  fs.writeFileSync(destPath, buildOverrideComposeContent(hostPath));
}

async function execWithRetry(fn: () => Promise<void>, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    try {
      await fn();
      return;
    } catch (error) {
      if (Date.now() >= deadline) {
        throw error;
      }
      core.warning(`Blueprint apply failed, retrying in 5s: ${(error as Error).message}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

export async function applyBlueprints(compose: ComposeCommand, files: string[]): Promise<void> {
  for (const fn of files) {
    await core.group(`Blueprint ${fn}`, () =>
      execWithRetry(() =>
        compose.execInService("worker", ["ak", "apply_blueprint", `action-setup-authentik/${fn}`]),
      ),
    );
  }
}
