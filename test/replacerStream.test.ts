import { describe, expect, it } from 'vitest';
import { replacerStream, streamToString, stringToStream } from '../src';

describe('replacerStream', () => {
  const types = {
    string: { find: 'foo', replace: 'bar' },
    binary: { find: new TextEncoder().encode('foo'), replace: new TextEncoder().encode('bar') },
  };
  Object.entries(types).forEach(([type, { find, replace }]) => {
    it(`replaces all occurrences of the given ${type}`, async () => {
      const stream = stringToStream('foofoofoo foo ').pipeThrough(replacerStream(find, replace));
      expect(await streamToString(stream)).toEqual('barbarbar bar ');
    });
  });
});
