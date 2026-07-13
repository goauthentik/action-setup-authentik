import { c as coreExports, C as ComposeCommand } from './dockerCompose-JLIjGAKg.js';
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

async function post() {
    try {
        const envFilePath = coreExports.getState("envFilePath");
        const composeFilesState = coreExports.getState("composeFiles");
        if (!envFilePath || !composeFilesState) {
            coreExports.debug("No compose state saved by the main step, skipping log dump.");
            return;
        }
        const composeFiles = JSON.parse(composeFilesState);
        const compose = new ComposeCommand(envFilePath, composeFiles);
        const services = await compose.listServices();
        for (const service of services) {
            try {
                await coreExports.group(`authentik Logs: ${service}`, () => compose.logs(service));
            }
            catch (error) {
                coreExports.warning(`Failed to dump logs for ${service}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    catch (error) {
        coreExports.warning(`Failed to dump authentik logs: ${error instanceof Error ? error.message : String(error)}`);
    }
}
post();
//# sourceMappingURL=post.js.map
