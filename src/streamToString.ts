export default async function streamToString(stream: ReadableStream<ArrayBufferView>): Promise<string> {
  const decoder = new TextDecoder();
  let lastChunk: ArrayBufferView | null = null;
  let str = '';

  for await (const chunk of stream) {
    if (lastChunk) {
      str += decoder.decode(lastChunk, { stream: true });
    }
    lastChunk = chunk;
  }
  if (lastChunk) {
    str += decoder.decode(lastChunk, { stream: false });
  }
  return str;
}
