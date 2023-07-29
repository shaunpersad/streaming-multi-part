import PartParser from './PartParser';
import { ReadablePart } from './types';

export default function partTransformer(boundary: string) {
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  let delimiterIndex = 0;
  let partParser: PartParser | null = null;

  return new TransformStream<Uint8Array, ReadablePart>({
    start() {},
    async transform(chunk, controller) {
      for (const byte of chunk) {
        if (delimiter[delimiterIndex] === byte) { // search for the delimiter
          delimiterIndex++;
          if (delimiterIndex === delimiter.byteLength) { // we found the whole delimiter
            delimiterIndex = 0;
            await partParser?.close();
            partParser = new PartParser();
          }
        } else { // does not match the delimiter
          for (let index = 0; index < delimiterIndex; index++) { // if we had a partial match, delimiterIndex will be > 0
            await partParser?.parse(delimiter[index], controller);
          }
          await partParser?.parse(byte, controller);
          delimiterIndex = 0;
        }
      }
    },
    flush(controller) {
      // todo: error checking
    },
  });
}
