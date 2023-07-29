import { Header, headerToStr, strToHeader } from './headers';
import { ReadablePart, WritablePart } from './types';

export type WriteMultipartOptions = {
  boundary?: string,
  transform?: (part: ReadablePart) => WritablePart | null | undefined | Promise<WritablePart | null | undefined>,
  flush?: (written: string[]) => WritablePart[] | null | undefined | Promise<WritablePart[] | null | undefined>,
};

export type WritableMultipart = {
  contentType: string,
  boundary: string,
  input: WritableStream<WritablePart>,
  output: ReadableStream<Uint8Array>,
};

function randomString(numberOfBytes = 32): string {
  const array = new Uint8Array(numberOfBytes);
  crypto.getRandomValues(array);
  return new TextDecoder().decode(array);
}

function contentDispositionForPart({ contentDisposition, name, attrs }: WritablePart): Header {
  const header = contentDisposition ? strToHeader(contentDisposition) : {
    value: 'form-data',
    attrs: {},
  };
  if (!header.value) {
    header.value = 'form-data';
  }
  header.attrs = { ...attrs, name };
  return header;
}

function toReadablePart(part: WritablePart): ReadablePart {
  const contentDisposition = contentDispositionForPart(part);
  let { body } = part;
  if (typeof body === 'string') {
    const { readable, writable } = new TextEncoderStream();
    const str = body;
    body = readable;
    const writer = writable.getWriter();
    writer.ready.then(() => writer.write(str)).then(() => writer.close());
  }
  return {
    ...part,
    body,
    attrs: contentDisposition.attrs,
    contentDisposition: headerToStr(contentDisposition),
  };
}

async function enqueuePart(
  part: WritablePart,
  delimiter: Uint8Array,
  controller: TransformStreamDefaultController<Uint8Array>,
) {
  const contentDisposition = contentDispositionForPart(part);
  controller.enqueue(delimiter);
  controller.enqueue(new TextEncoder().encode(`\r\nContent-Disposition: ${contentDisposition}`));
  if (part.contentType) {
    controller.enqueue(new TextEncoder().encode(`\r\nContent-Type: ${part.contentType}`));
  }
  controller.enqueue(new TextEncoder().encode('\r\n'));
  if (typeof part.body === 'string') {
    controller.enqueue(new TextEncoder().encode(part.body));
  } else {
    for await (const chunk of part.body) {
      controller.enqueue(chunk);
    }
  }
}

export default function writeMultipart(options?: WriteMultipartOptions): WritableMultipart {
  const boundary = options?.boundary ?? randomString();
  const delimiter = new TextEncoder().encode(`\r\n--${boundary}`);
  const contentType: Header = { value: 'multipart/form-data', attrs: { boundary } };
  const transform = options?.transform ?? ((part: ReadablePart) => part);
  const flush = options?.flush ?? (() => []);
  const written: string[] = [];

  const stream = new TransformStream<WritablePart, Uint8Array>({
    async transform(writablePart, controller) {
      const transformedPart = await transform(toReadablePart(writablePart));
      if (!transformedPart) {
        return;
      }
      await enqueuePart(transformedPart, delimiter, controller);
      written.push(transformedPart.name);
    },
    async flush(controller) {
      const parts = await flush(written);
      if (parts) {
        for (const part of parts) {
          await enqueuePart(part, delimiter, controller);
        }
      }
      controller.enqueue(delimiter);
      controller.enqueue(new TextEncoder().encode('--'));
    },
  });

  return {
    contentType: headerToStr(contentType),
    boundary,
    input: stream.writable,
    output: stream.readable,
  };
}
