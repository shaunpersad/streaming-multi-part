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
--MyBoundary
Content-Disposition: form-data; name="foo-n"


--MyBoundary
Content-Disposition: form-data; name="foo-o"



--MyBoundary
Content-Disposition: form-data; name="foo-p"


--MyBoundary  
Content-Disposition: form-data; name="foo-q"

spaces in the last boundary
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
    headers: {
      'content-disposition': 'form-data; name="foo-a"',
    },
  },
  {
    name: 'foo-b',
    body: 'Quoted',
    attrs: {
      name: 'foo-b',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-b"',
    },
  },
  {
    name: 'foo-c',
    body: 'With filename',
    attrs: {
      name: 'foo-c',
      filename: 'foo.jpg',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-c"; filename="foo.jpg"',
    },
  },
  {
    name: 'foo-d',
    body: 'With content type',
    attrs: {
      name: 'foo-d',
      filename: 'foo.jpg',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-d"; filename="foo.jpg"',
      'content-type': 'image/jpeg',
    },
  },
  {
    name: 'foo-e',
    body: 'With multiple attributes',
    attrs: {
      name: 'foo-e',
      filename: 'foo.jpg',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-e"; filename="foo.jpg"',
      'content-type': 'image/jpeg; foo="bar"; bar="baz"',
    },
  },
  {
    name: 'foo-f',
    body: 'With lowercase and no spaces',
    attrs: {
      name: 'foo-f',
      filename: 'foo.jpg',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-f"; filename="foo.jpg"',
      'content-type': 'image/jpeg; foo="bar"; bar="baz"',
    },
  },
  {
    name: 'foo-g',
    body: 'With\r\nmultiple\r\nlines.',
    attrs: {
      name: 'foo-g',
    },

    headers: {
      'content-disposition': 'form-data; name="foo-g"',
      'content-type': 'text/plain',
    },
  },
  {
    name: 'foo-h',
    body: 'With\r\nmultiple\r\nlines\r\nspace\r\n',
    attrs: {
      name: 'foo-h',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-h"',
      'content-type': 'text/plain',
    },
  },
  {
    name: '',
    body: 'No headers',
    attrs: {},
    headers: {},
  },
  {
    name: '',
    body: '\r\nNo headers space above and below.\r\n',
    attrs: {},
    headers: {},
  },
  {
    name: 'foo-i',
    body: '\r\nWith\r\nmultiple\r\nlines\r\nspace\r\nagain\r\n',
    attrs: {
      name: 'foo-i',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-i"',
      'content-type': 'text/plain',
    },
  },
  {
    name: 'foo-j',
    body: '--MyBoundar',
    attrs: {
      name: 'foo-j',
    },

    headers: {
      'content-disposition': 'form-data; name="foo-j"',
    },
  },
  {
    name: 'foo-k',
    body: '--MyBoundar\r\n',
    attrs: {
      name: 'foo-k',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-k"',
    },
  },
  {
    name: 'foo-l',
    body: '\r\n--MyBoundar\r\n',
    attrs: {
      name: 'foo-l',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-l"',
    },
  },
  {
    name: 'foo-m',
    body: '--MyBoundar\r\n--MyBoundar\r\n--MyBoundar',
    attrs: {
      name: 'foo-m',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-m"',
    },
  },
  {
    name: 'foo-n',
    body: '',
    attrs: {
      name: 'foo-n',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-n"',
    },
  },
  {
    name: 'foo-o',
    body: '\r\n',
    attrs: {
      name: 'foo-o',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-o"',
    },
  },
  {
    name: 'foo-p',
    body: '',
    attrs: {
      name: 'foo-p',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-p"',
    },
  },
  {
    name: 'foo-q',
    body: 'spaces in the last boundary',
    attrs: {
      name: 'foo-q',
    },
    headers: {
      'content-disposition': 'form-data; name="foo-q"',
    },
  },
];
