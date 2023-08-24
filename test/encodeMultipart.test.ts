import { describe, expect, it } from 'vitest';
import {
  ReadablePart, WritablePart, decodeMultipart, encodeMultipart, streamToString, stringToStream,
} from '../src/index';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

const boundary = 'MyBoundary';

describe('encodeMultipart', () => {
  it('decode encode', async () => {
    const text = `
--${boundary}
Content-Disposition: form-data; name="foo"

foo
--${boundary}
Content-Disposition: form-data; name="bar"

bar
--${boundary}
Content-Disposition: form-data; name="baz"

baz
--${boundary}--`.replaceAll('\n', '\r\n');
    let str = '';

    await stringToStream(text)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeTo(new WritableStream<Uint8Array>({
        async write(chunk) {
          str += new TextDecoder().decode(chunk);
        },
      }));
    expect(text).toEqual(str);
  });

  it('decode encode decode', async () => {
    const encodedDecodedParts: WritablePart[] = [];

    await stringToStream(typicalInput)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part: ReadablePart) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body),
            headers: Object.fromEntries(part.headers.entries()),
          });
        },
      }));

    expect(encodedDecodedParts).toEqual(typicalOutput);
  });

  it('encodes typical multipart data', async () => {
    const encodedDecodedParts: WritablePart[] = [];

    await stringToStream(typicalInput)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part: ReadablePart) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body),
            headers: Object.fromEntries(part.headers.entries()),
          });
        },
      }));

    expect(encodedDecodedParts).toEqual(typicalOutput);
  });
});
