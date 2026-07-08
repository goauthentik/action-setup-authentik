import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as core from "@actions/core";

export function createTempDir(): string {
  const runnerTemp = process.env.RUNNER_TEMP;
  if (!runnerTemp) {
    throw new Error("RUNNER_TEMP is not set — are we running outside a GitHub Actions runner?");
  }
  const dir = fs.mkdtempSync(path.join(runnerTemp, "authentik-"));
  core.debug(`Using temp dir: ${dir}`);
  return dir;
}

export function envFilePath(tempDir: string): string {
  return path.join(tempDir, ".env");
}

export function composeFilePath(tempDir: string): string {
  return path.join(tempDir, "docker-compose.yml");
}

export function overrideComposeFilePath(tempDir: string): string {
  return path.join(tempDir, "docker-compose.override.yml");
}

export class EnvFile {
  private readonly lines: string[] = [];

  constructor(readonly path: string) {}

  set(key: string, value: string): void {
    this.lines.push(`${key}=${value}`);
  }

  writeSync(): void {
    fs.writeFileSync(this.path, this.lines.map((line) => `${line}\n`).join(""));
  }
}

export function generateSecret(bytes: number): string {
  const value = crypto.randomBytes(bytes).toString("base64");
  core.setSecret(value);
  return value;
}
