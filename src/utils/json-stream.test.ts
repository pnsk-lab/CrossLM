import { jsonStream } from './json-stream.ts'
import { assertEquals } from '@std/assert'

Deno.test('stream', async () => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(ctrler) {
      ctrler.enqueue(encoder.encode('{ "a": '))
      ctrler.enqueue(encoder.encode('0 }'))
      ctrler.enqueue(encoder.encode('\n'))
      ctrler.enqueue(encoder.encode('{ "b": '))
      ctrler.enqueue(encoder.encode('1 }\n'))
      ctrler.close()
    }
  })
  assertEquals(await Array.fromAsync(jsonStream(stream)), [
    { a: 0 },
    { b: 1 }
  ])
})
