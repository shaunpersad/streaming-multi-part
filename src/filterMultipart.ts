import { ReadablePart } from './lib/parts';

export type Filter = (part: ReadablePart) => boolean | Promise<boolean>;

export type FilteredMultipart = {
  filter: Filter,
  stream: TransformStream<ReadablePart, ReadablePart>,
};

export default function filterMultipart(filter: Filter): FilteredMultipart {
  const stream = new TransformStream<ReadablePart, ReadablePart>({
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

  return { filter, stream };
}
