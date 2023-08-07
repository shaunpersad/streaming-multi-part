import { headerToStr, parseHeaderStr } from './headers';
import { ReadablePart } from './parts';

enum State {
  Uninitialized,
  ParsingHeader,
  ParsingBody,
  MultipartEnd,
}

const newLine = new TextEncoder().encode('\r\n');
const end = new TextEncoder().encode('--');

export type OnNewPart = (part: ReadablePart, writable: WritableStream<Uint8Array>) => void;

export default class PartParser {
  protected state = State.Uninitialized;

  protected lastByte: number | null = null;

  protected headers: string[] = [];

  protected headerBuffer: number[] = [];

  protected onNewPart: OnNewPart;

  constructor(onNewPart: OnNewPart) {
    this.onNewPart = onNewPart;
  }

  parse(byte: number): boolean {
    const { state, lastByte, headers, onNewPart } = this;
    switch (state) {
      case State.Uninitialized:
        if (lastByte === newLine[0] && byte === newLine[1]) { // start
          this.state = State.ParsingHeader;
        } else if (lastByte === end[0] && byte === end[1]) { // end of multipart
          this.state = State.MultipartEnd;
        } else if (lastByte !== null) {
          throw new Error('Invalid start to part.');
        }
        break;
      case State.ParsingHeader:
        if (lastByte === newLine[0] && byte === newLine[1]) { // end of a header
          if (this.headerBuffer.length > 1) {
            this.headerBuffer.pop();
            headers.push(new TextDecoder().decode(new Uint8Array(this.headerBuffer)));
            this.headerBuffer = [];
          } else {
            const stream = new TransformStream<Uint8Array, any>();
            const part: ReadablePart = {
              name: '',
              body: stream.readable,
              attrs: {},
              contentDisposition: 'form-data',
            };
            this.state = State.ParsingBody;
            for (const str of headers) {
              const { name, header } = parseHeaderStr(str);
              switch (name) {
                case 'content-disposition':
                  // if (!header.attrs.name) {
                  //   header.attrs.name = '';
                  // }
                  if (!header.value) {
                    header.value = 'form-data';
                  }
                  part.name = header.attrs.name || '';
                  part.attrs = header.attrs;
                  part.contentDisposition = headerToStr(header);
                  break;
                case 'content-type':
                  part.contentType = headerToStr(header);
                  break;
                default:
                  break;
              }
            }
            onNewPart(part, stream.writable);
          }
        } else {
          this.headerBuffer.push(byte);
        }
        break;
      case State.ParsingBody:
        return true;
      default:
        break;
    }
    this.lastByte = byte;
    return false;
  }
}
