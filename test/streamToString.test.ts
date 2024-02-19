import { describe, expect, it } from 'vitest';
import { streamToString, stringToStream } from '../src';

describe('streamToString', () => {
  it('converts a stream to a single string', async () => {
    const stream = stringToStream('foobar', 1);
    const str = await streamToString(stream);
    expect(str).toEqual('foobar');
  });
});
