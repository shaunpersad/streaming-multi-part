export default async function streamToString(stream: ReadableStream<ArrayBufferView>): Promise<string> {
  let str = '';
  for await (const chunk of stream) {
    str += new TextDecoder().decode(chunk);
  }
  return str;
}
