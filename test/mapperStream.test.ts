import { describe, expect, it } from 'vitest';
import { decoder, mapperStream, streamToString } from '../src';
import formDataExample from './fixtures/formDataExample';

describe('mapperStream', () => {
  it('removes parts from the stream', async () => {
    const { formData, author, content, contentType } = formDataExample();
    const input = new Request('http://localhost:8080', {
      method: 'POST',
      body: formData,
    });
    const mapper = mapperStream(async (part) => {
      if (part.name === 'author') {
        return {
          ...part,
          body: (await streamToString(part.body)).toUpperCase(),
        };
      }
      return part;
    });
    const stream = decoder(input).stream.pipeThrough(mapper);
    for await (const part of stream) {
      const body = await streamToString(part.body);
      if (part.name === 'author') {
        expect(part.attrs).toEqual({ name: 'author' });
        expect(part.headers).toEqual({ 'content-disposition': 'form-data; name="author"' });
        expect(body).toEqual(author.toUpperCase());
      }
      if (part.name === 'content') {
        expect(part.attrs).toEqual({ name: 'content', filename: 'this-is-a-test.txt' });
        expect(part.headers).toEqual({
          'content-disposition': 'form-data; name="content"; filename="this-is-a-test.txt"',
          'content-type': contentType,
        });
        expect(body).toEqual(content);
      }
    }
    expect.assertions(6);
  });
});
