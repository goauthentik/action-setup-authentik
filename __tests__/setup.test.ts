import { describe, expect, it } from "vitest";
import { splitImageReference } from "../src/setup.js";

describe("splitImageReference", () => {
  it("splits an image and tag", () => {
    expect(splitImageReference("ghcr.io/goauthentik/server:2026.8")).toEqual({
      image: "ghcr.io/goauthentik/server",
      tag: "2026.8",
    });
  });

  it("keeps a registry port in the image", () => {
    expect(splitImageReference("127.0.0.1:5000/server:e2e")).toEqual({
      image: "127.0.0.1:5000/server",
      tag: "e2e",
    });
  });
});
