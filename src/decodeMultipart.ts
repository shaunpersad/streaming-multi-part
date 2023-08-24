import PartParser, { OnNewPart, PartParserOptions, PartParserState } from './lib/PartParser';
import { ReadablePart } from './lib/parts';
import { addTransforms } from './lib/streams';
import searcherStream, { SearcherStreamChunk } from './searcherStream';

export type DecodedMultipart = {
  boundary: string,
  stream: TransformStream<ArrayBufferView, ReadablePart>,
};

export type DecodeMultipartOptions = PartParserOptions & {
  maxTotalSize?: number,
  maxNumParts?: number,
};

export default function decodeMultipart(boundary: string, options?: DecodeMultipartOptions): DecodedMultipart {
  const {
    maxPartHeaderSize,
    maxPartBodySize,
    maxTotalSize = 1_073_741_824,
    maxNumParts = Infinity,
  } = options ?? {};
  const searcher = searcherStream(`\r\n--${boundary}`);
  let partParser: PartParser | null = null;
  let currentWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let writerIsOpen = false;
  let totalSize = 0;
  let numParts = 0;

  const decoder = new TransformStream<SearcherStreamChunk, ReadablePart>({
    async transform({ found, data }, controller) {
      totalSize += data.length;
      if (totalSize > maxTotalSize) {
        throw new Error(`Total size is greater than the specified max size of ${maxTotalSize} bytes.`);
      }
      const onNewPart: OnNewPart = (part, subStream) => {
        if (++numParts > maxNumParts) {
          throw new Error(`Number of parts is greater than the specified max of ${maxNumParts}.`);
        }
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
        partParser = new PartParser(onNewPart, { maxPartHeaderSize, maxPartBodySize });
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
      if (!partParser) {
        throw new Error('No multipart data found.');
      }
      if (partParser.getState() !== PartParserState.MultipartEnd) {
        throw new Error('Malformed multipart data.');
      }
    },
  });

  return {
    boundary,
    stream: addTransforms(searcher, decoder, undefined, new CountQueuingStrategy({ highWaterMark: 2 })),
  };
}
