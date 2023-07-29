export interface ReadablePart {
  name: string,
  body: ReadableStream,
  attrs: Record<string, string>,
  contentDisposition: string,
  contentType?: string,
}

export interface WritablePart extends ReadablePart {
  body: ReadableStream | string,
  attrs?: Record<string, string>,
  contentDisposition?: string,
  contentType?: string,
}
