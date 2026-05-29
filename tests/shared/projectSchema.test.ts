import { describe, it, expect } from 'vitest';
import {
  projectInputSchema,
  projectSchema,
  registrySchema,
  formatZodIssues,
} from '../../src/shared/projectSchema.js';

// ---------------------------------------------------------------------------
// REG-01 / D-01 / D-03 — Required fields
// ---------------------------------------------------------------------------
describe('projectInputSchema — required fields', () => {
  it('accepts a valid project with all required fields', () => {
    const result = projectInputSchema.safeParse({
      name: 'My App',
      hostPath: 'C:\\Users\\me\\project',
      containerPath: '/workspace/project',
      startCommand: 'npm run dev',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a project missing name', () => {
    const result = projectInputSchema.safeParse({
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameIssues = result.error.issues.filter(
        (i: any) => i.path[0] === 'name',
      );
      expect(nameIssues.length).toBeGreaterThan(0);
    }
  });

  it('rejects a project with empty name', () => {
    const result = projectInputSchema.safeParse({
      name: '',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a project missing hostPath', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a project missing containerPath', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a project missing startCommand', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// REG-01 / REG-03 — Optional fields
// ---------------------------------------------------------------------------
describe('projectInputSchema — optional fields', () => {
  it('accepts appUrl when present and valid', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      appUrl: 'http://localhost:5173',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.appUrl).toBe('http://localhost:5173');
    }
  });

  it('rejects invalid appUrl', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      appUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('accepts port when present and valid', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      port: 3000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.port).toBe(3000);
    }
  });

  it('rejects port below 1', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      port: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects port above 65535', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      port: 70000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer port', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      port: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts healthUrl when present and valid', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      healthUrl: 'http://localhost:3000/health',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.healthUrl).toBe('http://localhost:3000/health');
    }
  });

  it('rejects invalid healthUrl', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      healthUrl: 'not-valid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts envFilePath when present', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      envFilePath: '.env.local',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.envFilePath).toBe('.env.local');
    }
  });

  it('accepts a project with no optional fields', () => {
    const result = projectInputSchema.safeParse({
      name: 'Minimal',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'go run .',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.appUrl).toBeUndefined();
      expect(result.data.port).toBeUndefined();
      expect(result.data.healthUrl).toBeUndefined();
      expect(result.data.envFilePath).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// REG-03 — Defaults
// ---------------------------------------------------------------------------
describe('projectInputSchema — defaults', () => {
  it('defaults env to empty array', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.data.env)).toBe(true);
      expect(result.data.env).toHaveLength(0);
    }
  });

  it('defaults autostart to false', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.autostart).toBe(false);
    }
  });

  it('accepts explicit env array', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [
        { key: 'NODE_ENV', value: 'development' },
        { key: 'PORT', value: '3000' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.env).toHaveLength(2);
      expect(result.data.env[0].key).toBe('NODE_ENV');
      expect(result.data.env[0].value).toBe('development');
    }
  });

  it('accepts explicit autostart true', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      autostart: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.autostart).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// REG-03 — Env key validation
// ---------------------------------------------------------------------------
describe('env variable key validation', () => {
  it('accepts valid env keys with letters, numbers, underscores', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: 'NODE_ENV', value: 'dev' }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts env keys starting with underscore', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: '_SECRET', value: 'foo' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects env keys with spaces', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: 'MY KEY', value: 'foo' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects env keys starting with number', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: '1INVALID', value: 'foo' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects env keys with special characters', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: 'MY-VAR', value: 'foo' }],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// REG-02 — Stable IDs in project records
// ---------------------------------------------------------------------------
describe('projectSchema — stable IDs', () => {
  it('requires an id field', () => {
    const result = projectSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a project with a string id', () => {
    const result = projectSchema.safeParse({
      id: 'proj_abc123',
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('proj_abc123');
    }
  });
});

// ---------------------------------------------------------------------------
// REG-04 — Registry envelope
// ---------------------------------------------------------------------------
describe('registrySchema — registry envelope', () => {
  it('requires version 1', () => {
    const result = registrySchema.safeParse({
      version: 1,
      projects: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
    }
  });

  it('rejects other versions', () => {
    const result = registrySchema.safeParse({
      version: 2,
      projects: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a populated projects array', () => {
    const result = registrySchema.safeParse({
      version: 1,
      projects: [
        {
          id: 'p1',
          name: 'App',
          hostPath: '/host',
          containerPath: '/ctr',
          startCommand: 'npm start',
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Issue formatting helper
// ---------------------------------------------------------------------------
describe('formatZodIssues', () => {
  it('returns an array of { path, message } objects', () => {
    const result = projectInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodIssues(result.error);
      expect(Array.isArray(formatted)).toBe(true);
      formatted.forEach((issue) => {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
        expect(typeof issue.path).toBe('string');
        expect(typeof issue.message).toBe('string');
      });
    }
  });

  it('produces readable path strings for nested fields', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
      env: [{ key: 'INVALID-KEY', value: 'val' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodIssues(result.error);
      const envIssue = formatted.find((i) => i.path.includes('env'));
      expect(envIssue).toBeDefined();
    }
  });

  it('returns an empty array when there are no issues', () => {
    const result = projectInputSchema.safeParse({
      name: 'App',
      hostPath: '/host',
      containerPath: '/ctr',
      startCommand: 'npm start',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // We can't call formatZodIssues on a success, but verify the concept
      const empty = formatZodIssues({
        name: 'ZodError',
        issues: [],
        message: '',
      } as any);
      expect(empty).toHaveLength(0);
    }
  });
});
