import * as crypto from "node:crypto";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import type { ComposeCommand } from "./dockerCompose.js";

const CACHE_KEY_PREFIX = "authentik-docker-images-v1";

export function imageCacheKey(images: string[]): string {
  const hash = crypto.createHash("sha256").update(images.join("\n")).digest("hex");
  return `${CACHE_KEY_PREFIX}-${hash}`;
}

export async function restoreImageCache(
  compose: ComposeCommand,
  tarPath: string,
): Promise<boolean> {
  try {
    const images = await compose.listImages();
    if (images.length === 0) {
      return false;
    }
    const key = imageCacheKey(images);
    const restoredKey = await cache.restoreCache([tarPath], key);
    if (!restoredKey) {
      return false;
    }
    core.info(`Restored cached container images (key: ${key})`);
    await exec.exec("docker", ["load", "-i", tarPath]);
    return true;
  } catch (err) {
    core.warning(`Failed to restore container image cache: ${(err as Error).message}`);
    return false;
  }
}

export async function saveImageCache(compose: ComposeCommand, tarPath: string): Promise<void> {
  try {
    const images = await compose.listImages();
    if (images.length === 0) {
      return;
    }
    const key = imageCacheKey(images);
    await exec.exec("docker", ["save", "-o", tarPath, ...images]);
    await cache.saveCache([tarPath], key);
    core.info(`Saved container image cache (key: ${key})`);
  } catch (err) {
    core.warning(`Failed to save container image cache: ${(err as Error).message}`);
  }
}
