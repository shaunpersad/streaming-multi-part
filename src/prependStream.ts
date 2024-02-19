export default function prependStream(toAppend: ArrayBufferView | string) {
  // eslint-disable-next-line no-nested-ternary
  const search = typeof toAppend === 'string'
    ? new TextEncoder().encode(toAppend)
    : toAppend instanceof Uint8Array
      ? toAppend
      : new Uint8Array(toAppend.buffer, toAppend.byteOffset, toAppend.byteLength);

  return new TransformStream<ArrayBufferView, ArrayBufferView>({
    start(controller) {
      controller.enqueue(search);
    },
    transform(view, controller) {
      controller.enqueue(view);
    },
  });
}
