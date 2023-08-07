import { Header, headerToStr } from './lib/headers';
import { WritablePart, toReadablePart } from './lib/parts';
import randomString from './lib/randomString';

export type EncodedMultipart = {
  contentType: string,
  boundary: string,
  stream: TransformStream<WritablePart, Uint8Array>,
};

export default function encodeMultipart(customBoundary?: string): EncodedMultipart {
  const boundary = customBoundary ?? randomString();
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  const contentType: Header = { value: 'multipart/form-data', attrs: { boundary } };

  const stream = new TransformStream<WritablePart, Uint8Array>({
    async transform(readableOrWritablePart, controller) {
      const part = toReadablePart(readableOrWritablePart);
      controller.enqueue(delimiter);
      controller.enqueue(new TextEncoder().encode(`\r\nContent-Disposition: ${part.contentDisposition}`));
      if (part.contentType) {
        controller.enqueue(new TextEncoder().encode(`\r\nContent-Type: ${part.contentType}`));
      }
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
    contentType: headerToStr(contentType),
    boundary,
    stream,
  };
}
