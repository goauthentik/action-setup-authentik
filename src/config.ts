import * as core from "@actions/core";

export interface Inputs {
  version: string;
  sentryEnv: string;
  wait: boolean;
  waitUrl: string;
  blueprintsPath: string;
  enterpriseLicense: boolean;
  enterpriseLicenseUsersInternal: string;
  enterpriseLicenseUsersExternal: string;
}

export function getInputs(): Inputs {
  return {
    version: core.getInput("version") || "stable",
    sentryEnv: core.getInput("sentry_env") || "github-actions",
    wait: core.getBooleanInput("wait"),
    waitUrl: core.getInput("wait_url") || "http://localhost:9000/api/v3/root/config/",
    blueprintsPath: core.getInput("blueprints_path"),
    enterpriseLicense: core.getBooleanInput("enterprise_license"),
    enterpriseLicenseUsersInternal: core.getInput("enterprise_license_users_internal") || "1",
    enterpriseLicenseUsersExternal: core.getInput("enterprise_license_users_external") || "1",
  };
}
