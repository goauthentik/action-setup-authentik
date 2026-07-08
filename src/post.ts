import * as core from "@actions/core";
import { ComposeCommand } from "./dockerCompose.js";

async function post(): Promise<void> {
  try {
    const envFilePath = core.getState("envFilePath");
    const composeFilesState = core.getState("composeFiles");
    if (!envFilePath || !composeFilesState) {
      core.debug("No compose state saved by the main step, skipping log dump.");
      return;
    }

    const composeFiles = JSON.parse(composeFilesState) as string[];
    const compose = new ComposeCommand(envFilePath, composeFiles);
    await core.group("authentik Logs", () => compose.logs());
  } catch (error) {
    core.warning(
      `Failed to dump authentik logs: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

post();
