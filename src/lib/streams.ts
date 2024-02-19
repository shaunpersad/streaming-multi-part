/**
 * Iterates over a ReadableStream's reader.
 */
export async function iterateReader<R>(reader: ReadableStreamDefaultReader<R>, forEachChunk: (chunk: R) => void | Promise<void>): Promise<void> {
  // eslint-disable-next-line consistent-return
  const pull: () => Promise<any> = () => reader.read().then(async ({ value, done }) => {
    if (!done && value !== undefined) {
      await forEachChunk(value);
      return pull();
    }
  });
  await pull();
}

/**
 * Combines two transform streams.
 *
 * This is convenient when you want to be able to pipe to both streams without forcing the caller to use both.
 */
export function addTransforms<S1Input, S1OutputS2Input, S2Output>(
  stream1: TransformStream<S1Input, S1OutputS2Input>,
  stream2: TransformStream<S1OutputS2Input, S2Output>,
  writableStrategy?: QueuingStrategy<S1Input>,
  readableStrategy?: QueuingStrategy<S2Output>,
) {
  const s1Writer = stream1.writable.getWriter();
  const s2Reader = stream1.readable.pipeThrough(stream2).getReader();

  return new TransformStream<S1Input, S2Output>({
    start(controller) {
      iterateReader(s2Reader, (chunk) => {
        controller.enqueue(chunk);
      }).catch((err) => {
        controller.error(err);
      });
    },
    async transform(chunk) {
      await s1Writer.ready;
      await s1Writer.write(chunk);
    },
    async flush() {
      await s1Writer.ready;
      await s1Writer.close();
      await s2Reader.closed;
    },
  }, writableStrategy, readableStrategy);
}
