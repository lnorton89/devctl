import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  PackageScripts,
  ParseScriptsResponse,
} from '../../shared/lifecycleSchema.js';

export class PackageJsonNotFoundError extends Error {
  constructor(packageJsonPath: string) {
    super(`No package.json found at ${packageJsonPath}`);
    this.name = 'PackageJsonNotFoundError';
  }
}

export class PackageJsonParseError extends Error {
  constructor(packageJsonPath: string, detail: string) {
    super(`Failed to parse package.json at ${packageJsonPath}: ${detail}`);
    this.name = 'PackageJsonParseError';
  }
}

interface PackageJsonShape {
  scripts?: unknown;
}

export async function parsePackageJson(
  dirPath: string,
): Promise<ParseScriptsResponse> {
  const packageJsonPath = resolve(dirPath, 'package.json');
  let raw: string;

  try {
    raw = await readFile(packageJsonPath, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new PackageJsonNotFoundError(packageJsonPath);
    }
    throw error;
  }

  let parsed: PackageJsonShape;
  try {
    parsed = JSON.parse(raw) as PackageJsonShape;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown parse error';
    throw new PackageJsonParseError(packageJsonPath, detail);
  }

  return {
    scripts: filterStringScripts(parsed.scripts),
    path: packageJsonPath,
  };
}

function filterStringScripts(value: unknown): PackageScripts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<PackageScripts>((scripts, [name, command]) => {
    if (typeof command === 'string') {
      scripts[name] = command;
    }
    return scripts;
  }, {});
}

export async function readRawPackageJson(
  dirPath: string,
): Promise<{ content: string; path: string }> {
  const packageJsonPath = resolve(dirPath, 'package.json');
  let raw: string;

  try {
    raw = await readFile(packageJsonPath, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new PackageJsonNotFoundError(packageJsonPath);
    }
    throw error;
  }

  return { content: raw, path: packageJsonPath };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
