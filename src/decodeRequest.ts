import decodeMultipart, { DecodeMultipartOptions } from './decodeMultipart';
import { ReadablePart, decodeAttributes } from './lib/parts';

export type DecodedRequest = {
  boundary: string,
  stream: ReadableStream<ReadablePart>,
};

export type DecodeRequestOptions = DecodeMultipartOptions;

export default function decodeRequest(request: Request, options?: DecodeRequestOptions): DecodedRequest {
  const { boundary } = decodeAttributes(request.headers.get('Content-Type') || '');
  if (!boundary) {
    throw new Error('No boundary found in content-type header.');
  }
  if (!request.body) {
    throw new Error('Request has no body.');
  }
  return {
    boundary,
    stream: request.body.pipeThrough(decodeMultipart(boundary, options).stream),
  };
}
