import { describe, expect, it } from 'vitest';
import { appendStream, decoder, streamToString, stringToStream } from '../src';
import formDataExample from './fixtures/formDataExample';

describe('appendStream', () => {
  it('appends parts to the end of the multi-part stream', async () => {
    const { formData, author, content, contentType } = formDataExample();
    const input = new Request('http://localhost:8080', {
      method: 'POST',
      body: formData,
    });
    const append = appendStream((written) => {
      expect(written).toEqual(['author', 'content']);
      return [
        {
          name: 'status',
          body: 'draft',
        },
        {
          name: 'data',
          body: stringToStream('foo'),
          attrs: { filename: 'data.txt' },
          headers: {
            'content-type': 'text/plain',
          },
        },
      ];
    });
    const stream = decoder(input).stream.pipeThrough(append);
    for await (const part of stream) {
      const body = await streamToString(part.body);
      if (part.name === 'author') {
        expect(part.attrs).toEqual({ name: 'author' });
        expect(part.headers).toEqual({ 'content-disposition': 'form-data; name="author"' });
        expect(body).toEqual(author);
      }
      if (part.name === 'content') {
        expect(part.attrs).toEqual({ name: 'content', filename: 'this-is-a-test.txt' });
        expect(part.headers).toEqual({
          'content-disposition': 'form-data; name="content"; filename="this-is-a-test.txt"',
          'content-type': contentType,
        });
        expect(body).toEqual(content);
      }
      if (part.name === 'status') {
        expect(part.attrs).toEqual({ name: 'status' });
        expect(part.headers).toEqual({ 'content-disposition': 'form-data; name="status"' });
        expect(body).toEqual('draft');
      }
      if (part.name === 'data') {
        expect(part.attrs).toEqual({ name: 'data', filename: 'data.txt' });
        expect(part.headers).toEqual({
          'content-disposition': 'form-data; name="data"; filename="data.txt"',
          'content-type': 'text/plain',
        });
        expect(body).toEqual('foo');
      }
    }
    expect.assertions(13);
  });
});
