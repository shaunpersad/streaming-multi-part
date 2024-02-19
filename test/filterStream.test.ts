import { describe, expect, it } from 'vitest';
import { decoder, filterStream, streamToString } from '../src';
import formDataExample from './fixtures/formDataExample';

describe('filterStream', () => {
  it('removes parts from the stream', async () => {
    const { formData, content, contentType } = formDataExample();
    const input = new Request('http://localhost:8080', {
      method: 'POST',
      body: formData,
    });
    const filter = filterStream((part) => part.name !== 'author');
    const stream = decoder(input).stream.pipeThrough(filter);
    for await (const part of stream) {
      const body = await streamToString(part.body);
      expect(part.name).not.toEqual('author');
      if (part.name === 'content') {
        expect(part.attrs).toEqual({ name: 'content', filename: 'this-is-a-test.txt' });
        expect(part.headers).toEqual({
          'content-disposition': 'form-data; name="content"; filename="this-is-a-test.txt"',
          'content-type': contentType,
        });
        expect(body).toEqual(content);
      }
    }
    expect.assertions(4);
  });
});
