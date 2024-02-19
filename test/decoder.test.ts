import { describe, expect, it } from 'vitest';
import { decoder, streamToString, stringToStream } from '../src';
import formDataExample from './fixtures/formDataExample';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

describe('decoder', () => {
  it('decodes requests', async () => {
    const { formData, author, content, contentType } = formDataExample();
    const input = new Request('http://localhost:8080', {
      method: 'POST',
      body: formData,
    });
    const { stream } = decoder(input);
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
    }
    expect.assertions(6);
  });

  const typicalInputs = {
    string: typicalInput,
    stream: stringToStream(typicalInput, 1),
  };

  Object.entries(typicalInputs).forEach(([type, input]) => {
    it(`decodes typical multipart data from a ${type}`, async () => {
      const boundary = 'MyBoundary';
      const decoded = decoder(input, { boundary });
      let index = 0;
      for await (const part of decoded.stream) {
        const body = await streamToString(part.body);
        const expectedPart = typicalOutput[index++];
        expect(part.name).toEqual(expectedPart.name);
        expect(part.attrs).toEqual(expectedPart.attrs);
        expect(part.headers).toEqual(expectedPart.headers);
        expect(body).toEqual(expectedPart.body);
      }
      expect(index).toEqual(typicalOutput.length);
      expect(boundary).toEqual(decoded.boundary);
    });
  });
});
