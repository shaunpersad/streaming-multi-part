import { describe, expect, it } from 'vitest';
import {
  ReadablePart, WritablePart, decodeStream, encoder, streamToString, stringToStream,
} from '../src/index';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

const boundary = 'MyBoundary';

describe('encoder', () => {
  it('decode encode decode', async () => {
    const encodedDecodedParts: WritablePart[] = [];

    await stringToStream(typicalInput)
      .pipeThrough(decodeStream(boundary))
      .pipeThrough(encoder(boundary).stream)
      .pipeThrough(decodeStream(boundary))
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part: ReadablePart) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body),
          });
        },
      }));

    for (let x = 0; x < encodedDecodedParts.length; x++) {
      const part = encodedDecodedParts[x];
      const expectedPart = typicalOutput[x];
      expect(part.name).toEqual(expectedPart.name);
      expect(part.attrs).toEqual(expectedPart.attrs);
      expect(part.headers).toEqual({ 'content-disposition': 'form-data', ...expectedPart.headers });
      expect(part.body).toEqual(expectedPart.body);
    }
    expect(encodedDecodedParts.length).toEqual(typicalOutput.length);
  });

  it('encodes typical multipart data', async () => {
    const encodedDecodedParts: WritablePart[] = [];

    await stringToStream(typicalInput)
      .pipeThrough(decodeStream(boundary))
      .pipeThrough(encoder(boundary).stream)
      .pipeThrough(decodeStream(boundary))
      .pipeThrough(encoder(boundary).stream)
      .pipeThrough(decodeStream(boundary))
      .pipeThrough(encoder(boundary).stream)
      .pipeThrough(decodeStream(boundary))
      .pipeThrough(encoder(boundary).stream)
      .pipeThrough(decodeStream(boundary))
      .pipeTo(new WritableStream<ReadablePart>({
        async write(part: ReadablePart) {
          encodedDecodedParts.push({
            ...part,
            body: await streamToString(part.body),
          });
        },
      }));

    for (let x = 0; x < encodedDecodedParts.length; x++) {
      const part = encodedDecodedParts[x];
      const expectedPart = typicalOutput[x];
      expect(part.name).toEqual(expectedPart.name);
      expect(part.attrs).toEqual(expectedPart.attrs);
      expect(part.headers).toEqual({ 'content-disposition': 'form-data', ...expectedPart.headers });
      expect(part.body).toEqual(expectedPart.body);
    }
    expect(encodedDecodedParts.length).toEqual(typicalOutput.length);
  });
});
