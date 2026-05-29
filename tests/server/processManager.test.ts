import { EventEmitter } from 'node:events';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createRingBuffer } from '../../src/server/process/ringBuffer.js';
import { createProcessManager } from '../../src/server/process/processManager.js';

const childProcessMocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  execFile: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  ...childProcessMocks,
  default: childProcessMocks,
}));

interface MockChildProcess extends EventEmitter {
  pid: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  killed: boolean;
}

function createMockChild(pid = 1234): MockChildProcess {
  const child = new EventEmitter() as MockChildProcess;
  child.pid = pid;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.killed = false;
  return child;
}

function flushTimers(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

const originalPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', {
    value: platform,
    configurable: true,
  });
}

beforeEach(() => {
  vi.useRealTimers();
  childProcessMocks.spawn.mockReset();
  childProcessMocks.execFile.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setPlatform(originalPlatform);
});

describe('createRingBuffer', () => {
  it('keeps FIFO ordering after wraparound', () => {
    const buffer = createRingBuffer(3);

    buffer.push('one');
    buffer.push('two');
    buffer.push('three');
    buffer.push('four');

    expect(buffer.toArray()).toEqual(['two', 'three', 'four']);
  });

  it('never exceeds the configured max size', () => {
    const buffer = createRingBuffer(2);

    buffer.push('one');
    buffer.push('two');
    buffer.push('three');

    expect(buffer.length).toBe(2);
    expect(buffer.toArray()).toHaveLength(2);
  });

  it('truncates individual log lines longer than 4096 characters', () => {
    const buffer = createRingBuffer(2);

    buffer.push('x'.repeat(5000));

    expect(buffer.toArray()[0]).toHaveLength(4096);
  });

  it('clear resets length and contents', () => {
    const buffer = createRingBuffer(2);

    buffer.push('one');
    buffer.push('two');
    buffer.clear();

    expect(buffer.length).toBe(0);
    expect(buffer.toArray()).toEqual([]);
  });
});

describe('createProcessManager lifecycle state machine', () => {
  it('starts by spawning npm run scriptName with process-group stdio options', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    const status = manager.start('project-1', 'dev', '/workspace/app');

    expect(childProcessMocks.spawn).toHaveBeenCalledWith('npm run dev', [], {
      shell: true,
      cwd: '/workspace/app',
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      windowsHide: true,
      env: process.env,
    });
    expect(status.state).toBe('starting');
    expect(status.currentRun?.scriptName).toBe('dev');
  });

  it('transitions from starting to running after the first stdout line', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));

    const status = manager.getStatus('project-1');
    expect(status.state).toBe('running');
    expect(status.recentLogTail).toEqual(['ready']);
  });

  it('stop on running transitions to stopping and returns immediately', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));

    const status = manager.stop('project-1');

    expect(status.state).toBe('stopping');
  });

  it('records endTime and transitions to stopped on exit code 0', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    child.emit('exit', 0, null);

    const status = manager.getStatus('project-1');
    const logs = manager.getLogs('project-1');
    expect(status.state).toBe('stopped');
    expect(logs.history[0].endTime).toBeDefined();
    expect(logs.history[0].exitCode).toBe(0);
    expect(logs.history[0].crashed).toBe(false);
  });

  it('records non-zero exit as failed and crashed', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stderr.emit('data', Buffer.from('boom\n'));
    child.emit('exit', 1, null);

    const status = manager.getStatus('project-1');
    const logs = manager.getLogs('project-1');
    expect(status.state).toBe('failed');
    expect(logs.history[0].exitCode).toBe(1);
    expect(logs.history[0].crashed).toBe(true);
    expect(logs.history[0].stderr).toEqual(['boom']);
  });

  it('records spawn errors as errored state', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/missing/app');
    child.emit('error', new Error('spawn failed'));

    const status = manager.getStatus('project-1');
    expect(status.state).toBe('errored');
    expect(status.error).toBe('spawn failed');
    expect(status.currentRun?.error).toBe('spawn failed');
  });

  it('restart calls stop, waits a short delay, then starts again', async () => {
    vi.useFakeTimers();
    const firstChild = createMockChild(1111);
    const secondChild = createMockChild(2222);
    childProcessMocks.spawn
      .mockReturnValueOnce(firstChild)
      .mockReturnValueOnce(secondChild);
    const manager = createProcessManager({ restartDelayMs: 25 });

    manager.start('project-1', 'dev', '/workspace/app');
    firstChild.stdout.emit('data', Buffer.from('ready\n'));
    const restartPromise = manager.restart('project-1', 'dev', '/workspace/app');

    expect(manager.getStatus('project-1').state).toBe('stopping');
    firstChild.emit('exit', 0, null);
    await vi.advanceTimersByTimeAsync(25);
    const status = await restartPromise;

    expect(status.state).toBe('starting');
    expect(childProcessMocks.spawn).toHaveBeenCalledTimes(2);
    expect(childProcessMocks.spawn.mock.calls[1][2].cwd).toBe('/workspace/app');
  });

  it('duplicate start while starting or running does not spawn another child', () => {
    const child = createMockChild();
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    const starting = manager.start('project-1', 'dev', '/workspace/app');
    const stillStarting = manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    const running = manager.start('project-1', 'dev', '/workspace/app');

    expect(starting.state).toBe('starting');
    expect(stillStarting.state).toBe('starting');
    expect(running.state).toBe('running');
    expect(childProcessMocks.spawn).toHaveBeenCalledTimes(1);
  });

  it('getStatus for unknown project returns stopped with empty tail', () => {
    const manager = createProcessManager();

    expect(manager.getStatus('missing')).toEqual({
      state: 'stopped',
      uptime: null,
      currentRun: null,
      recentLogTail: [],
    });
  });

  it('getLogs returns currentRun plus the last five history entries', async () => {
    const manager = createProcessManager();

    for (let index = 0; index < 6; index += 1) {
      const child = createMockChild(2000 + index);
      childProcessMocks.spawn.mockReturnValueOnce(child);
      manager.start('project-1', `dev${index}`, '/workspace/app');
      child.stdout.emit('data', Buffer.from(`run ${index}\n`));
      child.emit('exit', 0, null);
      await flushTimers();
    }

    const currentChild = createMockChild(3000);
    childProcessMocks.spawn.mockReturnValueOnce(currentChild);
    manager.start('project-1', 'dev-current', '/workspace/app');

    const logs = manager.getLogs('project-1');
    expect(logs.currentRun?.scriptName).toBe('dev-current');
    expect(logs.history).toHaveLength(5);
    expect(logs.history.map((run) => run.scriptName)).toEqual([
      'dev1',
      'dev2',
      'dev3',
      'dev4',
      'dev5',
    ]);
  });
});

