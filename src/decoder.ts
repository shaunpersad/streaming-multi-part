import decodeStream, { DecodeStreamOptions } from './decodeStream';
import { ReadablePart, decodeAttributes } from './lib/parts';
import stringToStream from './stringToStream';

export type DecodedMultipart = {
  boundary: string,
  stream: ReadableStream<ReadablePart>,
};

export type DecoderOptions = DecodeStreamOptions;

export default function decoder(input: Request, options?: DecoderOptions): DecodedMultipart;
export default function decoder(input: string, options: DecoderOptions & { boundary: string }): DecodedMultipart;
export default function decoder(input: ReadableStream<ArrayBufferView>, options: DecoderOptions & { boundary: string }): DecodedMultipart;
export default function decoder(input: string | ReadableStream<ArrayBufferView>, options: DecoderOptions & { boundary: string }): DecodedMultipart;
export default function decoder(input: Request | string | ReadableStream<ArrayBufferView>, options: DecoderOptions & { boundary?: string } = {}): DecodedMultipart {
  let readable: ReadableStream<ArrayBufferView>;
  let boundary = '';
  if (typeof input === 'string') {
    readable = stringToStream(input, 1);
    if (!options.boundary) {
      throw new Error('No boundary found in options.');
    }
    boundary = options.boundary;
  } else if (input instanceof ReadableStream) {
    readable = input;
    if (!options.boundary) {
      throw new Error('No boundary found in options.');
    }
    boundary = options.boundary;
  } else {
    const attrs = decodeAttributes(input.headers.get('Content-Type') || '');
    if (!input.body) {
      throw new Error('Request has no body.');
    }
    readable = input.body;
    if (!attrs.boundary) {
      throw new Error('No boundary found in content-type header.');
    }
    boundary = attrs.boundary;
  }

  return {
    boundary,
    stream: readable.pipeThrough(decodeStream(boundary, options)),
  };
}
