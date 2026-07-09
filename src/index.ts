import * as fs from "node:fs";
import * as path from "node:path";
import * as core from "@actions/core";
import { applyBlueprints, discoverBlueprintFiles, writeOverrideFile } from "./blueprints.js";
import { getInputs } from "./config.js";
import { getCustomerPortalToken, getAndInstallEnterpriseLicense } from "./enterpriseLicense.js";
import {
  composeFilePath,
  createTempDir,
  envFilePath,
  imageCacheTarPath,
  overrideComposeFilePath,
  EnvFile,
} from "./env.js";
import { prepare, configure } from "./setup.js";
import { startAuthentik, waitForReady } from "./start.js";

async function run(): Promise<void> {
  try {
    const inputs = getInputs();
    core.setOutput("http_url", "http://localhost:9000");
    core.setOutput("https_url", "https://localhost:9443");

    const tempDir = createTempDir();
    core.saveState("tempDir", tempDir);

    const envFile = new EnvFile(envFilePath(tempDir));
    const { adminToken, adminPassword } = prepare(inputs, envFile);
    core.setOutput("admin_token", adminToken);
    core.setOutput("admin_password", adminPassword);

    const compose = await configure(inputs, envFile, composeFilePath(tempDir));
    envFile.writeSync();

    let blueprintFiles: string[] = [];
    if (inputs.blueprintsPath !== "") {
      const workspace = process.env.GITHUB_WORKSPACE;
      if (!workspace) {
        throw new Error(
          "GITHUB_WORKSPACE is not set — are we running outside a GitHub Actions runner?",
        );
      }
      const absPath = fs.realpathSync(path.resolve(workspace, inputs.blueprintsPath));
      blueprintFiles = discoverBlueprintFiles(absPath);
      const overridePath = overrideComposeFilePath(tempDir);
      writeOverrideFile(overridePath, absPath);
      compose.addComposeFile(overridePath);
    }

    core.saveState("composeFiles", JSON.stringify(compose.composeFiles));
    core.saveState("envFilePath", envFile.path);

    const { serverContainerId, workerContainerId } = await startAuthentik(
      compose,
      inputs.cache,
      imageCacheTarPath(tempDir),
    );
    core.setOutput("server_container_id", serverContainerId);
    core.setOutput("worker_container_id", workerContainerId);

    if (blueprintFiles.length > 0) {
      await applyBlueprints(compose, blueprintFiles);
    }

    if (inputs.wait) {
      core.info("Waiting for authentik to be up and running...");
      await waitForReady(inputs.waitUrl, adminToken);
    }

    if (inputs.enterpriseLicense) {
      const customerToken = await getCustomerPortalToken();
      const licenseKey = await getAndInstallEnterpriseLicense(
        adminToken,
        customerToken,
        inputs.enterpriseLicenseUsersInternal,
        inputs.enterpriseLicenseUsersExternal,
      );
      core.setOutput("enterprise_license_key", licenseKey);
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
