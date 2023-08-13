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
  it('decodes typical multipart data', async () => {
    const boundary = 'MyBoundary';
    const decode = decodeMultipart(boundary);
    const stream = stringToStream(typicalInput).pipeThrough(decode.stream);
    let index = 0;
    for await (const part of stream) {
      const body = await streamToString(part.body);
      console.log({
        part1: { ...part, body },
        part2: typicalOutput[index],
      });
      // console.log({ body: await streamToString(part.body) });
      expect({
        ...part,
        body,
      }).toEqual(typicalOutput[index++]);
    }
    expect(index).toEqual(typicalOutput.length);
  });
});
