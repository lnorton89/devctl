import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PackageJsonNotFoundError,
  PackageJsonParseError,
  parsePackageJson,
} from '../../src/server/process/packageJsonParser.js';

describe('parsePackageJson', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'devctl-package-json-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns scripts and package.json path for a valid package.json', async () => {
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        scripts: {
          dev: 'vite',
          test: 'vitest',
        },
      }),
      'utf8',
    );

    await expect(parsePackageJson(dir)).resolves.toEqual({
      scripts: {
        dev: 'vite',
        test: 'vitest',
      },
      path: join(dir, 'package.json'),
    });
  });

  it('throws PackageJsonNotFoundError when package.json is missing', async () => {
    await expect(parsePackageJson(dir)).rejects.toBeInstanceOf(
      PackageJsonNotFoundError,
    );
  });

  it('throws PackageJsonParseError when package.json is malformed', async () => {
    await writeFile(join(dir, 'package.json'), '{ bad json', 'utf8');

    await expect(parsePackageJson(dir)).rejects.toBeInstanceOf(
      PackageJsonParseError,
    );
  });

  it('returns an empty scripts object when package.json has no scripts', async () => {
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({ name: 'sample' }),
      'utf8',
    );

    await expect(parsePackageJson(dir)).resolves.toEqual({
      scripts: {},
      path: join(dir, 'package.json'),
    });
  });

  it('ignores non-string scripts', async () => {
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        scripts: {
          dev: 'vite',
          broken: 42,
          nested: { command: 'nope' },
          test: 'vitest',
        },
      }),
      'utf8',
    );

    await expect(parsePackageJson(dir)).resolves.toEqual({
      scripts: {
        dev: 'vite',
        test: 'vitest',
      },
      path: join(dir, 'package.json'),
    });
  });
});
