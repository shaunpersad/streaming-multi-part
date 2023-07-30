import { strToHeader } from './headers';
import partTransformer from './partTransformer';
import { ReadablePart } from './parts';

export type ReadableMultipart = {
  boundary: string,
  output: ReadableStream<ReadablePart>,
};

export default function readMultipart(request: Request): ReadableMultipart {
  const contentType = strToHeader(request.headers.get('content-type') || '');
  const { boundary } = contentType.attrs;
  if (!boundary) {
    throw new Error('No boundary found in content-type header.');
  }
  if (!request.body) {
    throw new Error('Request has no body.');
  }
  return {
    boundary,
    output: request.body.pipeThrough(partTransformer(boundary)),
  };
}
