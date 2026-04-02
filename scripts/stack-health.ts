#!/usr/bin/env bun

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

export type Severity = 'error' | 'warn';

export interface PatternMatcher {
  message: string;
  literal?: string;
  regex?: string;
  flags?: string;
}

export interface PatternCheck {
  id: string;
  type: 'pattern';
  description: string;
  severity: Severity;
  include: string[];
  exclude?: string[];
  matchers: PatternMatcher[];
}

export interface CommandCheck {
  id: string;
  type: 'command';
  description: string;
  severity: Severity;
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
}

export type HealthCheck = PatternCheck | CommandCheck;

export interface HarnessConfig {
  version: 1;
  defaultIgnores?: string[];
  checks: HealthCheck[];
}

export interface Finding {
  checkId: string;
  severity: Severity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  snippet?: string;
  details?: string;
}

export interface CheckResult {
  check: HealthCheck;
  findings: Finding[];
}

export interface HarnessRunResult {
  results: CheckResult[];
  errorCount: number;
  warningCount: number;
}

const ROOT = path.resolve(import.meta.dir, '..');
const DEFAULT_CONFIG_PATH = path.join(ROOT, 'stack-health.config.json');
const BUILTIN_IGNORES = [
  '.git/**',
  'node_modules/**',
  'browse/dist/**',
  'design/dist/**',
  '.agents/**',
  '.factory/**',
  'coverage/**',
];

