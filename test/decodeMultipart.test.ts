import { describe, expect, it } from 'vitest';
import { decodeMultipart, streamToString, stringToStream } from '../src/index';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

const text = `
--MyBoundary
Content-Disposition: form-data; name="foo-j"

--MyBoundar
--MyBoundary--
`.replaceAll('\n', '\r\n');

describe('decodeMultipart', () => {
  it('does typical stuff', async () => {
    const boundary = 'MyBoundary';
    const readableMultipart = decodeMultipart(boundary);
    const stream = stringToStream(typicalInput).pipeThrough(readableMultipart.stream);
    let index = 0;
    for await (const part of stream) {
      // console.log(part);
      // console.log({ body: await streamToString(part.body) });
      expect({
        ...part,
        body: await streamToString(part.body),
      }).toEqual(typicalOutput[index++]);
    }
  });
});
