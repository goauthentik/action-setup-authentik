import * as fs from 'node:fs';
import * as path from 'node:path';
import { c as coreExports, C as ComposeCommand } from './dockerCompose-IWTkVkmg.js';
import * as crypto from 'node:crypto';
import 'os';
import 'crypto';
import 'fs';
import 'path';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'assert';
import 'util';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'url';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'child_process';
import 'timers';

function discoverBlueprintFiles(absPath) {
    const results = [];
    function walk(dir, rel) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const entryRel = rel ? path.join(rel, entry.name) : entry.name;
            if (entry.isDirectory()) {
                walk(path.join(dir, entry.name), entryRel);
            }
            else if (entry.isFile()) {
                results.push(entryRel);
            }
        }
    }
    walk(absPath, "");
    results.sort();
    return results;
}
function buildOverrideComposeContent(hostPath) {
    if (hostPath.includes('"')) {
        throw new Error(`blueprints_path resolves to a path containing a double quote, which would break the generated compose override: ${hostPath}`);
    }
    return `services:\n  worker:\n    volumes:\n      - "${hostPath}:/blueprints/action-setup-authentik"\n`;
}
function writeOverrideFile(destPath, hostPath) {
    fs.writeFileSync(destPath, buildOverrideComposeContent(hostPath));
}
async function execWithRetry(fn, timeoutMs = 120_000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        try {
            await fn();
            return;
        }
        catch (error) {
            if (Date.now() >= deadline) {
                throw error;
            }
            coreExports.warning(`Blueprint apply failed, retrying in 5s: ${error.message}`);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}
async function applyBlueprints(compose, files) {
    for (const fn of files) {
        await coreExports.group(`Blueprint ${fn}`, () => execWithRetry(() => compose.execInService("worker", ["ak", "apply_blueprint", `action-setup-authentik/${fn}`])));
    }
}

function getInputs() {
    return {
        version: coreExports.getInput("version") || "stable",
        sentryEnv: coreExports.getInput("sentry_env") || "github-actions",
        wait: coreExports.getBooleanInput("wait"),
        waitUrl: coreExports.getInput("wait_url") || "http://localhost:9000/api/v3/root/config/",
        blueprintsPath: coreExports.getInput("blueprints_path"),
        enterpriseLicense: coreExports.getBooleanInput("enterprise_license"),
        enterpriseLicenseUsersInternal: coreExports.getInput("enterprise_license_users_internal") || "1",
        enterpriseLicenseUsersExternal: coreExports.getInput("enterprise_license_users_external") || "1",
    };
}

const CUSTOMER_PORTAL_TOKEN_URL = "https://id.customers.goauthentik.io/application/o/token/";
const CUSTOMER_PORTAL_CLIENT_ID = "lq9mHxJPqvTHClDS2zACiCBwhzCk2eiWDs5xgcVvo1aKs4R00Q0QzLyBrwYyhoOq";
const CUSTOMER_PORTAL_SCOPE = "openid profile email";
const LOCAL_AUTHENTIK_URL = "http://localhost:9000";
const CUSTOMER_PORTAL_LICENSE_URL = "https://customers.goauthentik.io/api/v1/license/create/dev/";
async function getCustomerPortalToken() {
    const idToken = await coreExports.getIDToken();
    const params = new URLSearchParams();
    params.set("grant_type", "client_credentials");
    params.set("client_id", CUSTOMER_PORTAL_CLIENT_ID);
    params.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    params.set("client_assertion", idToken);
    params.set("scope", CUSTOMER_PORTAL_SCOPE);
    const resp = await fetch(CUSTOMER_PORTAL_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    if (!resp.ok) {
        throw new Error(`Failed to get customer portal token: ${resp.status} ${await resp.text()}`);
    }
    const body = (await resp.json());
    return body.access_token;
}
async function getAndInstallEnterpriseLicense(adminToken, customerToken, usersInternal, usersExternal) {
    const installIdResp = await fetch(`${LOCAL_AUTHENTIK_URL}/api/v3/enterprise/license/install_id/`, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!installIdResp.ok) {
        throw new Error(`Failed to fetch install_id: ${installIdResp.status}`);
    }
    const { install_id: installId } = (await installIdResp.json());
    const createResp = await fetch(CUSTOMER_PORTAL_LICENSE_URL, {
        method: "POST",
        headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
            install_id: installId,
            users_internal: Number(usersInternal),
            users_external: Number(usersExternal),
        }),
    });
    if (!createResp.ok) {
        throw new Error(`Failed to create license: ${createResp.status} ${await createResp.text()}`);
    }
    const { license_key: licenseKey } = (await createResp.json());
    coreExports.setSecret(licenseKey);
    const installResp = await fetch(`${LOCAL_AUTHENTIK_URL}/api/v3/enterprise/license/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ key: licenseKey }),
    });
    if (!installResp.ok) {
        throw new Error(`Failed to install license: ${installResp.status} ${await installResp.text()}`);
    }
    return licenseKey;
}

function createTempDir() {
    const runnerTemp = process.env.RUNNER_TEMP;
    if (!runnerTemp) {
        throw new Error("RUNNER_TEMP is not set — are we running outside a GitHub Actions runner?");
    }
    const dir = fs.mkdtempSync(path.join(runnerTemp, "authentik-"));
    coreExports.debug(`Using temp dir: ${dir}`);
    return dir;
}
function envFilePath(tempDir) {
    return path.join(tempDir, ".env");
}
function composeFilePath(tempDir) {
    return path.join(tempDir, "docker-compose.yml");
}
function overrideComposeFilePath(tempDir) {
    return path.join(tempDir, "docker-compose.override.yml");
}
class EnvFile {
    path;
    lines = [];
    constructor(path) {
        this.path = path;
    }
    set(key, value) {
        this.lines.push(`${key}=${value}`);
    }
    writeSync() {
        fs.writeFileSync(this.path, this.lines.map((line) => `${line}\n`).join(""));
    }
}
function generateSecret(bytes) {
    const value = crypto.randomBytes(bytes).toString("base64");
    coreExports.setSecret(value);
    return value;
}

const COMPOSE_URL = "https://goauthentik.io/compose.yml";
function prepare(inputs, envFile) {
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
async function configure(inputs, envFile, composeFilePath) {
    if (coreExports.isDebug()) {
        envFile.set("AUTHENTIK_LOG_LEVEL", "debug");
    }
    if (inputs.version === "beta") {
        envFile.set("AUTHENTIK_IMAGE", "ghcr.io/goauthentik/dev-server");
        envFile.set("AUTHENTIK_TAG", "gh-next");
        envFile.set("AUTHENTIK_OUTPOSTS__DOCKER_IMAGE_BASE", "ghcr.io/goauthentik/dev-%(type)s:gh-%(build_hash)s");
    }
    else if (inputs.version !== "stable") {
        envFile.set("AUTHENTIK_TAG", inputs.version);
    }
    const resp = await fetch(COMPOSE_URL);
    if (!resp.ok) {
        throw new Error(`Failed to download docker-compose.yml from ${COMPOSE_URL}: ${resp.status}`);
    }
    fs.writeFileSync(composeFilePath, await resp.text());
    return new ComposeCommand(envFile.path, [composeFilePath]);
}

async function startAuthentik(compose) {
    await coreExports.group("Pulling authentik images...", () => compose.pull());
    await coreExports.group("Starting authentik...", () => compose.up());
    const serverContainerId = await compose.containerIdByLabel("server");
    const workerContainerId = await compose.containerIdByLabel("worker");
    return { serverContainerId, workerContainerId };
}
async function waitForReady(url, token, timeoutMs = 600_000) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        coreExports.info(`Testing authentik with URL ${url}...`);
        try {
            const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (resp.status === 200) {
                return;
            }
        }
        catch (err) {
            coreExports.debug(`Wait request failed, retrying: ${err.message}`);
        }
        if (Date.now() >= deadline) {
            throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s waiting for authentik to become ready at ${url}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

async function run() {
    try {
        const inputs = getInputs();
        coreExports.setOutput("http_url", "http://localhost:9000");
        coreExports.setOutput("https_url", "https://localhost:9443");
        const tempDir = createTempDir();
        coreExports.saveState("tempDir", tempDir);
        const envFile = new EnvFile(envFilePath(tempDir));
        const { adminToken, adminPassword } = prepare(inputs, envFile);
        coreExports.setOutput("admin_token", adminToken);
        coreExports.setOutput("admin_password", adminPassword);
        const compose = await configure(inputs, envFile, composeFilePath(tempDir));
        envFile.writeSync();
        let blueprintFiles = [];
        if (inputs.blueprintsPath !== "") {
            const workspace = process.env.GITHUB_WORKSPACE;
            if (!workspace) {
                throw new Error("GITHUB_WORKSPACE is not set — are we running outside a GitHub Actions runner?");
            }
            const absPath = fs.realpathSync(path.resolve(workspace, inputs.blueprintsPath));
            blueprintFiles = discoverBlueprintFiles(absPath);
            const overridePath = overrideComposeFilePath(tempDir);
            writeOverrideFile(overridePath, absPath);
            compose.addComposeFile(overridePath);
        }
        coreExports.saveState("composeFiles", JSON.stringify(compose.composeFiles));
        coreExports.saveState("envFilePath", envFile.path);
        const { serverContainerId, workerContainerId } = await startAuthentik(compose);
        coreExports.setOutput("server_container_id", serverContainerId);
        coreExports.setOutput("worker_container_id", workerContainerId);
        if (blueprintFiles.length > 0) {
            await applyBlueprints(compose, blueprintFiles);
        }
        if (inputs.wait) {
            coreExports.info("Waiting for authentik to be up and running...");
            await waitForReady(inputs.waitUrl, adminToken);
        }
        if (inputs.enterpriseLicense) {
            const customerToken = await getCustomerPortalToken();
            const licenseKey = await getAndInstallEnterpriseLicense(adminToken, customerToken, inputs.enterpriseLicenseUsersInternal, inputs.enterpriseLicenseUsersExternal);
            coreExports.setOutput("enterprise_license_key", licenseKey);
        }
    }
    catch (error) {
        coreExports.setFailed(error instanceof Error ? error.message : String(error));
    }
}
run();
//# sourceMappingURL=index.js.map
