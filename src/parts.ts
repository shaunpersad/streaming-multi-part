export type ReadablePart = {
  name: string,
  body: ReadableStream<Uint8Array>,
  attrs: Record<string, string>,
  contentDisposition: string,
  contentType?: string,
};

export type WritablePart = ReadablePart & {
  body: ReadableStream<Uint8Array> | string,
  attrs?: Record<string, string>,
  contentDisposition?: string,
  contentType?: string,
};
