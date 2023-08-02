import { Header, headerToStr, strToHeader } from './headers';

export type ReadablePart = {
  name: string,
  body: ReadableStream<Uint8Array>,
  attrs: Record<string, string>,
  contentDisposition: string,
  contentType?: string,
};

export type WritablePart = {
  name: ReadablePart['name'],
  body: ReadablePart['body'] | string,
  attrs?: ReadablePart['attrs'],
  contentDisposition?: ReadablePart['contentDisposition'],
  contentType?: ReadablePart['contentType'],
};

export function contentDispositionForPart({ contentDisposition, name, attrs }: WritablePart): Header {
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

export function toReadablePart(part: WritablePart): ReadablePart {
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
