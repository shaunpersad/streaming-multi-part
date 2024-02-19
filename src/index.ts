import appendStream, { Appender, ToAppend } from './appendStream';
import decodeStream, { DecodeStreamOptions } from './decodeStream';
import decoder, { DecodedMultipart, DecoderOptions } from './decoder';
import encoder, { EncodedMultipart } from './encoder';
import filterStream, { Filter } from './filterStream';
import { ReadablePart, WritablePart } from './lib/parts';
import mapperStream, { Mapper } from './mapperStream';
import replacerStream from './replacerStream';
import searcherStream, { SearcherStreamChunk } from './searcherStream';
import streamToString from './streamToString';
import stringToStream from './stringToStream';

export type {
  Appender,
  ToAppend,
  DecodeStreamOptions,
  DecodedMultipart,
  DecoderOptions,
  EncodedMultipart,
  Filter,
  Mapper,
  ReadablePart,
  SearcherStreamChunk,
  WritablePart,
};

export {
  decoder,
  encoder,
  appendStream,
  mapperStream,
  decodeStream,
  filterStream,
  replacerStream,
  searcherStream,
  streamToString,
  stringToStream,
};
