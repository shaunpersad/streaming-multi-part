import { ReadablePart, WritablePart, toReadablePart } from './lib/parts';

export type Mapper = (part: ReadablePart) => WritablePart | Promise<WritablePart>;

export default function mapperStream(mapper: Mapper) {
  return new TransformStream<ReadablePart, ReadablePart>({
    async transform(part, controller) {
      controller.enqueue(toReadablePart(await mapper(part)));
    },
  });
}
