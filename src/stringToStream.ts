function stringToChunks(str: string, chunkSize: number) {
  const numChunks = Math.ceil(str.length / chunkSize);
  const chunks: string[] = [];
  for (let i = 0; i < numChunks; i++) {
    chunks.push(
      str.slice(
        i * chunkSize,
        i * chunkSize + chunkSize,
      ),
    );
  }
  return chunks;
}

/**
 * Converts a string to a stream of bytes.
 */
export default function stringToStream(str: string, chunkSize = str.length): ReadableStream<Uint8Array> {
  const { writable, readable } = new TextEncoderStream();
  const writer = writable.getWriter();
  const chunks = chunkSize === str.length ? [str] : stringToChunks(str, chunkSize);
  chunks.reduce(
    (p, chunk) => p.then(() => writer.ready).then(() => writer.write(chunk)),
    Promise.resolve(),
  ).then(() => writer.ready).then(() => writer.close());
  return readable;
}
