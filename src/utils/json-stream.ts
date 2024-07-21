/**
 * Define JSON Stream
 * @module
 */

export async function* jsonStream<T>(stream: ReadableStream<Uint8Array>, prefix: string = ''): AsyncGenerator<T, void> {
  const reader = stream.getReader()

  const decoder = new TextDecoder()

  let text = ''

  const getJsons = () => {
    const splitted = text.split(/\r?\n/)
    const result = splitted.slice(0, -1).map(s => s.replace(prefix, ''))
      .filter(s => s !== '[DONE]' && s !== '')
      .map(s => JSON.parse(s))
    text = splitted.slice(-1).join('\n')
    return result
  }

  while (true) {
    const chunk = await reader.read()
    text += decoder.decode(chunk.value, { stream: true })

    for (const json of getJsons()) {
      yield json
    }
    if (chunk.done) {
      text += decoder.decode()
      for (const json of getJsons()) {
        yield json
      }
      break
    }
  }
}
