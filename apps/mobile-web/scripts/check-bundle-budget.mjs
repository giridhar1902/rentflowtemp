#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const assetsDir = path.join(projectRoot, "dist", "assets");

const entryBudgetKb = Number(process.env.BUNDLE_BUDGET_ENTRY_KB ?? 260);
const runtimeBudgetKb = Number(process.env.BUNDLE_BUDGET_RUNTIME_KB ?? 5);
const totalBudgetKb = Number(process.env.BUNDLE_BUDGET_TOTAL_KB ?? 1100);

const toKb = (bytes) => bytes / 1024;

const run = async () => {
  try {
    await fs.access(assetsDir);
  } catch {
    console.error(`Missing build artifacts at ${assetsDir}. Run build first.`);
    process.exit(1);
  }

  const entries = await fs.readdir(assetsDir, { withFileTypes: true });
  const jsFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => entry.name);

  if (jsFiles.length === 0) {
    console.error("No JavaScript assets found in dist/assets.");
    process.exit(1);
  }

  const sizeMap = new Map();
  for (const file of jsFiles) {
    const stats = await fs.stat(path.join(assetsDir, file));
    sizeMap.set(file, stats.size);
  }

  const entryCandidates = jsFiles.filter((file) => /^index-.*\.js$/.test(file));
  const runtimeCandidates = jsFiles.filter((file) => /^web-.*\.js$/.test(file));

  const entryFile =
    entryCandidates.sort((a, b) => (sizeMap.get(b) ?? 0) - (sizeMap.get(a) ?? 0))[0] ??
    jsFiles.sort((a, b) => (sizeMap.get(b) ?? 0) - (sizeMap.get(a) ?? 0))[0];

  const runtimeFile =
    runtimeCandidates.sort((a, b) => (sizeMap.get(b) ?? 0) - (sizeMap.get(a) ?? 0))[0] ?? null;

  const entryBytes = sizeMap.get(entryFile) ?? 0;
  const runtimeBytes = runtimeFile ? (sizeMap.get(runtimeFile) ?? 0) : 0;
  const totalBytes = Array.from(sizeMap.values()).reduce((sum, value) => sum + value, 0);

  const checks = [
    {
      label: "Entry Chunk",
      file: entryFile,
      actualKb: toKb(entryBytes),
      budgetKb: entryBudgetKb,
    },
    {
      label: "Runtime Chunk",
      file: runtimeFile ?? "(not found)",
      actualKb: toKb(runtimeBytes),
      budgetKb: runtimeBudgetKb,
    },
    {
      label: "Total JS",
      file: `${jsFiles.length} files`,
      actualKb: toKb(totalBytes),
      budgetKb: totalBudgetKb,
    },
  ];

  console.log("Bundle budget report:");
  for (const check of checks) {
    console.log(
      `- ${check.label}: ${check.actualKb.toFixed(2)} kB / ${check.budgetKb.toFixed(2)} kB (${check.file})`,
    );
  }

  const failing = checks.filter((check) => check.actualKb > check.budgetKb);
  if (failing.length > 0) {
    console.error("Bundle budget check failed:");
    for (const check of failing) {
      console.error(
        `- ${check.label} exceeded by ${(check.actualKb - check.budgetKb).toFixed(2)} kB`,
      );
    }
    process.exit(1);
  }

  console.log("Bundle budget check passed.");
};

await run();
