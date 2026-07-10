#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
// Stop hook: session-end verification. Warns (does not block) if obvious
// secrets are staged for commit. Exit 0 always — advisory only.
const { execFileSync } = require("node:child_process");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    const staged = execFileSync("git", ["diff", "--cached", "--name-only"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .filter(Boolean);
    const risky = staged.filter((f) => /(^|\/)\.env(\.|$)|custom\.db$/.test(f));
    if (risky.length) {
      process.stderr.write(
        `stop-check WARNING: secret/db files staged:\n  ${risky.join("\n  ")}\n`
      );
    }
  } catch {
    // not a git repo or git unavailable — nothing to verify
  }
  process.exit(0);
});
