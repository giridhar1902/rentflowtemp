#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const srcRoot = path.join(projectRoot, "src");

const includeDirectories = [
  path.join(srcRoot, "pages"),
  path.join(srcRoot, "components"),
  path.join(srcRoot, "App.tsx"),
];

const allowedColorFiles = new Set([
  path.join(srcRoot, "theme", "theme.ts"),
  path.join(srcRoot, "index.css"),
]);

const colorUtilityPattern =
  /\b(?:bg|text|border|ring|stroke|fill|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d+)?\b/g;
const darkVariantPattern = /\bdark:[^\s"'`]+/g;
const inlineColorPattern = /#(?:[0-9a-fA-F]{3,8})\b|\brgba?\(/g;

const targetExtension = /\.(ts|tsx|js|jsx)$/;

const listFiles = async (entry) => {
  const stats = await fs.stat(entry);
  if (stats.isFile()) {
    return [entry];
  }

  const files = [];
  const queue = [entry];

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    const dirEntries = await fs.readdir(current, { withFileTypes: true });
    for (const dirent of dirEntries) {
      const absPath = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        queue.push(absPath);
      } else if (targetExtension.test(dirent.name)) {
        files.push(absPath);
      }
    }
  }

  return files;
};

const indexToLineColumn = (source, index) => {
  const before = source.slice(0, index);
  const lines = before.split("\n");
  const line = lines.length;
  const column = lines[lines.length - 1].length + 1;
  return { line, column };
};

const createViolations = (source, absPath, pattern, rule) => {
  const matches = [];
  const regex = new RegExp(pattern.source, pattern.flags);
  for (const match of source.matchAll(regex)) {
    const index = match.index ?? 0;
    const { line, column } = indexToLineColumn(source, index);
    matches.push({
      absPath,
      line,
      column,
      excerpt: match[0],
      rule,
    });
  }
  return matches;
};

const run = async () => {
  const sources = await Promise.all(includeDirectories.map((entry) => listFiles(entry)));
  const files = [...new Set(sources.flat())].filter((absPath) => !allowedColorFiles.has(absPath));

  const violations = [];

  for (const absPath of files) {
    const source = await fs.readFile(absPath, "utf8");

    violations.push(
      ...createViolations(
        source,
        absPath,
        colorUtilityPattern,
        "Hardcoded utility color detected. Use semantic tokens/classes instead.",
      ),
    );

    violations.push(
      ...createViolations(
        source,
        absPath,
        darkVariantPattern,
        "`dark:` variant detected. Use theme tokens instead of mode-specific utility overrides.",
      ),
    );

    violations.push(
      ...createViolations(
        source,
        absPath,
        inlineColorPattern,
        "Inline color literal detected (`#...` / `rgb...`). Move to theme tokens.",
      ),
    );
  }

  if (violations.length === 0) {
    console.log("UI guardrails check passed.");
    return;
  }

  console.error(`UI guardrails failed with ${violations.length} violation(s):`);
  for (const violation of violations) {
    const rel = path.relative(projectRoot, violation.absPath);
    console.error(
      `- ${rel}:${violation.line}:${violation.column} | ${violation.excerpt} | ${violation.rule}`,
    );
  }

  process.exit(1);
};

await run();
