# streaming-multi-part
Codec for working with multipart form data as streams. Targeted for use in Cloudflare Workers.

## Motivation
The web [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) is handy, but loads all its data in memory.

This is particularly inefficient considering that form data is often used with large data like images and other files.
Compounding this inefficiency is that many times these large items are processed and uploaded elsewhere.

Having a stream interface makes these types of scenarios faster and more memory-friendly.

## API
The codec is separated into several modular functions that return a stream, which can then be piped into each other as needed.

The two main operations of any codec are decoding and encoding.

Typically, you will decode an incoming request using `decodeRequest` which will produce a readable stream of parts (`ReadablePart`).
Each part's body is also a readable sub-stream of their portion of the parent stream's data (`UInt8Array` - a zero-copy view of the original data).
Parts also contain necessary metadata like its name, filename, etc.

You can also produce your own multipart form data using `encodeMultipart` which will produce a transform stream that you can write parts (`WritablePart`) to.

The following functions are available:

- `decodeRequest(request: Request): { stream: ReadableStream<ReadablePart> }`
  - Decode a request body into a stream of parts.
- `decodeMultipart(boundary: string): { stream: TransformStream<UInt8Array, ReadablePart> }`
  - If you don't have a request, you can "manually" pipe in your raw multipart data to the writable side of this stream.
- `filterMultipart(filter: (part: ReadablePart) => boolean | Promise<boolean>): { stream: TransformStream<ReadablePart, ReadablePart> }`
  - Every part's sub-stream must eventually be consumed in order for the parent stream to make progress, so use this to filter out irrelevant parts. Return `true` to keep the part in the stream.
- `changeMultipart(change: (part: ReadablePart) => WritablePart | Promise<WritablePart>): { stream: TransformStream<ReadablePart, ReadablePart> }`
  - Modify the given part in some way. Typically used to pipe the sub-stream into another stream.
- `appendMultipart(append: (written: string[]) => WritablePart[] | Promise<WritablePart[]>): { stream: TransformStream<ReadablePart, ReadablePart> }`
  - Can be used to append new parts to the stream. The `append` function receives the names of all the parts already written.
- `encodeMultipart(customBoundary?: string): { stream: TransformStream<WritablePart, Uint8Array>, contentType: string, boundary: string }`
  - Encode the given parts into a data stream. Also produces a `content-type` header that already includes the boundary used.

## Examples

Convert a request body into a stream of parts, where each part contains a sub-stream of their portion of the parent stream's data.
```javascript
import { decodeRequest } from 'streaming-multi-part';

export default {
  async fetch(request) {
    const decode = decodeRequest(request);
    for await (const part of decode.stream) { // we've decoded the request body into a stream of parts
      console.log(`${part.name} body:`);
      for await (const chunk of part.body) { // each part's body is also a sub-stream of their portion of the parent stream's data
        console.log(new TextDecoder().decode(part.body));
      }
    }
    return new Response();
  }
}
```

The sub-stream for each part must be consumed in order for the parent stream to make progress, so you should filter out any parts you don't need:
```javascript
import { decodeRequest, filterMultipart } from 'streaming-multi-part';

export default {
  async fetch(request) {
    const decode = decodeRequest(request);
    const filter = filterMultipart((part) => part.name === 'image'); // return true for the parts you're interested in
    for await (const part of decode.stream.pipeThrough(filter.stream)) { // send the parts through the filter
      // this will only fire for the image part, thanks to our filter
      const fileName = part.attrs.filename;
      const response = await fetch(`https://example.com/images/${fileName}`, {
        method: 'post',
        body: part.body, // stream the body directly from the incoming request to the outgoing sub-request
        headers: {
          'content-type': part.contentType,
        },
      });
      return response;
    }
    return new Response();
  }
}
```

You can also create your own multipart bodies:
```javascript
import { encodeMultipart } from 'streaming-multi-part';

export default {
  async fetch(request) {
    const encode = encodeMultipart();
    const writer = encode.stream.writable.getWriter();
    const response = await fetch('https://example.com/images/cat.jpg');
    await writer.ready;
    writer.write({ 
      name: 'image', 
      body: response.body, // stream the body directly from the sub-request
      attrs: { filename: 'cat.jpg' },
      contentType: 'image/jpeg',
    });
    writer.write({ 
      name: 'caption', 
      body: 'this is a cat' // also accept strings
    });
    writer.close();
    return new Response(encode.stream.readable, { // stream directly to the response
      headers: {
        'content-type': encode.contentType, // an appropriate content-type header with the boundary is provided for you
      }
    });
  }
}
```
Combine streams to proxy data efficiently. This example has an incoming multipart request, strips out all parts except the image and (optional) caption, lowercases the caption, appends a default caption if one wasn't provided, then streams it all to an outgoing multipart sub-request. All of this takes place without loading any part bodies fully in memory:
```javascript
import { decodeRequest, filterMultipart, changeMultipart, appendMultipart, encodeMultipart } from 'streaming-multi-part';

export default {
  async fetch(request) {
    const decode = decodeRequest(request); // convert request body to stream of parts
    const filter = filterMultipart((part) => ['image', 'caption'].includes(part.name)); // we're only interested in the image and caption
    const change = changeMultipart((part) => { // lowercase the caption
      if (part.name === 'caption') {
        return {
          ...part,
          body: part.body
            .pipeThrough(new TextDecoderStream())
            .pipeThrough(new TransformStream({
              transform(chunk, controller) {
                controller.enqueue(chunk.toLowerCase());
              },
            }))
            .pipeThrough(new TextEncoderStream()),
        };
      }
      return part;
    })
    const append = appendMultipart((written) => {  // append a default caption if one wasn't provided
      const parts = [];
      if (!written.includes('caption')) {
        parts.push({
          name: 'caption',
          body: 'this is the default caption',
        });
      }
      return parts;
    });
    const encode = encodeMultipart(); // covert parts into a data stream
    const response = await fetch('https://example.com/images/cat.jpg', {
      headers: {
        'content-type': encode.contentType,
      },
      body: decode.stream // chain all the streams together and send the data directly to the sub-request
        .pipeThrough(filter.stream)
        .pipeThrough(change.stream)
        .pipeThrough(append.stream)
        .pipeThrough(encode.stream),
    });
    return response;
  }
}
```
