import { Readable } from 'node:stream';
import { describe, it } from 'vitest';
import { decodeMultipart } from '../src/index';

describe('readMultipart', () => {
  it('does typical stuff', async () => {
    console.log('hey');
    // const request = new Request('http://localhost', {
    //   method: 'post',
    //   body: Readable.toWeb(Readable.from('typical')).pipeThrough(new TextEncoderStream()),
    //   headers: {
    //     'content-type': 'multipart/form-data; boundary=MyBoundary',
    //   },
    // });
    // const readableMultipart = readMultipart(request);
    // // @ts-ignore
    // for await (const part of readableMultipart.output) {
    //   console.log(part);
    // }
  });
});
