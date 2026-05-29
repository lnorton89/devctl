const MAX_LINE_LENGTH = 4096;

export interface RingBuffer {
  push(line: string): void;
  toArray(): string[];
  readonly length: number;
  clear(): void;
}

export function createRingBuffer(maxSize: number): RingBuffer {
  if (!Number.isInteger(maxSize) || maxSize < 1) {
    throw new Error('Ring buffer max size must be a positive integer.');
  }

  const buffer: string[] = [];
  let head = 0;

  return {
    push(line: string): void {
      const boundedLine = line.slice(0, MAX_LINE_LENGTH);

      if (buffer.length < maxSize) {
        buffer.push(boundedLine);
        return;
      }

      buffer[head] = boundedLine;
      head = (head + 1) % maxSize;
    },

    toArray(): string[] {
      if (buffer.length < maxSize || head === 0) {
        return [...buffer];
      }

      return [...buffer.slice(head), ...buffer.slice(0, head)];
    },

    get length(): number {
      return buffer.length;
    },

    clear(): void {
      buffer.length = 0;
      head = 0;
    },
  };
}
