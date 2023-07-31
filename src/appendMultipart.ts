import { ReadablePart, WritablePart, toReadablePart } from './lib/parts';

export type Append = (written: string[]) => WritablePart[] | Promise<WritablePart[]>;

export type AppendedMultipart = {
  append: Append,
  stream: TransformStream<ReadablePart, ReadablePart>,
};

export default function appendMultipart(append: Append): AppendedMultipart {
  const written: string[] = [];
  const stream = new TransformStream<ReadablePart, ReadablePart>({
    transform(part, controller) {
      written.push(part.name);
      controller.enqueue(part);
    },
    async flush(controller) {
      const parts = await append(written);
      for (const part of parts) {
        controller.enqueue(toReadablePart(part));
      }
    },
  });

  return { append, stream };
}
