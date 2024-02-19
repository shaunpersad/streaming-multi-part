import { describe, expect, it } from 'vitest';
import { streamToString, stringToStream } from '../src';

describe('stringToStream', () => {
  it('converts a string to a stream', async () => {
    const stream = stringToStream('foobar', 1);
    const str = await streamToString(stream);
    expect(str).toEqual('foobar');
  });
});
