// Unit tests for the pure helper functions embedded in index.html.
// Run with: node --test tests/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Only evaluate the DOM-free helper section (time, name and train-type helpers).
const start = script.indexOf("/* ---------- Taiwan time");
const end = script.indexOf("/* ---------- TDX client");
assert.ok(start >= 0 && end > start, "helper section markers not found in index.html");

const ctx = vm.createContext({ Intl, Date, Object, Number, String, isNaN });
vm.runInContext(script.slice(start, end), ctx);
// const-declared helpers are not properties of ctx, so expose them explicitly.
const h = vm.runInContext("({toMin, fromMin, nm, zh, norm, esc, typeInfo, STATUS, tpNow, fmtFeed, cleanId})", ctx);

test("toMin parses HH:MM and tolerates empty input", () => {
  assert.equal(h.toMin("00:00"), 0);
  assert.equal(h.toMin("07:05"), 425);
  assert.equal(h.toMin("23:59"), 1439);
  assert.equal(h.toMin(""), null);
  assert.equal(h.toMin(undefined), null);
});

test("fromMin wraps around midnight and pads", () => {
  assert.equal(h.fromMin(0), "00:00");
  assert.equal(h.fromMin(425), "07:05");
  assert.equal(h.fromMin(1440), "00:00");
  assert.equal(h.fromMin(-5), "23:55");
  assert.equal(h.fromMin(1500), "01:00");
});

test("nm / zh pick the right language", () => {
  assert.equal(h.nm({En: "Taipei", Zh_tw: "臺北"}), "Taipei");
  assert.equal(h.nm({Zh_tw: "臺北"}), "臺北");
  assert.equal(h.nm(null), "");
  assert.equal(h.nm("Direct"), "Direct");
  assert.equal(h.zh({En: "Taipei", Zh_tw: "臺北"}), "臺北");
  assert.equal(h.zh("Direct"), "");
});

test("norm folds case, 台/臺 and punctuation", () => {
  assert.equal(h.norm("Taipei Main-Station"), "taipeimainstation");
  assert.equal(h.norm("台北"), "臺北");
  assert.equal(h.norm(null), "");
});

test("esc escapes HTML special characters", () => {
  assert.equal(h.esc(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  assert.equal(h.esc(null), "");
  assert.equal(h.esc(0), "0");
});

test("typeInfo classifies train types", () => {
  assert.equal(h.typeInfo({En: "Taroko Express", Zh_tw: "太魯閣"}).label, "Taroko");
  assert.equal(h.typeInfo({Zh_tw: "普悠瑪"}).label, "Puyuma");
  assert.equal(h.typeInfo({En: "Tze-Chiang Limited Express(3000)"}).label, "Tze-Chiang 3000");
  assert.equal(h.typeInfo({En: "Tze-Chiang Limited Express"}).label, "Tze-Chiang");
  assert.equal(h.typeInfo({En: "Chu-Kuang Express"}).label, "Chu-Kuang");
  assert.equal(h.typeInfo({En: "Fast Local Train"}).label, "Fast Local");
  assert.equal(h.typeInfo({En: "Local Train"}).label, "Local");
  assert.equal(h.typeInfo({En: "Ordinary Train"}).label, "Ordinary");
  assert.equal(h.typeInfo(null).label, "Train");
});

test("tpNow returns Taipei date and time-of-day in expected shapes", () => {
  const n = h.tpNow();
  assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(n.hms, /^\d{2}:\d{2}:\d{2}$/);
  assert.ok(n.min >= 0 && n.min < 1440);
});

test("fmtFeed formats ISO timestamps in Taipei time", () => {
  assert.equal(h.fmtFeed("2026-01-01T00:00:00Z"), "08:00:00");
  assert.equal(h.fmtFeed(""), "—");
  assert.equal(h.fmtFeed("not a date"), "not a date");
});

test("cleanId only accepts plain station ids and train numbers from the URL hash", () => {
  assert.equal(h.cleanId("1000"), "1000");
  assert.equal(h.cleanId("T-123_a"), "T-123_a");
  assert.equal(h.cleanId(null), null);
  assert.equal(h.cleanId(""), null);
  assert.equal(h.cleanId('"><img src=x onerror=alert(1)>'), null);
  assert.equal(h.cleanId("../../etc"), null);
  assert.equal(h.cleanId("1".repeat(21)), null);
});
