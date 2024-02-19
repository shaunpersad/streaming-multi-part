import { describe, expect, it } from 'vitest';
import { decodeStream, streamToString, stringToStream } from '../src/index';
import { input as typicalInput, output as typicalOutput } from './fixtures/typical';

describe('decodeStream', () => {
  it('decodes typical multipart data', async () => {
    const boundary = 'MyBoundary';
    const decode = decodeStream(boundary);
    const stream = stringToStream(typicalInput, 1).pipeThrough(decode);
    let index = 0;
    for await (const part of stream) {
      const body = await streamToString(part.body);
      const expectedPart = typicalOutput[index++];
      expect(part.name).toEqual(expectedPart.name);
      expect(part.attrs).toEqual(expectedPart.attrs);
      expect(part.headers).toEqual(expectedPart.headers);
      expect(body).toEqual(expectedPart.body);
    }
    expect(index).toEqual(typicalOutput.length);
  });

  it('throws an error on a truncated body', async () => {
    const boundary = 'MyBoundary';
    const body = `
This is a multi-part message.  This line is ignored.
--${boundary}
foo-bar: baz

Oh no, premature EOF!
`.replaceAll('\n', '\r\n');
    const decode = decodeStream(boundary);
    const stream = stringToStream(body).pipeThrough(decode);
    try {
      for await (const part of stream) {
        await streamToString(part.body);
      }
    } catch (err) {
      expect((err as Error).message.toLowerCase()).toContain('malformed');
    }
    expect.assertions(1);
  });

  // it('does headers that span multiple lines', async () => {
  //   // This body, extracted from an email, contains headers that span multiple
  //
  //   // lines.
  //
  //   // TODO: The original mail ended with a double-newline before the
  //
  //   // final delimiter; this was manually edited to use a CRLF.
  //
  //   const email = "\n--Apple-Mail-2-292336769\nContent-Transfer-Encoding: 7bit\nContent-Type: text/plain;\n\tcharset=US-ASCII;\n\tdelsp=yes;\n\tformat=flowed\n\nI'm finding the same thing happening on my system (10.4.1).\n\n\n--Apple-Mail-2-292336769\nContent-Transfer-Encoding: quoted-printable\nContent-Type: text/html;\n\tcharset=ISO-8859-1\n\n<HTML><BODY>I'm finding the same thing =\nhappening on my system (10.4.1).=A0 But I built it with XCode =\n2.0.</BODY></=\nHTML>=\n\r\n--Apple-Mail-2-292336769--\n";
  //   const decode = decodeMultipart('Apple-Mail-2-292336769');
  //   const stream = stringToStream(email).pipeThrough(decode.stream);
  //   for await (const part of stream) {
  //     const body = await streamToString(part.body);
  //     console.log({ ...part, body });
  //   }
  // });
  describe('quoted printable encoding', () => {
    ['quoted-printable', 'Quoted-PRINTABLE'].forEach((cte, index) => {
      it(`test cte ${index}`, async () => {
        // From https://golang.org/issue/4411
        const body = `--0016e68ee29c5d515f04cedf6733\r\nContent-Type: text/plain; charset=ISO-8859-1\r\nContent-Disposition: form-data; name=text\r\nContent-Transfer-Encoding: ${cte}\r\n\r\nwords words words words words words words words words words words words wor=\r\nds words words words words words words words words words words words words =\r\nwords words words words words words words words words words words words wor=\r\nds words words words words words words words words words words words words =\r\nwords words words words words words words words words\r\n--0016e68ee29c5d515f04cedf6733\r\nContent-Type: text/plain; charset=ISO-8859-1\r\nContent-Disposition: form-data; name=submit\r\n\r\nSubmit\r\n--0016e68ee29c5d515f04cedf6733--`;
        const decode = decodeStream('0016e68ee29c5d515f04cedf6733');
        const stream = stringToStream(body).pipeThrough(decode);
        for await (const part of stream) {
          const decodedBody = await streamToString(part.body);
          //           expect(decodedBody).toEqual(
          //             `words words words words words words words words words words words words wor=
          // ds words words words words words words words words words words words words =
          // words words words words words words words words words words words words wor=
          // ds words words words words words words words words words words words words =
          // words words words words words words words words words
          // Submit`.replaceAll('\n', '\r\n'),
          //           );
        }
      });
    });
  });

  describe('various line endings', () => {
    [
      'Foo\nBar',
      'Foo\nBar\n',
      'Foo\r\nBar',
      'Foo\r\nBar\r\n',
      'Foo\rBar',
      'Foo\rBar\r',
      '\x00\x01\x02\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10',
    ].forEach((body, index) => {
      it(`test body ${index + 1}`, async () => {
        const boundary = 'BOUNDARY';
        const str = '--BOUNDARY\r\n'
          + 'Content-Disposition: form-data; name="test"\r\n'
          + `\r\n${body}\r\n--BOUNDARY--\r\n`;
        const decode = decodeStream(boundary);
        const stream = stringToStream(str).pipeThrough(decode);
        for await (const part of stream) {
          const decodedBody = await streamToString(part.body);
          expect(part.name).toEqual('test');
          expect(decodedBody).toEqual(body);
        }
        expect.assertions(2);
      });
    });
  });
});
