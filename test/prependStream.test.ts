import { describe, expect, it } from 'vitest';
import { streamToString, stringToStream } from '../src';
import prependStream from '../src/prependStream';

describe('prependStream', () => {
  const types = {
    strings: 'foo',
    binary: new TextEncoder().encode('foo'),
  };
  Object.entries(types).forEach(([type, input]) => {
    it(`adds ${type} to the front of the stream`, async () => {
      const stream = stringToStream('bar').pipeThrough(prependStream(input));
      expect(await streamToString(stream)).toEqual('foobar');
    });
  });
});
