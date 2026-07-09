import * as core from "@actions/core";
import type { ComposeCommand } from "./dockerCompose.js";
import { restoreImageCache, saveImageCache } from "./imageCache.js";

export interface StartResult {
  serverContainerId: string;
  workerContainerId: string;
}

export async function startAuthentik(
  compose: ComposeCommand,
  cacheEnabled: boolean,
  imageCacheTarPath: string,
): Promise<StartResult> {
  let cacheHit = false;
  if (cacheEnabled) {
    cacheHit = await core.group("Restoring cached authentik images...", () =>
      restoreImageCache(compose, imageCacheTarPath),
    );
  }

  await core.group("Pulling authentik images...", () => compose.pull());

  if (cacheEnabled && !cacheHit) {
    await core.group("Caching authentik images...", () =>
      saveImageCache(compose, imageCacheTarPath),
    );
  }

  await core.group("Starting authentik...", () => compose.up());

  const serverContainerId = await compose.containerIdByLabel("server");
  const workerContainerId = await compose.containerIdByLabel("worker");

  return { serverContainerId, workerContainerId };
}

export async function waitForReady(url: string, token: string, timeoutMs = 600_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    core.info(`Testing authentik with URL ${url}...`);
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.status === 200) {
        return;
      }
    } catch (err) {
      core.debug(`Wait request failed, retrying: ${(err as Error).message}`);
    }

    if (Date.now() >= deadline) {
      throw new Error(
        `Timed out after ${Math.round(timeoutMs / 1000)}s waiting for authentik to become ready at ${url}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
