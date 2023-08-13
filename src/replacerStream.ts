import { addTransforms } from './lib/streams';
import searcherStream, { SearcherStreamChunk } from './searcherStream';

export default function replacerStream(searchValue: ArrayBufferView | string, replaceValue: ArrayBufferView | string) {
  // eslint-disable-next-line no-nested-ternary
  const replace = typeof replaceValue === 'string'
    ? new TextEncoder().encode(replaceValue)
    : replaceValue instanceof Uint8Array
      ? replaceValue
      : new Uint8Array(replaceValue.buffer, replaceValue.byteOffset, replaceValue.byteLength);
  const searcher = searcherStream(searchValue);
  const replacer = new TransformStream<SearcherStreamChunk, Uint8Array>({
    transform(chunk, controller) {
      return chunk.found ? controller.enqueue(replace) : controller.enqueue(chunk.data);
    },
  });
  return addTransforms(searcher, replacer);
}
