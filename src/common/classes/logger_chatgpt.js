/*
 * from https://chatgpt.com/g/g-p-699ffbb7631c8191b19ff7adca2780cd-javascript-language/c/699ffc99-8200-8392-8aa2-48fed61a2de9
 */


/* global Meteor */
import { Meteor } from "meteor/meteor";

// Order matters
const LEVELS = ["silent", "error", "warn", "info", "debug", "trace"];

function levelIndex(lvl) {
  const idx = LEVELS.indexOf(String(lvl || "").toLowerCase());
  return idx === -1 ? LEVELS.indexOf("info") : idx;
}

function getConfiguredLevel() {
  // Prefer settings. Fallback to env on server.
  if (Meteor.isClient) {
    return Meteor.settings?.public?.logLevel ?? "trace";
  }
  return Meteor.settings?.logLevel ?? process.env.LOG_LEVEL ?? "trace";
}

// Browser: style with %c. Server: ANSI is fine (optional).
const STYLE = {
  error: "color:#d00;font-weight:700",
  warn:  "color:#d80;font-weight:700",
  info:  "color:#06c;font-weight:700",
  debug: "color:#090;font-weight:700",
  trace: "color:#666;font-weight:700",
};

function callerHint(stackFramesToSkip = 2) {
  // NOTE: heuristic. Meteor bundling/minification can alter stacks.
  const err = new Error();
  const stack = String(err.stack || "").split("\n").slice(stackFramesToSkip);
  const line = stack.find(s => s.includes("/") || s.includes("\\") || s.includes("http"));
  if (!line) return "";
  // Try to extract ".../file.js:line:col" or "http...:line:col"
  const m = line.match(/((?:https?:\/\/.*?|\/.*?|[A-Za-z]:\\.*?)):(\d+):(\d+)/);
  return m ? `${m[1]}:${m[2]}` : "";
}

function createLogger(namespace = "") {
  const ns = namespace ? `[${namespace}]` : "";
  const configured = () => levelIndex(getConfiguredLevel());

  function enabled(method) {
    return levelIndex(method) <= configured();
  }

  function out(method, ...args) {
    if (!enabled(method)) return;

    const hint = callerHint(3);
    if (Meteor.isClient) {
      // Keep args as-is so objects remain expandable.
      const prefix = `${ns}${hint ? " " + hint : ""}`;
      const style = STYLE[method] || STYLE.info;
      //console.warn.call( console, 'calling console', args );
      (console[method] || console.log).call(console, `%c${method.toUpperCase()}%c ${prefix}`, style, "color:inherit", '(client-side)', ...args);
    } else {
      const prefix = `${method.toUpperCase()} ${ns}${hint ? " " + hint : ""}`;
      (console[method] || console.log).call(console, prefix, '(server-side)', ...args);
    }
  }

  return {
    error: (...a) => out("error", ...a),
    warn:  (...a) => out("warn",  ...a),
    info:  (...a) => out("info",  ...a),
    debug: (...a) => out("debug", ...a),
    trace: (...a) => out("trace", ...a),
  };
}

export const Logger = createLogger();
