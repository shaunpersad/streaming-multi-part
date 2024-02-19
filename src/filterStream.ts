import { ReadablePart } from './lib/parts';

export type Filter = (part: ReadablePart) => boolean | Promise<boolean>;

export default function filterStream(filter: Filter) {
  return new TransformStream<ReadablePart, ReadablePart>({
    async transform(part, controller) {
      if (await filter(part)) {
        controller.enqueue(part);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const chunk of part.body) {
          // discard unused part bodies
        }
      }
    },
  });
}
