import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import http from "node:http";
const available = (url) =>
    new Promise((resolve) => {
        const request = http.get(url, (response) => {
            response.resume();
            resolve(response.statusCode === 200);
        });
        request.on("error", () => resolve(false));
        request.setTimeout(500, () => {
            request.destroy();
            resolve(false);
        });
    });
const port = process.env.GRID_TEST_PORT ?? "4190";
const url = `http://127.0.0.1:${port}`;
const server = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    [
        "run",
        "dev",
        "--prefix",
        "playground",
        "--",
        "--host",
        "127.0.0.1",
        "--port",
        port,
        "--strictPort",
    ],
    { detached: process.platform !== "win32", stdio: "pipe" },
);
let output = "";
server.stdout.on("data", (data) => {
    output += data;
});
server.stderr.on("data", (data) => {
    output += data;
});
try {
    let ready = false;
    for (let attempt = 0; attempt < 100 && server.exitCode === null; attempt++) {
        ready = await available(url);
        if (ready) break;
        await setTimeout(100);
    }
    if (!ready) throw new Error(`Grid test server failed to start: ${output}`);
    const tests = spawn(process.execPath, ["tests/grid-browser.mjs"], {
        stdio: "inherit",
        env: { ...process.env, GRID_TEST_URL: url },
    });
    process.exitCode = await new Promise((resolve) =>
        tests.on("exit", (code) => resolve(code ?? 1)),
    );
} finally {
    if (process.platform === "win32") server.kill();
    else
        try {
            process.kill(-server.pid, "SIGTERM");
        } catch {
            /* already exited */
        }
}
