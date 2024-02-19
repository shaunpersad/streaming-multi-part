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
  const params = str.split(';').map((p) => p.trim()).filter((p) => p);
  const normalizedAttrs: ContentDispositionAttributes = Object.entries(additional).reduce(
    (obj, [key, value]) => (value !== '' ? { ...obj, [key.toLowerCase()]: value } : obj),
    {},
  );
  for (const param of params) {
    const [paramName, paramValue] = param.split('=').map((p) => p.trim());
    const normalizedKey = paramName.toLowerCase();
    if (paramValue) {
      if (!normalizedAttrs[normalizedKey]) {
        try {
          normalizedAttrs[normalizedKey] = JSON.parse(paramValue).toString();
        } catch (err) {
          normalizedAttrs[normalizedKey] = paramValue;
        }
      }
    }
  }
  return new Proxy(normalizedAttrs, {
    get(target, key): any {
      if (typeof key === 'string') {
        return normalizedAttrs[key.toLowerCase()];
      }
      return undefined;
    },
    ownKeys(): ArrayLike<string | symbol> {
      return Object.keys(normalizedAttrs);
    },
    has(target: ContentDispositionAttributes, key: string | symbol): boolean {
      return typeof key === 'string' && key.toLowerCase() in normalizedAttrs;
    },
  });
}

export function encodeAttributes(attrs: ContentDispositionAttributes, ...additional: string[]): string {
  return Object.entries(attrs).reduce(
    (pieces, [key, value]) => [...pieces, value === '' ? '' : `${key}=${JSON.stringify(value)}`],
    additional,
  ).filter((p) => !!p.trim()).join('; ');
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

export function isPart(part: any): part is (ReadablePart | WritablePart) {
  if (!('name' in part) || typeof part.name !== 'string') {
    return false;
  }
  if (!('body' in part) || !(typeof part.body === 'string' || part.body instanceof ReadableStream)) {
    return false;
  }
  if ('attrs' in part && typeof part.attrs !== 'object') {
    return false;
  }
  if ('headers' in part && !(typeof part.headers === 'object' || part.headers instanceof Headers)) {
    return false;
  }
  return true;
}
