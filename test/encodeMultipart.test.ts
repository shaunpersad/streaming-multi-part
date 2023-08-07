import { describe, expect, it } from 'vitest';
import {
  ReadablePart, WritablePart, decodeMultipart, encodeMultipart, streamToString, stringToStream,
} from '../src';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

describe('encodeMultipart', () => {
  it('encodes typical multipart data', async () => {
    const boundary = 'MyBoundary';
    const decodedParts: WritablePart[] = [];
    const encodedDecodedParts: WritablePart[] = [];
    await stringToStream(typicalInput)
      .pipeThrough(decodeMultipart(boundary).stream)
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part) {
          decodedParts.push({
            ...part,
            body: await streamToString(part.body),
          });
        },
      }));

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

    expect(decodedParts).toEqual(typicalOutput);
    expect(encodedDecodedParts).toEqual(typicalOutput);
  });
});
