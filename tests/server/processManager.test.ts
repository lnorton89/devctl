import { describe, expect, it } from 'vitest';
import { createRingBuffer } from '../../src/server/process/ringBuffer.js';

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
