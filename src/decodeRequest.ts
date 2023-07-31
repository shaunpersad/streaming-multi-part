import decodeMultipart from './decodeMultipart';
import { strToHeader } from './lib/headers';

export default function decodeRequest(request: Request) {
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
    stream: request.body.pipeThrough(decodeMultipart(boundary).stream),
  };
}
