# streaming-multi-part
Multi-part form data codec for streaming individual parts

## Examples
```javascript
import { readMultipart } from 'streaming-multi-part';

export default {
    async fetch(request) {
        const readableMultipart = readMultipart(request);
        for await (const part of readableMultipart.output) {
            if (part.attrs.name === 'image') {
                await fetch(`https://example.com/images/${part.attrs.filename}`, {
                    method: 'post',
                    body: part.body, // a stream instead of the entire contents in memory
                });
            } else {
                part.body.cancel(); // clear the streams of the parts we're not interested in
            }
        }
        return new Response();
    }
}
```

```javascript
import { writeMultipart } from 'streaming-multi-part';

export default {
    async fetch(request) {
        const writableMultipart = writeMultipart();
        const writer = writableMultipart.input.getWriter();
        const response = await fetch('https://example.com/images/cat.jpg');
        await writer.ready;
        writer.write({ 
            name: 'image', 
            body: response.body, // passing the stream directly from the response
            attrs: { filename: 'cat.jpg' },
        });
        writer.write({ 
            name: 'caption', 
            body: 'this is a cat' // also accept strings
        });
        return new Response(writableMultipart.output, {
            headers: {
                'content-type': writableMultipart.contentType,
            }
        });
    }
}
```

```javascript
import { readMultipart, writeMultipart } from 'streaming-multi-part';

export default {
    async fetch(request) {
        const readableMultipart = readMultipart(request);
        const writableMultipart = writeMultipart({
            transform: (part) => { // if you don't return a part, it will be excluded from the output stream
                if (part.name === 'caption') {
                    return {
                        ...part,
                        body: part.body.pipeThrough(new TextDecoderStream()).pipeThrough(
                            new TransformStream({
                                transform(chunk, controller) {
                                    controller.enqueue(chunk.toLowerCase());
                                },
                            })
                        )
                    }
                }
            },
            flush: (written) => { / and array of part names that were already written
                if (!written.includes('caption')) {
                    return [{
                        name: 'caption',
                        body: 'this is the default caption'
                    }];
                }
            }
        })
        const response = await fetch('https://example.com/images/cat.jpg', {
            headers: {
                'content-type': writableMultipart.contentType,
            },
            body: readableMultipart.output.pipeTo(writableMultipart.input),
        });
        return response;
    }
}
```
