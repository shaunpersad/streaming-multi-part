export default function stringToStream(str: string): ReadableStream<Uint8Array> {
  const { writable, readable } = new TextEncoderStream();
  const writer = writable.getWriter();
  writer.ready.then(() => writer.write(str)).then(() => writer.close());
  return readable;
}