export function matchGlob(file: string, pattern: string): boolean {
  const normalizedFile = normalizeRel(file);
  const normalizedPattern = normalizeRel(pattern);
  const regexStr = normalizedPattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${regexStr}$`).test(normalizedFile);
}

function normalizeRel(value: string): string {
  return value.replaceAll(path.sep, '/');
}

export function listRepoFiles(root: string, ignorePatterns: string[]): string[] {
  const results: string[] = [];

  function walk(currentDir: string): void {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = normalizeRel(path.relative(root, fullPath));
      if (shouldIgnore(relPath, ignorePatterns)) {
        continue;
      }
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (entry.isFile()) {
        results.push(relPath);
      }
    }
  }

  walk(root);
  return results.sort();
}

function isProbablyBinary(buffer: Buffer): boolean {
  const sampleSize = Math.min(buffer.length, 4096);
  let suspiciousBytes = 0;

  for (let index = 0; index < sampleSize; index++) {
    const value = buffer[index];
    if (value === 0) {
      return true;
    }
    const isControl = value < 7 || (value > 14 && value < 32);
    if (isControl) {
      suspiciousBytes++;
    }
  }

  return sampleSize > 0 && suspiciousBytes / sampleSize > 0.1;
}

function shouldIgnore(relPath: string, patterns: string[]): boolean {
  return patterns.some(pattern => matchGlob(relPath, pattern));
}

function compactOutput(output: string): string {
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join('\n');
}

function findLiteralColumn(line: string, literal: string): number {
  return line.indexOf(literal) + 1;
}

function buildMatcherRegex(matcher: PatternMatcher): RegExp {
  if (matcher.regex) {
    return new RegExp(matcher.regex, matcher.flags ?? '');
  }
  return new RegExp(escapeRegex(matcher.literal ?? ''));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fileMatches(relPath: string, include: string[], exclude: string[] | undefined): boolean {
  const included = include.some(pattern => matchGlob(relPath, pattern));
  if (!included) {
    return false;
  }
  return !(exclude ?? []).some(pattern => matchGlob(relPath, pattern));
}

export function findPatternFindingsInContent(
  check: PatternCheck,
  content: string,
  file = 'inline',
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');

  for (const matcher of check.matchers) {
    const regex = buildMatcherRegex(matcher);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      regex.lastIndex = 0;
      const match = regex.exec(line);
      if (!match) {
        continue;
      }
      const column = matcher.literal
        ? findLiteralColumn(line, matcher.literal)
        : (match.index ?? 0) + 1;
      findings.push({
        checkId: check.id,
        severity: check.severity,
        message: matcher.message,
        file,
        line: index + 1,
        column,
        snippet: line.trim(),
      });
    }
  }

  return findings;
}

export function runPatternCheck(root: string, check: PatternCheck, defaultIgnores: string[]): CheckResult {
  const files = listRepoFiles(root, [...BUILTIN_IGNORES, ...defaultIgnores]);
  const findings: Finding[] = [];

  for (const file of files) {
    if (!fileMatches(file, check.include, check.exclude)) {
      continue;
    }
    const fileBuffer = fs.readFileSync(path.join(root, file));
    if (isProbablyBinary(fileBuffer)) {
      continue;
    }
    const content = fileBuffer.toString('utf-8');
    findings.push(...findPatternFindingsInContent(check, content, file));
  }

  return { check, findings };
}

export function runCommandCheck(root: string, check: CommandCheck): CheckResult {
  const cwd = check.cwd ? path.resolve(root, check.cwd) : root;
  const result = spawnSync(check.command, check.args ?? [], {
    cwd,
    encoding: 'utf-8',
    timeout: check.timeoutMs ?? 120000,
  });

  if (result.status === 0) {
    return { check, findings: [] };
  }

  const stdout = compactOutput(result.stdout ?? '');
  const stderr = compactOutput(result.stderr ?? '');
  const details = [stdout, stderr].filter(Boolean).join('\n');

  return {
    check,
    findings: [{
      checkId: check.id,
      severity: check.severity,
      message: `${check.command} ${(check.args ?? []).join(' ')} failed`,
      details,
    }],
  };
}

export function loadHarnessConfig(configPath = DEFAULT_CONFIG_PATH): HarnessConfig {
  const content = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(content) as HarnessConfig;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported stack-health config version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.checks) || parsed.checks.length === 0) {
    throw new Error('stack-health config must declare at least one check');
  }
  return parsed;
}

export function runHarness(root: string, config: HarnessConfig, onlyIds: Set<string> | null = null): HarnessRunResult {
  const results: CheckResult[] = [];
  let errorCount = 0;
  let warningCount = 0;

  for (const check of config.checks) {
    if (onlyIds && !onlyIds.has(check.id)) {
      continue;
    }

    const result = check.type === 'pattern'
      ? runPatternCheck(root, check, config.defaultIgnores ?? [])
      : runCommandCheck(root, check);

    for (const finding of result.findings) {
      if (finding.severity === 'error') {
        errorCount++;
      } else {
        warningCount++;
      }
    }

    results.push(result);
  }

  return { results, errorCount, warningCount };
}

function parseArgs(argv: string[]): { configPath: string; json: boolean; strictWarnings: boolean; onlyIds: Set<string> | null } {
  let configPath = DEFAULT_CONFIG_PATH;
  let json = false;
  let strictWarnings = false;
  let onlyIds: Set<string> | null = null;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--strict-warnings') {
      strictWarnings = true;
      continue;
    }
    if (arg === '--config') {
      configPath = path.resolve(ROOT, argv[index + 1]);
      index++;
      continue;
    }
    if (arg === '--only') {
      onlyIds = new Set(argv[index + 1].split(',').map(value => value.trim()).filter(Boolean));
      index++;
    }
  }

  return { configPath, json, strictWarnings, onlyIds };
}

function printHumanReport(run: HarnessRunResult): void {
  console.log('Stack Health Harness');
  console.log('');

  for (const result of run.results) {
    if (result.findings.length === 0) {
      console.log(`PASS  ${result.check.id} — ${result.check.description}`);
      continue;
    }

    const highestSeverity = result.findings.some(finding => finding.severity === 'error') ? 'ERROR' : 'WARN';
    console.log(`${highestSeverity} ${result.check.id} — ${result.check.description}`);
    for (const finding of result.findings.slice(0, 20)) {
      if (finding.file) {
        const location = `${finding.file}:${finding.line}:${finding.column}`;
        console.log(`  - ${location} ${finding.message}`);
        if (finding.snippet) {
          console.log(`    ${finding.snippet}`);
        }
      } else {
        console.log(`  - ${finding.message}`);
        if (finding.details) {
          for (const line of finding.details.split('\n')) {
            console.log(`    ${line}`);
          }
        }
      }
    }
    if (result.findings.length > 20) {
      console.log(`  ... ${result.findings.length - 20} more findings`);
    }
  }

  console.log('');
  console.log(`Summary: ${run.errorCount} errors, ${run.warningCount} warnings across ${run.results.length} checks`);
}

if (import.meta.main) {
  const args = parseArgs(process.argv.slice(2));
  const config = loadHarnessConfig(args.configPath);
  const run = runHarness(ROOT, config, args.onlyIds);

  if (args.json) {
    console.log(JSON.stringify(run, null, 2));
  } else {
    printHumanReport(run);
  }

  const shouldFail = run.errorCount > 0 || (args.strictWarnings && run.warningCount > 0);
  process.exit(shouldFail ? 1 : 0);
}
