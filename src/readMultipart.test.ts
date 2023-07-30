import { Readable } from 'node:stream';
import { describe, it } from 'vitest';
import readMultipart from './readMultipart';

const text = `
--MyBoundary
Content-Disposition: form-data; name="sometext"

some text that you wrote in your html form ...
--MyBoundary
Content-Disposition: form-data; name="name_of_post_request"; filename="filename.xyz"

content of filename.xyz that you upload in your form with input[type=file]
--MyBoundary
Content-Disposition: form-data; name="image"; filename="picture_of_sunset.jpg"

content of picture_of_sunset.jpg ...
--MyBoundary--
`.replaceAll('\n', '\r\n');

describe('readMultipart', () => {
  it('does typical stuff', async () => {
    const stream = new TextEncoderStream();
    const request = new Request('http://localhost', {
      method: 'post',
      body: stream.readable,
      headers: {
        'content-type': 'multipart/form-data; boundary=MyBoundary',
      },
    });
    const writer = stream.writable.getWriter();
    await writer.ready;
    console.log('one');
    writer.write(text).then(() => writer.close());
    const readableMultipart = readMultipart(request);
    for await (const part of readableMultipart.output) {
      console.log('part is:', part);
      // await part.body.cancel();
      for await (const chunk of part.body) {
        console.log(new TextDecoder().decode(chunk));
      }
    }
  });
});