describe('createProcessManager graceful stop behavior', () => {
  it('sends SIGTERM to the negative process group id on Unix first', () => {
    setPlatform('linux');
    vi.useFakeTimers();
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const child = createMockChild(4321);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);

    expect(kill).toHaveBeenCalledWith(-4321, 'SIGTERM');
  });

  it('sends SIGKILL on Unix after timeout only if state is still stopping', async () => {
    setPlatform('linux');
    vi.useFakeTimers();
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const child = createMockChild(4322);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);
    await vi.advanceTimersByTimeAsync(100);

    expect(kill).toHaveBeenCalledWith(-4322, 'SIGKILL');
  });

  it('skips Unix SIGKILL escalation when the process exits before timeout', async () => {
    setPlatform('linux');
    vi.useFakeTimers();
    const kill = vi.spyOn(process, 'kill').mockImplementation(() => true);
    const child = createMockChild(4323);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);
    child.emit('exit', 0, null);
    await vi.advanceTimersByTimeAsync(100);

    expect(kill).not.toHaveBeenCalledWith(-4323, 'SIGKILL');
  });

  it('attempts Windows taskkill without force first', () => {
    setPlatform('win32');
    vi.useFakeTimers();
    const child = createMockChild(8765);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);

    expect(childProcessMocks.execFile).toHaveBeenCalledWith(
      'taskkill',
      ['/pid', '8765', '/T'],
      expect.any(Function),
    );
  });

  it('escalates Windows taskkill with force after timeout if still stopping', async () => {
    setPlatform('win32');
    vi.useFakeTimers();
    const child = createMockChild(8766);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);
    await vi.advanceTimersByTimeAsync(100);

    expect(childProcessMocks.execFile).toHaveBeenCalledWith(
      'taskkill',
      ['/pid', '8766', '/T', '/F'],
      expect.any(Function),
    );
  });

  it('skips Windows force escalation when the process exits before timeout', async () => {
    setPlatform('win32');
    vi.useFakeTimers();
    const child = createMockChild(8767);
    childProcessMocks.spawn.mockReturnValue(child);
    const manager = createProcessManager();

    manager.start('project-1', 'dev', '/workspace/app');
    child.stdout.emit('data', Buffer.from('ready\n'));
    manager.stop('project-1', 100);
    child.emit('exit', 0, null);
    await vi.advanceTimersByTimeAsync(100);

    expect(childProcessMocks.execFile).not.toHaveBeenCalledWith(
      'taskkill',
      ['/pid', '8767', '/T', '/F'],
      expect.any(Function),
    );
  });
});
