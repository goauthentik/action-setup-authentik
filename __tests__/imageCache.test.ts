import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as cache from "../__fixtures__/cache.js";
import * as core from "../__fixtures__/core.js";
import * as exec from "../__fixtures__/exec.js";

vi.mock("@actions/cache", () => cache);
vi.mock("@actions/core", () => core);
vi.mock("@actions/exec", () => exec);

let ComposeCommand: typeof import("../src/dockerCompose.js").ComposeCommand;
let imageCacheKey: typeof import("../src/imageCache.js").imageCacheKey;
let restoreImageCache: typeof import("../src/imageCache.js").restoreImageCache;
let saveImageCache: typeof import("../src/imageCache.js").saveImageCache;

beforeAll(async () => {
  ({ ComposeCommand } = await import("../src/dockerCompose.js"));
  ({ imageCacheKey, restoreImageCache, saveImageCache } = await import("../src/imageCache.js"));
});

function stubResolvedImages(images: string[]): void {
  exec.exec.mockImplementation(
    async (
      _cmd: string,
      args: string[],
      options?: { listeners?: { stdout?: (data: Buffer) => void } },
    ) => {
      if (args.includes("config")) {
        options?.listeners?.stdout?.(Buffer.from(`${images.join("\n")}\n`));
      }
      return 0;
    },
  );
}

function newCompose(): InstanceType<typeof ComposeCommand> {
  return new ComposeCommand("/tmp/.env", ["/tmp/docker-compose.yml"]);
}

describe("imageCacheKey", () => {
  it("is deterministic for the same image list", () => {
    expect(imageCacheKey(["postgres:16", "server:1.0"])).toBe(
      imageCacheKey(["postgres:16", "server:1.0"]),
    );
  });

  it("changes when the image list changes", () => {
    expect(imageCacheKey(["postgres:16"])).not.toBe(imageCacheKey(["postgres:16", "server:1.0"]));
  });
});

describe("restoreImageCache", () => {
  beforeEach(() => {
    stubResolvedImages(["postgres:16"]);
  });

  it("loads the cached tarball and returns true on a cache hit", async () => {
    cache.restoreCache.mockResolvedValue("authentik-docker-images-v1-abc");

    const hit = await restoreImageCache(newCompose(), "/tmp/images.tar");

    expect(hit).toBe(true);
    expect(exec.exec).toHaveBeenCalledWith("docker", ["load", "-i", "/tmp/images.tar"]);
  });

  it("returns false without loading on a cache miss", async () => {
    cache.restoreCache.mockResolvedValue(undefined);

    const hit = await restoreImageCache(newCompose(), "/tmp/images.tar");

    expect(hit).toBe(false);
    expect(exec.exec).not.toHaveBeenCalledWith("docker", ["load", "-i", "/tmp/images.tar"]);
  });

  it("swallows cache-service errors and returns false", async () => {
    cache.restoreCache.mockRejectedValue(new Error("cache service unavailable"));

    const hit = await restoreImageCache(newCompose(), "/tmp/images.tar");

    expect(hit).toBe(false);
    expect(core.warning).toHaveBeenCalled();
  });
});

describe("saveImageCache", () => {
  beforeEach(() => {
    stubResolvedImages(["postgres:16"]);
  });

  it("saves the resolved images to a tarball and uploads it", async () => {
    cache.saveCache.mockResolvedValue(1);

    await saveImageCache(newCompose(), "/tmp/images.tar");

    expect(exec.exec).toHaveBeenCalledWith("docker", [
      "save",
      "-o",
      "/tmp/images.tar",
      "postgres:16",
    ]);
    expect(cache.saveCache).toHaveBeenCalledWith(
      ["/tmp/images.tar"],
      imageCacheKey(["postgres:16"]),
    );
  });

  it("swallows errors from the cache service", async () => {
    cache.saveCache.mockRejectedValue(new Error("cache already exists"));

    await expect(saveImageCache(newCompose(), "/tmp/images.tar")).resolves.toBeUndefined();

    expect(core.warning).toHaveBeenCalled();
  });
});
