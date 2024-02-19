import { describe, expect, it } from 'vitest';
import { SearcherStreamChunk, searcherStream, streamToString, stringToStream } from '../src';

describe('searcherStream', () => {
  const types = {
    string: 'foo',
    binary: new TextEncoder().encode('foo'),
  };
  Object.entries(types).forEach(([type, find]) => {
    it(`finds all occurrences of the given ${type}`, async () => {
      const stream = stringToStream('foofoofoo foo ')
        .pipeThrough(searcherStream(find))
        .pipeThrough(
          new TransformStream<SearcherStreamChunk, Uint8Array>({
            transform({ found, data }, controller) {
              if (found) {
                controller.enqueue(new TextEncoder().encode('bar'));
              } else {
                controller.enqueue(data);
              }
            },
          }),
        );
      expect(await streamToString(stream)).toEqual('barbarbar bar ');
    });
  });
});
