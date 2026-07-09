import { beforeAll, describe, expect, it, vi } from "vitest";
import * as exec from "../__fixtures__/exec.js";

vi.mock("@actions/exec", () => exec);

let ComposeCommand: typeof import("../src/dockerCompose.js").ComposeCommand;

beforeAll(async () => {
  ({ ComposeCommand } = await import("../src/dockerCompose.js"));
});

describe("ComposeCommand.listImages", () => {
  it("dedupes and sorts the resolved image references", async () => {
    exec.exec.mockImplementation(
      async (
        _cmd: string,
        _args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        options?.listeners?.stdout?.(
          Buffer.from(
            "ghcr.io/goauthentik/server:2026.5.4\nghcr.io/goauthentik/server:2026.5.4\npostgres:16\n\n",
          ),
        );
        return 0;
      },
    );

    const compose = new ComposeCommand("/tmp/.env", ["/tmp/docker-compose.yml"]);
    const images = await compose.listImages();

    expect(images).toEqual(["ghcr.io/goauthentik/server:2026.5.4", "postgres:16"]);
  });
});

describe("ComposeCommand.listServices", () => {
  it("returns the declared service names in order", async () => {
    exec.exec.mockImplementation(
      async (
        _cmd: string,
        _args: string[],
        options?: { listeners?: { stdout?: (data: Buffer) => void } },
      ) => {
        options?.listeners?.stdout?.(Buffer.from("postgresql\nserver\nworker\n\n"));
        return 0;
      },
    );

    const compose = new ComposeCommand("/tmp/.env", ["/tmp/docker-compose.yml"]);
    const services = await compose.listServices();

    expect(services).toEqual(["postgresql", "server", "worker"]);
  });
});

describe("ComposeCommand.logs", () => {
  it("fetches logs scoped to a single service", async () => {
    exec.exec.mockResolvedValue(0);

    const compose = new ComposeCommand("/tmp/.env", ["/tmp/docker-compose.yml"]);
    await compose.logs("server");

    expect(exec.exec).toHaveBeenCalledWith("docker", [
      "compose",
      "-p",
      "authentik",
      "--env-file",
      "/tmp/.env",
      "-f",
      "/tmp/docker-compose.yml",
      "logs",
      "server",
    ]);
  });
});
