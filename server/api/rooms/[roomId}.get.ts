import { createEventStream } from 'h3';

export default defineEventHandler(async (event) => {
  const stream = createEventStream(event);

  return stream.send();
});
