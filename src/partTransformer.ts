import PartParser, { OnNewPart } from './PartParser';
import { ReadablePart } from './parts';

export default function partTransformer(boundary: string) {
  console.log('made part transformer');
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  let delimiterIndex = 0;
  let partParser: PartParser | null = null;
  let currentWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let writerIsOpen = false;

  return new TransformStream<Uint8Array, ReadablePart>({
    start() {
      console.log('started transform stream');
    },
    async transform(chunk, controller) {
      const onNewPart: OnNewPart = (part, stream) => {
        writerIsOpen = true;
        currentWriter = stream.getWriter();
        controller.enqueue(part);
      };
      let bodyStart: number | null = null;

      for (let byteIndex = 0; byteIndex < chunk.length; byteIndex++) {
        const byte = chunk[byteIndex];
        if (delimiter[delimiterIndex] === byte) { // search for the delimiter
          delimiterIndex++;
          if (bodyStart !== null) {
            console.log('writing body and closing because we might match the delimiter');
            if (!currentWriter) {
              throw new Error(`Expected a writer for the current part body. Supposed to write: ${new TextDecoder().decode(chunk.subarray(bodyStart, byteIndex))}`);
            }
            await currentWriter.ready;
            await currentWriter.write(chunk.subarray(bodyStart, byteIndex));
            bodyStart = null;
          }
          if (delimiterIndex === delimiter.length) { // we found the whole delimiter
            console.log('delimiter found');
            await currentWriter?.close();
            writerIsOpen = false;
            delimiterIndex = 0;
            partParser = new PartParser(onNewPart);
          }
        } else { // does not match the delimiter
          let bodyFromDelimiterStart: number | null = null;
          for (let index = 0; index < delimiterIndex; index++) { // if we had a partial match, delimiterIndex will be > 0
            const isBody = partParser?.parse(delimiter[index]);
            if (isBody && bodyFromDelimiterStart === null) { // this is part of the part body that happened to match the delimiter
              bodyFromDelimiterStart = index;
            } else if (!isBody && bodyFromDelimiterStart !== null) { // this is the end of the part body that happened to match the delimiter
              console.log('writing partial delimiter and closing');
              if (!currentWriter) {
                throw new Error('Expected a writer for the current part body.');
              }
              await currentWriter.ready;
              await currentWriter.write(delimiter.subarray(bodyFromDelimiterStart, index));
              bodyFromDelimiterStart = null;
            } else if (isBody && index === delimiterIndex - 1) { // we reached the end of the partial match and we're still processing the body
              console.log('writing partial delimiter and keeping open');
              if (!currentWriter) {
                throw new Error('Expected a writer for the current part body.');
              }
              await currentWriter.ready;
              await currentWriter.write(delimiter.subarray(0, delimiterIndex));
            }
          }
          const isBody = partParser?.parse(byte);
          if (isBody && bodyStart === null) {
            bodyStart = byteIndex;
          } else if (!isBody && bodyStart !== null) {
            console.log('writing body and closing');
            if (!currentWriter) {
              throw new Error(`Expected a writer for the current part body. Supposed to write: ${new TextDecoder().decode(chunk.subarray(bodyStart, byteIndex))}`);
            }
            await currentWriter.ready;
            await currentWriter.write(chunk.subarray(bodyStart, byteIndex));
            bodyStart = null;
          }
          delimiterIndex = 0;
        }
      }
      if (bodyStart !== null) {
        console.log('writing body');
        if (!currentWriter) {
          throw new Error('Expected a writer for the current part body.');
        }
        await currentWriter.ready;
        await currentWriter.write(chunk.subarray(bodyStart));
      }
    },
    async flush(controller) {
      console.log('flush');
      if (writerIsOpen) {
        if (!currentWriter) {
          throw new Error('Expected a writer to close.');
        }
        await currentWriter.close();
      }
      // todo: error checking
    },
  });
}
