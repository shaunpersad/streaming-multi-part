import { ReadablePart, decodeAttributes } from './parts';

export enum PartParserState {
  Uninitialized,
  ParsingHeader,
  ParsingBody,
  MultipartEnd,
}

const newLine = new TextEncoder().encode('\r\n');
const end = new TextEncoder().encode('--');
const whitespace = new TextEncoder().encode(' ');

export type OnNewPart = (part: ReadablePart, writable: WritableStream<Uint8Array>) => void;

export type PartParserOptions = {
  maxPartHeaderSize?: number,
  maxPartBodySize?: number,
};

export default class PartParser {
  protected state = PartParserState.Uninitialized;

  protected lastByte: number | null = null;

  protected headers: string[] = [];

  protected headerBuffer: number[] = [];

  protected onNewPart: OnNewPart;

  protected readonly maxPartHeaderSize: number;

  protected readonly maxPartBodySize: number;

  protected bodySize = 0;

  constructor(onNewPart: OnNewPart, options: PartParserOptions) {
    this.onNewPart = onNewPart;
    this.maxPartHeaderSize = options.maxPartHeaderSize || 1024;
    this.maxPartBodySize = options.maxPartBodySize || 104_857_600;
  }

  getState() {
    return this.state;
  }

  parse(byte: number): boolean {
    const { state, lastByte, headers, onNewPart } = this;
    switch (state) {
      case PartParserState.Uninitialized:
        if (lastByte === newLine[0] && byte === newLine[1]) { // start
          this.state = PartParserState.ParsingHeader;
        } else if (lastByte === end[0] && byte === end[1]) { // end of multipart
          this.state = PartParserState.MultipartEnd;
        } else if ([null, whitespace[0]].includes(lastByte) && [newLine[0], end[0], whitespace[0]].includes(byte)) {
          // the start of something
        } else if (lastByte !== null) {
          throw new Error(`Invalid start to part: "${lastByte}" "${byte}"`);
        }
        break;
      case PartParserState.ParsingHeader:
        if (lastByte === newLine[0] && byte === newLine[1]) { // end of a header
          if (this.headerBuffer.length > 1) {
            this.headerBuffer.pop();
            headers.push(new TextDecoder().decode(new Uint8Array(this.headerBuffer)));
            this.headerBuffer = [];
          } else {
            const stream = new TransformStream<Uint8Array, Uint8Array>();
            const part: ReadablePart = {
              name: '',
              body: stream.readable,
              attrs: {},
              headers: new Headers(),
            };
            this.state = PartParserState.ParsingBody;
            for (const str of headers) {
              const [key, value] = str.split(':').map((s) => s.trim());
              part.headers.append(key, value);
              if (key.toLowerCase() === 'content-disposition') {
                part.attrs = decodeAttributes(value);
                if (part.attrs.name) {
                  part.name = part.attrs.name;
                }
              }
            }
            onNewPart(part, stream.writable);
          }
        } else {
          if (this.headerBuffer.length >= this.maxPartHeaderSize) {
            throw new Error(`Part header size is greater than the specified max size of ${this.maxPartHeaderSize} bytes.`);
          }
          this.headerBuffer.push(byte);
        }
        break;
      case PartParserState.ParsingBody:
        if (++this.bodySize > this.maxPartBodySize) {
          throw new Error(`Part body size is greater than the specified max size of ${this.maxPartBodySize} bytes.`);
        }
        return true;
      default:
        break;
    }
    this.lastByte = byte;
    return false;
  }
}
