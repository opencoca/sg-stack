import { describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  findPatternFindingsInContent,
  listRepoFiles,
  loadHarnessConfig,
  matchGlob,
  runCommandCheck,
  runHarness,
  runPatternCheck,
  type CommandCheck,
  type HarnessConfig,
  type PatternCheck,
} from '../scripts/stack-health';

interface PolicyFixtureCase {
  name: string;
  checkId: string;
  shouldMatch: boolean;
  text: string;
  expectedMessages?: string[];
}

interface PolicyFixtureFile {
  cases: PolicyFixtureCase[];
}

function withTempDir(run: (dir: string) => void): void {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stack-health-'));
  try {
    run(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

describe('stack-health harness', () => {
  test('matchGlob handles root and nested globs', () => {
    expect(matchGlob('README.md', '*.md')).toBe(true);
    expect(matchGlob('office-hours/SKILL.md.tmpl', '*/SKILL.md.tmpl')).toBe(true);
    expect(matchGlob('scripts/resolvers/preamble.ts', 'scripts/**')).toBe(true);
    expect(matchGlob('scripts/resolvers/preamble.ts', 'bin/**')).toBe(false);
  });

  test('pattern checks report findings with file and line context', () => {
    withTempDir(tempDir => {
      fs.mkdirSync(path.join(tempDir, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'README.md'), 'safe\nCome work at YC\n');
      fs.writeFileSync(path.join(tempDir, 'docs', 'note.md'), 'Come work at YC\n');

      const check: PatternCheck = {
        id: 'funnel-copy',
        type: 'pattern',
        description: 'Detect funnel copy',
        severity: 'warn',
        include: ['*.md', 'docs/**'],
        exclude: ['docs/**'],
        matchers: [{ literal: 'Come work at YC', message: 'Recruiting funnel copy is present.' }],
      };

      const result = runPatternCheck(tempDir, check, []);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].file).toBe('README.md');
      expect(result.findings[0].line).toBe(2);
      expect(result.findings[0].column).toBe(1);
    });
  });

  test('content matcher can validate manipulative-copy fixtures directly', () => {
    const config = loadHarnessConfig(path.join(import.meta.dir, '..', 'stack-health.config.json'));
    const fixture = JSON.parse(
      fs.readFileSync(path.join(import.meta.dir, 'fixtures', 'stack-health-policy-fixtures.json'), 'utf-8'),
    ) as PolicyFixtureFile;

    for (const testCase of fixture.cases) {
      const check = config.checks.find(candidate => candidate.type === 'pattern' && candidate.id === testCase.checkId);
      expect(check).toBeDefined();
      const findings = findPatternFindingsInContent(check as PatternCheck, testCase.text, `${testCase.name}.md`);

      if (testCase.shouldMatch) {
        expect(findings.length).toBeGreaterThan(0);
        for (const expectedMessage of testCase.expectedMessages ?? []) {
          expect(findings.some(finding => finding.message === expectedMessage)).toBe(true);
        }
      } else {
        expect(findings).toHaveLength(0);
      }
    }
  });

  test('every manipulation policy family has positive and negative fixtures', () => {
    const fixture = JSON.parse(
      fs.readFileSync(path.join(import.meta.dir, 'fixtures', 'stack-health-policy-fixtures.json'), 'utf-8'),
    ) as PolicyFixtureFile;
    const manipulationCheckIds = [
      'manipulative-founder-funnel-copy',
      'mania-adjacent-productivity-copy',
      'coercive-urgency-and-shame-copy',
      'surveillance-and-hidden-consent-copy',
      'dependency-and-compliance-copy',
    ];

    for (const checkId of manipulationCheckIds) {
      expect(fixture.cases.some(testCase => testCase.checkId === checkId && testCase.shouldMatch)).toBe(true);
      expect(fixture.cases.some(testCase => testCase.checkId === checkId && !testCase.shouldMatch)).toBe(true);
    }
  });

  test('command checks surface failures with compacted output', () => {
    const check: CommandCheck = {
      id: 'failing-command',
      type: 'command',
      description: 'Intentional failure',
      severity: 'error',
      command: 'bun',
      args: ['-e', 'console.log("before failure"); console.error("boom"); process.exit(1);'],
    };

    const result = runCommandCheck(process.cwd(), check);
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0].details).toContain('before failure');
      expect(result.findings[0].details).toContain('boom');
  });

  test('listRepoFiles applies built-in ignore patterns provided by the harness', () => {
    withTempDir(tempDir => {
      fs.mkdirSync(path.join(tempDir, '.git'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, '.git', 'HEAD'), 'ref: refs/heads/main\n');
      fs.writeFileSync(path.join(tempDir, 'src', 'index.ts'), 'export const ok = true;\n');

      const files = listRepoFiles(tempDir, ['.git/**']);
      expect(files).toEqual(['src/index.ts']);
    });
  });

  test('runHarness combines command and pattern results', () => {
    withTempDir(tempDir => {
      fs.writeFileSync(path.join(tempDir, 'README.md'), 'golden age\n');

      const config: HarnessConfig = {
        version: 1,
        checks: [
          {
            id: 'safe-command',
            type: 'command',
            description: 'Passes cleanly',
            severity: 'error',
            command: 'bun',
            args: ['-e', 'process.exit(0)'],
          },
          {
            id: 'copy-check',
            type: 'pattern',
            description: 'Finds pressure framing',
            severity: 'warn',
            include: ['*.md'],
            matchers: [{ literal: 'golden age', message: 'Inevitability framing is present.' }],
          },
        ],
      };

      const run = runHarness(tempDir, config);
      expect(run.errorCount).toBe(0);
      expect(run.warningCount).toBe(1);
      expect(run.results).toHaveLength(2);
    });
  });

  test('repo config loads successfully', () => {
    const config = loadHarnessConfig(path.join(import.meta.dir, '..', 'stack-health.config.json'));
    expect(config.version).toBe(1);
    expect(config.checks.length).toBeGreaterThan(0);
  });
});
