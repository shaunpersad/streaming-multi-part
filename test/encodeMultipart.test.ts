import { describe, expect, it } from 'vitest';
import {
  ReadablePart, WritablePart, decodeMultipart, encodeMultipart, streamToString, stringToStream,
} from '../src/index';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

const text = `
--MyBoundary
Content-Disposition: form-data; name="foo"

foo
--MyBoundary
Content-Disposition: form-data; name="bar"

bar
--MyBoundary
Content-Disposition: form-data; name="baz"

baz
--MyBoundary--`.replaceAll('\n', '\r\n');

const boundary = 'MyBoundary';

describe('encodeMultipart', () => {
  it('decode encode', async () => {
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
      .pipeThrough(decodeMultipart(boundary, '-- one --').stream)
      .pipeThrough(encodeMultipart(boundary).stream)
      .pipeThrough(decodeMultipart(boundary, '-- two --').stream)
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body, '-- three --'),
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
        async write(part) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body),
          });
        },
      }));

    expect(encodedDecodedParts).toEqual(typicalOutput);
  });
});
