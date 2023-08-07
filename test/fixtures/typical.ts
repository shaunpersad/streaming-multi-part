import { WritablePart } from '../../src';

export const input = `
This is a multi-part message.  This line is ignored.
--MyBoundary
Content-Disposition: form-data; name=foo-a

Minimal
--MyBoundary
Content-Disposition: form-data; name="foo-b"

Quoted
--MyBoundary
Content-Disposition: form-data; name="foo-c"; filename="foo.jpg"

With filename
--MyBoundary
Content-Disposition: form-data; name="foo-d"; filename="foo.jpg"
Content-Type: image/jpeg

With content type
--MyBoundary
Content-Disposition: form-data; name="foo-e"; filename="foo.jpg"
Content-Type: image/jpeg; foo="bar"; bar=baz

With multiple attributes
--MyBoundary
content-disposition:form-data;name="foo-f";filename="foo.jpg"
content-type:image/jpeg;foo="bar";bar=baz

With lowercase and no spaces
--MyBoundary
Content-Disposition: form-data; name="foo-g"
Content-Type: text/plain

With
multiple
lines.
--MyBoundary
Content-Disposition: form-data; name="foo-h"
Content-Type: text/plain

With
multiple
lines
space

--MyBoundary

No headers
--MyBoundary


No headers space above and below.

--MyBoundary
Content-Disposition: form-data; name="foo-i"
Content-Type: text/plain


With
multiple
lines
space
again

--MyBoundary
Content-Disposition: form-data; name="foo-j"

--MyBoundar
--MyBoundary
Content-Disposition: form-data; name="foo-k"

--MyBoundar

--MyBoundary
Content-Disposition: form-data; name="foo-l"


--MyBoundar

--MyBoundary
Content-Disposition: form-data; name="foo-m"

--MyBoundar
--MyBoundar
--MyBoundar
--MyBoundary--

useless trailer
`.replaceAll('\n', '\r\n');

export const output: WritablePart[] = [
  {
    name: 'foo-a',
    body: 'Minimal',
    attrs: {
      name: 'foo-a',
    },
    contentDisposition: 'form-data; name="foo-a"',
  },
  {
    name: 'foo-b',
    body: 'Quoted',
    attrs: {
      name: 'foo-b',
    },
    contentDisposition: 'form-data; name="foo-b"',
  },
  {
    name: 'foo-c',
    body: 'With filename',
    attrs: {
      name: 'foo-c',
      filename: 'foo.jpg',
    },
    contentDisposition: 'form-data; name="foo-c"; filename="foo.jpg"',
  },
  {
    name: 'foo-d',
    body: 'With content type',
    attrs: {
      name: 'foo-d',
      filename: 'foo.jpg',
    },
    contentDisposition: 'form-data; name="foo-d"; filename="foo.jpg"',
    contentType: 'image/jpeg',
  },
  {
    name: 'foo-e',
    body: 'With multiple attributes',
    attrs: {
      name: 'foo-e',
      filename: 'foo.jpg',
    },
    contentDisposition: 'form-data; name="foo-e"; filename="foo.jpg"',
    contentType: 'image/jpeg; foo="bar"; bar="baz"',
  },
  {
    name: 'foo-f',
    body: 'With lowercase and no spaces',
    attrs: {
      name: 'foo-f',
      filename: 'foo.jpg',
    },
    contentDisposition: 'form-data; name="foo-f"; filename="foo.jpg"',
    contentType: 'image/jpeg; foo="bar"; bar="baz"',
  },
  {
    name: 'foo-g',
    body: 'With\r\nmultiple\r\nlines.',
    attrs: {
      name: 'foo-g',
    },
    contentDisposition: 'form-data; name="foo-g"',
    contentType: 'text/plain',
  },
  {
    name: 'foo-h',
    body: 'With\r\nmultiple\r\nlines\r\nspace\r\n',
    attrs: {
      name: 'foo-h',
    },
    contentDisposition: 'form-data; name="foo-h"',
    contentType: 'text/plain',
  },
  {
    name: '',
    body: 'No headers',
    attrs: {},
    contentDisposition: 'form-data',
  },
  {
    name: '',
    body: '\r\nNo headers space above and below.\r\n',
    attrs: {},
    contentDisposition: 'form-data',
  },
  {
    name: 'foo-i',
    body: '\r\nWith\r\nmultiple\r\nlines\r\nspace\r\nagain\r\n',
    attrs: {
      name: 'foo-i',
    },
    contentDisposition: 'form-data; name="foo-i"',
    contentType: 'text/plain',
  },
  {
    name: 'foo-j',
    body: '--MyBoundar',
    attrs: {
      name: 'foo-j',
    },
    contentDisposition: 'form-data; name="foo-j"',
  },
  {
    name: 'foo-k',
    body: '--MyBoundar\r\n',
    attrs: {
      name: 'foo-k',
    },
    contentDisposition: 'form-data; name="foo-k"',
  },
  {
    name: 'foo-l',
    body: '\r\n--MyBoundar\r\n',
    attrs: {
      name: 'foo-l',
    },
    contentDisposition: 'form-data; name="foo-l"',
  },
  {
    name: 'foo-m',
    body: '--MyBoundar\r\n--MyBoundar\r\n--MyBoundar',
    attrs: {
      name: 'foo-m',
    },
    contentDisposition: 'form-data; name="foo-m"',
  },
];
