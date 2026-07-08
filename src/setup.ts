import * as fs from "node:fs";
import * as core from "@actions/core";
import type { Inputs } from "./config.js";
import { ComposeCommand } from "./dockerCompose.js";
import { EnvFile, generateSecret } from "./env.js";

const COMPOSE_URL = "https://goauthentik.io/compose.yml";

export interface PrepareResult {
  adminToken: string;
  adminPassword: string;
}

export function prepare(inputs: Inputs, envFile: EnvFile): PrepareResult {
  const pgPass = generateSecret(32);
  const secretKey = generateSecret(40);

  envFile.set("PG_PASS", pgPass);
  envFile.set("AUTHENTIK_SECRET_KEY", secretKey);
  envFile.set("AUTHENTIK_ERROR_REPORTING__ENABLED", "true");
  envFile.set("AUTHENTIK_ERROR_REPORTING__ENVIRONMENT", inputs.sentryEnv);
  envFile.set("AUTHENTIK_DISABLE_UPDATE_CHECK", "true");
  envFile.set("AUTHENTIK_DISABLE_STARTUP_ANALYTICS", "true");
  envFile.set("CI", "true");

  const adminToken = generateSecret(32);
  envFile.set("AUTHENTIK_BOOTSTRAP_TOKEN", adminToken);

  const adminPassword = generateSecret(32);
  envFile.set("AUTHENTIK_BOOTSTRAP_PASSWORD", adminPassword);

  return { adminToken, adminPassword };
}

export async function configure(
  inputs: Inputs,
  envFile: EnvFile,
  composeFilePath: string,
): Promise<ComposeCommand> {
  if (core.isDebug()) {
    envFile.set("AUTHENTIK_LOG_LEVEL", "debug");
  }

  if (inputs.version === "beta") {
    envFile.set("AUTHENTIK_IMAGE", "ghcr.io/goauthentik/dev-server");
    envFile.set("AUTHENTIK_TAG", "gh-next");
    envFile.set(
      "AUTHENTIK_OUTPOSTS__DOCKER_IMAGE_BASE",
      "ghcr.io/goauthentik/dev-%(type)s:gh-%(build_hash)s",
    );
  } else if (inputs.version !== "stable") {
    envFile.set("AUTHENTIK_TAG", inputs.version);
  }

  const resp = await fetch(COMPOSE_URL);
  if (!resp.ok) {
    throw new Error(`Failed to download docker-compose.yml from ${COMPOSE_URL}: ${resp.status}`);
  }
  fs.writeFileSync(composeFilePath, await resp.text());

  return new ComposeCommand(envFile.path, [composeFilePath]);
}
