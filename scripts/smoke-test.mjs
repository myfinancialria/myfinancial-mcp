#!/usr/bin/env node
/**
 * End-to-end check of the built bridge: spawns dist/index.js, runs the MCP
 * handshake, lists the tools and makes one tool call, then prints what an MCP
 * client would see.
 *
 * Usage: npm run build && npm run smoke [-- --framed]
 *   Without MYFINANCIAL_TOKEN the bridge runs in preview mode and the tool call
 *   returns the activation steps (no quota used). With a token it is a real
 *   search_stocks call, which counts as one call against your Tapetide quota.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const framed = process.argv.includes("--framed");
const bridge = spawn(process.execPath, [fileURLToPath(new URL("../dist/index.js", import.meta.url))], {
  stdio: ["pipe", "pipe", "inherit"],
});

/** Response handlers by request id. */
const pending = new Map();

bridge.on("exit", (code) => {
  for (const done of pending.values()) done({ error: { message: `bridge exited with code ${code}` } });
  pending.clear();
});

let buf = Buffer.alloc(0);
bridge.stdout.on("data", (chunk) => {
  buf = Buffer.concat([buf, chunk]);
  for (;;) {
    let body;
    if (framed) {
      const end = buf.indexOf("\r\n\r\n");
      if (end === -1) break;
      const len = Number(/Content-Length:\s*(\d+)/i.exec(buf.subarray(0, end).toString())?.[1]);
      if (buf.length < end + 4 + len) break;
      body = buf.subarray(end + 4, end + 4 + len).toString();
      buf = buf.subarray(end + 4 + len);
    } else {
      const nl = buf.indexOf("\n");
      if (nl === -1) break;
      body = buf.subarray(0, nl).toString();
      buf = buf.subarray(nl + 1);
    }
    const msg = JSON.parse(body);
    pending.get(msg.id)?.(msg);
    pending.delete(msg.id);
  }
});

function send(msg) {
  const json = JSON.stringify(msg);
  bridge.stdin.write(framed ? `Content-Length: ${Buffer.byteLength(json)}\r\n\r\n${json}` : `${json}\n`);
}

function request(id, method, params) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ error: { message: `${method} timed out` } }), 45_000);
    pending.set(id, (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
    send({ jsonrpc: "2.0", id, method, ...(params && { params }) });
  });
}

const init = await request(1, "initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "myfinancial-smoke-test", version: "1.0.0" },
});
if (init.error) {
  console.error(`FAIL: initialize failed: ${init.error.message}`);
  bridge.kill();
  process.exit(1);
}
send({ jsonrpc: "2.0", method: "notifications/initialized" });
const list = await request(2, "tools/list");
const call = await request(3, "tools/call", { name: "search_stocks", arguments: { query: "Reliance", limit: 3 } });
bridge.stdin.end();

const info = init.result?.serverInfo ?? {};
const tools = list.result?.tools ?? [];
const text = call.result?.content?.find((c) => c.type === "text")?.text ?? JSON.stringify(call.error ?? call);
const preview = !process.env.MYFINANCIAL_TOKEN && !process.env.TAPETIDE_TOKEN;

console.log(`Server:  ${info.title} (${info.name} v${info.version})`);
console.log(`Mode:    ${preview ? "preview, no token" : "live"} · ${framed ? "Content-Length" : "newline"} framing`);
console.log(`Brief:   ${(init.result?.instructions ?? "").slice(0, 110)}…`);
console.log(`Tools:   ${tools.length} (guide: "${tools.find((t) => t.name === "read_me")?.title}")`);
console.log(`Call:    search_stocks("Reliance") → ${call.result?.isError ? "isError" : call.error ? "error" : "ok"}`);
console.log(`         ${text.slice(0, 400).replace(/\s+/g, " ")}${text.length > 400 ? "…" : ""}`);

const problems = [
  info.title !== "MyFinancial Market Data" && "initialize did not return the MyFinancial server info",
  tools.length === 0 && "tools/list returned no tools",
  !preview && (call.error || call.result?.isError) && "the live tool call failed",
].filter(Boolean);

for (const p of problems) console.error(`FAIL: ${p}`);
if (!problems.length) console.log("\nSmoke test passed.");
bridge.kill();
process.exit(problems.length ? 1 : 0);
