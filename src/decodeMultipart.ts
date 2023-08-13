import PartParser, { OnNewPart } from './lib/PartParser';
import { ReadablePart } from './lib/parts';
import { addTransforms } from './lib/streams';
import searcherStream, { SearcherStreamChunk } from './searcherStream';

export type DecodedMultipart = {
  boundary: string,
  stream: TransformStream<ArrayBufferView, ReadablePart>,
};

export default function decodeMultipart(boundary: string): DecodedMultipart {
  const searcher = searcherStream(`\r\n--${boundary}`);
  let partParser: PartParser | null = null;
  let currentWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let writerIsOpen = false;

  const decoder = new TransformStream<SearcherStreamChunk, ReadablePart>({
    async transform({ found, data }, controller) {
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
      };

      if (found) {
        if (currentWriter) {
          await currentWriter.ready;
          await currentWriter.close();
        }
        writerIsOpen = false;
        partParser = new PartParser(onNewPart);
      } else {
        let bodyStart: number | null = null;
        for (let byteIndex = 0; byteIndex < data.length; byteIndex++) {
          const byte = data[byteIndex];
          const isBody = partParser?.parse(byte);
          if (isBody && bodyStart === null) {
            bodyStart = byteIndex;
          } else if (!isBody && bodyStart !== null) {
            await write(data.subarray(bodyStart, byteIndex));
            bodyStart = null;
          }
        }
        if (bodyStart !== null) {
          await write(data.subarray(bodyStart));
        }
      }
    },
    async flush() {
      if (writerIsOpen) {
        if (!currentWriter) {
          throw new Error('Expected a writer to close.');
        }
        await currentWriter.ready;
        await currentWriter.close();
      }

      // todo: error checking
    },
  });

  return {
    boundary,
    stream: addTransforms(searcher, decoder, undefined, new CountQueuingStrategy({ highWaterMark: 2 })),
  };
}
