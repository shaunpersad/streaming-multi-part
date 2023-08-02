import PartParser, { OnNewPart } from './lib/PartParser';
import { ReadablePart } from './lib/parts';

export type DecodedMultipart = {
  boundary: string,
  stream: TransformStream<ArrayBufferView, ReadablePart>,
};

export default function decodeMultipart(boundary: string): DecodedMultipart {
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  let delimiterIndex = 0;
  let partParser: PartParser | null = null;
  let currentWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let writerIsOpen = false;

  const stream = new TransformStream<ArrayBufferView, ReadablePart>({
    async transform(view, controller) {
      const chunk = view instanceof Uint8Array ? view : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
      let bodyStart: number | null = null;
      const onNewPart: OnNewPart = (part, subStream) => {
        writerIsOpen = true;
        currentWriter = subStream.getWriter();
        controller.enqueue(part);
      };
      const write = async (content: Uint8Array) => {
        if (!currentWriter) {
          throw new Error('Expected a writer for the current part body.');
        }
        await currentWriter.ready;
        await currentWriter.write(content);
        bodyStart = null;
      };
      let byteIndex = 0;
      while (byteIndex < chunk.length) {
        const byte = chunk[byteIndex];
        // console.log({
        //   delimiterChar: new TextDecoder().decode(new Uint8Array([delimiter[delimiterIndex]])),
        //   chunkChar: new TextDecoder().decode(new Uint8Array([byte])),
        // });

        if (delimiter[delimiterIndex] === byte) { // search for the delimiter
          delimiterIndex++;
          if (bodyStart !== null) { // we were parsing the body before we started matching the delimiter
            await write(chunk.subarray(bodyStart, byteIndex));
          }
          if (delimiterIndex === delimiter.length) { // we found the whole delimiter
            await currentWriter?.close();
            writerIsOpen = false;
            delimiterIndex = 0;
            partParser = new PartParser(onNewPart);
          }
        } else { // does not match the delimiter
          if (delimiterIndex) { // if we had a partial match, delimiterIndex will be > 0
            let bodyFromDelimiterStart: number | null = null;
            for (let index = 0; index < delimiterIndex; index++) {
              const isBody = partParser?.parse(delimiter[index]);
              if (isBody && bodyFromDelimiterStart === null) { // this is the start of the part body that happened to match the delimiter
                bodyFromDelimiterStart = index;
              } else if (!isBody && bodyFromDelimiterStart !== null) { // this is the end of the part body that happened to match the delimiter
                await write(delimiter.subarray(bodyFromDelimiterStart, index));
                bodyFromDelimiterStart = null;
              } else if (isBody && bodyFromDelimiterStart !== null && index === delimiterIndex - 1) { // we reached the end of the partial match and we're still processing the body
                await write(delimiter.subarray(bodyFromDelimiterStart, delimiterIndex));
              }
            }
            delimiterIndex = 0;
            continue;
          }
          const isBody = partParser?.parse(byte);
          if (isBody && bodyStart === null) {
            bodyStart = byteIndex;
          } else if (!isBody && bodyStart !== null) {
            await write(chunk.subarray(bodyStart, byteIndex));
          }
          delimiterIndex = 0;
        }
        byteIndex++;
      }
      if (bodyStart !== null) {
        await write(chunk.subarray(bodyStart));
      }
    },
    async flush() {
      if (writerIsOpen) {
        if (!currentWriter) {
          throw new Error('Expected a writer to close.');
        }
        await currentWriter.close();
      }
      // todo: error checking
    },
  });

  return { boundary, stream };
}
