import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PackageJsonDialog, {
  tokenizeJson,
} from '../../src/client/components/PackageJsonDialog.js';

vi.mock('../../src/client/api/projectsApi.js', () => ({
  getPackageJson: vi.fn(async () => ({
    content: '{"name":"devctl","enabled":true}',
    path: 'C:\\dev\\devctl\\package.json',
  })),
}));

describe('tokenizeJson', () => {
  it('assigns syntax token types while preserving the original JSON text', () => {
    const content = `{
  "name": "devctl",
  "port": 5273,
  "enabled": true,
  "optional": null
}`;

    const tokens = tokenizeJson(content);

    expect(tokens.map((token) => token.text).join('')).toBe(content);
    expect(tokens).toContainEqual({ text: '"name"', type: 'key' });
    expect(tokens).toContainEqual({ text: '"devctl"', type: 'string' });
    expect(tokens).toContainEqual({ text: '5273', type: 'number' });
    expect(tokens).toContainEqual({ text: 'true', type: 'boolean' });
    expect(tokens).toContainEqual({ text: 'null', type: 'null' });
    expect(tokens).toContainEqual({ text: ':', type: 'punctuation' });
  });

  it('keeps escaped quotes inside string values', () => {
    const content = '{"script":"node -e \\"console.log(true)\\""}';

    const tokens = tokenizeJson(content);

    expect(tokens.map((token) => token.text).join('')).toBe(content);
    expect(tokens).toContainEqual({
      text: '"node -e \\"console.log(true)\\""',
      type: 'string',
    });
  });

  it('renders syntax-colored spans in the package preview', async () => {
    render(
      <PackageJsonDialog
        open
        project={{
          id: 'project-1',
          name: 'devctl',
          hostPath: 'C:\\dev\\devctl',
          containerPath: 'C:\\dev\\devctl',
          startCommand: 'npm run dev',
          scriptName: 'dev',
          env: [],
          autostart: false,
        }}
        onClose={() => undefined}
      />,
    );

    const preview = await screen.findByRole('document', {
      name: 'package.json content',
    });

    expect(preview.querySelector('[data-token-type="key"]')).toHaveTextContent(
      '"name"',
    );
    expect(
      preview.querySelector('[data-token-type="boolean"]'),
    ).toHaveTextContent('true');
  });
});
