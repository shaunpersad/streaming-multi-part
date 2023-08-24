import stringToStream from '../stringToStream';

export type ReadablePart = {
  name: string,
  body: ReadableStream<Uint8Array>,
  attrs: ContentDispositionAttributes,
  headers: Headers,
};

export type WritablePart = {
  name: ReadablePart['name'],
  body: ReadablePart['body'] | string,
  attrs?: ReadablePart['attrs'],
  headers?: ReadablePart['headers'] | HeadersInit,
};

export type ContentDispositionAttributes = Partial<Record<string, string>>;

export function decodeAttributes(str: string, additional = {}): ContentDispositionAttributes {
  const params = str.split(';').map((v) => v.trim());
  const attrs: ContentDispositionAttributes = {};
  const normalizedAttrs: ContentDispositionAttributes = Object.entries(additional).reduce(
    (obj, [key, value]) => (value ? { ...obj, [key]: value } : obj),
    {},
  );
  for (const param of params) {
    const [paramName, paramValue] = param.split('=').map((p) => p.trim());
    const normalizedKey = paramName.toLowerCase();
    if (paramValue) {
      if (!attrs[paramName]) {
        try {
          attrs[paramName] = JSON.parse(paramValue).toString();
        } catch (err) {
          attrs[paramName] = paramValue;
        }
      }
      normalizedAttrs[normalizedKey] = attrs[paramName];
    }
  }
  return new Proxy(attrs, {
    get(target, key): any {
      if (key in target) {
        return target[key as keyof typeof target];
      }
      if (typeof key === 'string') {
        return normalizedAttrs[key.toLowerCase()];
      }
      return undefined;
    },
  });
}

export function encodeAttributes(attrs: ContentDispositionAttributes, ...initial: string[]): string {
  return Object.entries(attrs).reduce(
    (pieces, [key, value]) => [...pieces, `${key}=${JSON.stringify(value)}`],
    initial,
  ).join('; ');
}

export function toReadablePart(part: WritablePart): ReadablePart {
  const headers = part.headers instanceof Headers ? part.headers : new Headers(part.headers);
  const contentDisposition = headers.get('Content-Disposition') || '';
  const attrs = decodeAttributes(contentDisposition, { ...part.attrs, name: part.name });
  headers.set('Content-Disposition', encodeAttributes(attrs, 'form-data'));
  let { body } = part;
  if (typeof body === 'string') {
    body = stringToStream(body);
  }
  return { ...part, body, attrs, headers };
}
