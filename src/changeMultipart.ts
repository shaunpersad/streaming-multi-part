import { ReadablePart, WritablePart, toReadablePart } from './lib/parts';

export type Change = (part: ReadablePart) => WritablePart | Promise<WritablePart>;

export type ChangedMultipart = {
  change: Change,
  stream: TransformStream<ReadablePart, ReadablePart>,
};

export default function changeMultipart(change: Change): ChangedMultipart {
  const stream = new TransformStream<ReadablePart, ReadablePart>({
    async transform(part, controller) {
      controller.enqueue(toReadablePart(await change(part)));
    },
  });

  return { change, stream };
}
