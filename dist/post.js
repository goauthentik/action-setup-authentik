import { r as getState, d as debug, C as ComposeCommand, g as group, w as warning } from './dockerCompose-BmRLP88Q.js';
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
import 'node:assert';
import 'node:net';
import 'node:http';
import 'node:stream';
import 'node:buffer';
import 'node:util';
import 'node:querystring';
import 'node:events';
import 'node:diagnostics_channel';
import 'node:tls';
import 'node:zlib';
import 'node:perf_hooks';
import 'node:util/types';
import 'node:worker_threads';
import 'node:url';
import 'node:async_hooks';
import 'node:console';
import 'node:dns';
import 'string_decoder';
import 'child_process';
import 'timers';

async function post() {
    try {
        const envFilePath = getState("envFilePath");
        const composeFilesState = getState("composeFiles");
        if (!envFilePath || !composeFilesState) {
            debug("No compose state saved by the main step, skipping log dump.");
            return;
        }
        const composeFiles = JSON.parse(composeFilesState);
        const compose = new ComposeCommand(envFilePath, composeFiles);
        const services = await compose.listServices();
        for (const service of services) {
            try {
                await group(`authentik Logs: ${service}`, () => compose.logs(service));
            }
            catch (error) {
                warning(`Failed to dump logs for ${service}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    catch (error) {
        warning(`Failed to dump authentik logs: ${error instanceof Error ? error.message : String(error)}`);
    }
}
post();
//# sourceMappingURL=post.js.map
