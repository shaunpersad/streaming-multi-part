import { ReadablePart, WritablePart, toReadablePart } from './lib/parts';

export type ToAppend = WritablePart[] | WritablePart | null | undefined;

export type Appender = (written: string[]) => ToAppend | Promise<ToAppend>;

export default function appendStream(appender: Appender) {
  const written: string[] = [];
  return new TransformStream<ReadablePart, ReadablePart>({
    transform(part, controller) {
      written.push(part.name);
      controller.enqueue(part);
    },
    async flush(controller) {
      const parts = await appender(written);
      if (parts) {
        for (const part of Array.isArray(parts) ? parts : [parts]) {
          controller.enqueue(toReadablePart(part));
        }
      }
    },
  });
}
