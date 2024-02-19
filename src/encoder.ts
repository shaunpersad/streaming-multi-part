import { WritablePart, toReadablePart } from './lib/parts';
import randomString from './lib/randomString';

export type EncodedMultipart = {
  contentType: string,
  boundary: string,
  stream: TransformStream<WritablePart, Uint8Array>,
};

export default function encoder(boundary = randomString()): EncodedMultipart {
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  const stream = new TransformStream<WritablePart, Uint8Array>({
    async transform(readableOrWritablePart, controller) {
      const part = toReadablePart(readableOrWritablePart);
      controller.enqueue(delimiter);
      part.headers.forEach((value, key) => {
        controller.enqueue(new TextEncoder().encode(`\r\n${key}: ${value}`));
      });
      controller.enqueue(new TextEncoder().encode('\r\n\r\n'));
      for await (const chunk of part.body) {
        controller.enqueue(chunk);
      }
    },
    flush(controller) {
      controller.enqueue(delimiter);
      controller.enqueue(new TextEncoder().encode('--'));
    },
  });

  return {
    contentType: `multipart/form-data; boundary=${JSON.stringify(boundary)}`,
    boundary,
    stream,
  };
}
