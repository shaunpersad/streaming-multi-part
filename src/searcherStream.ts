export type SearcherStreamChunk = {
  data: Uint8Array,
  found: boolean,
};

/**
 * Searches a stream of bytes for a given search value.
 *
 * Can search for a string or bytes.
 */
export default function searcherStream(searchValue: ArrayBufferView | string) {
  // eslint-disable-next-line no-nested-ternary
  const search = typeof searchValue === 'string'
    ? new TextEncoder().encode(searchValue)
    : searchValue instanceof Uint8Array
      ? searchValue
      : new Uint8Array(searchValue.buffer, searchValue.byteOffset, searchValue.byteLength);
  let searchIndex = 0;

  return new TransformStream<ArrayBufferView, SearcherStreamChunk>({
    async transform(view, controller) {
      const chunk = view instanceof Uint8Array ? view : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      let passthroughIndex: number | null = null;
      let byteIndex = 0;

      while (byteIndex < chunk.length) {
        const byte = chunk[byteIndex];
        if (search[searchIndex] === byte) {
          searchIndex++;
          if (passthroughIndex !== null) {
            controller.enqueue({ data: chunk.subarray(passthroughIndex, byteIndex), found: false });
            passthroughIndex = null;
          }
          if (searchIndex === search.length) {
            controller.enqueue({ data: search, found: true });
            searchIndex = 0;
          }
        } else {
          if (searchIndex) {
            controller.enqueue({ data: search.subarray(0, searchIndex), found: false });
            searchIndex = 0;
            continue;
          }
          if (passthroughIndex === null) {
            passthroughIndex = byteIndex;
          }
        }
        byteIndex++;
      }

      if (passthroughIndex !== null) {
        controller.enqueue({ data: passthroughIndex === 0 ? chunk : chunk.subarray(passthroughIndex), found: false });
      }
    },
  });
}
