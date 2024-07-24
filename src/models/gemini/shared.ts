/**
 * Gemini client
 * @module
 */

import type {
  Features,
  GeneratedResponse,
  GeneratedResponseStream,
  GenerateInit,
  GeneratingChunk,
  Message,
  ModelOptions,
} from '../../types.ts'
import { blobToBase64 } from '../../utils/blob.ts'
import { Model } from '../mod.ts'

interface GeminiBlob {
  mime_type: string
  data: string
}
interface GeminiPart {
  text?: string
  inline_data?: GeminiBlob
}
interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}
interface GeminiBody {
  contents: GeminiContent[]
  system_instruction?: GeminiPart[]
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: GeminiPart[]
      role: 'model'
    }
    finishReason: string
  }[]
  usageMetadata: {
    promptTokenCount: number
    candidatesTokenCount: number
  }
}

/**
 * Gemini Base class
 * @internal
 */
export abstract class GeminiBase<F extends Exclude<Features, 'system-as-role'>> extends Model<F> {
  #modelName: string
  #apiKey: string
  constructor(modelName: string, apiKey: string, options: ModelOptions) {
    super(options)
    this.#modelName = modelName
    this.#apiKey = apiKey
  }
  async #fetch(body: GeminiBody, headers: Record<string, string>, stream: boolean) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.#modelName}-latest:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${this.#apiKey}`, {
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      console.error(await res.json())
      throw new Error(`Gemini throws status code: ${res.status}`)
    }
    return res
  }
  async #messagesToContents (msgs: Message<F>[]): Promise<GeminiContent[]> {
    return await Promise.all(msgs.map(async msg => ({
      parts: await Promise.all(msg.parts.map(async part => (part.image ? {
        inline_data: {
          mime_type: part.image.type,
          data: await blobToBase64(part.image)
        }
      } : {
        text: part.text ?? ''
      }))),
      role: msg.role === 'assistant' ? 'model' : 'user'
    } satisfies GeminiContent)))
  }
  async generate(
    init: GenerateInit<F>,
  ): Promise<GeneratedResponse<F>> {
    const res = await this.#fetch({
      contents: await this.#messagesToContents(init.messages),
      system_instruction: init.systemPrompt === void 0 ? [{ text: init.systemPrompt }] : []
    }, {}, false)

    const json: GeminiResponse = await res.json()

    return {
      text: json.candidates[0].content.parts[0].text ?? '',
      usage: {
        outputTokens: json.usageMetadata.candidatesTokenCount,
        inputTokens: json.usageMetadata.promptTokenCount
      }
    }
  }
  async *generateStream(
    init: GenerateInit<F>,
  ): AsyncGenerator<GeneratingChunk, GeneratedResponseStream<F>> {
    const res = await this.#fetch({
      contents: await this.#messagesToContents(init.messages),
      system_instruction: init.systemPrompt === void 0 ? [{ text: init.systemPrompt }] : []
    }, {
      'Transfer-Encoding': 'chunked',
    }, true)

    const body = res.body
    if (!body) {
      throw new TypeError('body is undefined')
    }

    let text = ''
    const decoder = new TextDecoder()
    const reader = body.getReader()
    let usageMetadata: GeminiResponse['usageMetadata']
    while (true) {
      const chunk = await reader.read()

      text += decoder.decode(chunk.value, { stream: true })
      const splitted = text.split('\r\n')

      for (const jsonText of splitted.slice(0, -1).filter(s => s !== '')) {
        const json: GeminiResponse = JSON.parse(jsonText.replace(/(^\[)|([\]\,]$)/g, ''))
        if (!json) {
          continue
        }
        if (json.usageMetadata) {
          usageMetadata = json.usageMetadata
        }
        yield {
          text: json.candidates[0].content.parts[0].text ?? '0'
        }
      }

      text = splitted.slice(-1).join('\r\n')

      if (chunk.done) {
        decoder.decode()
        return {
          usage: {
            inputTokens: usageMetadata!.promptTokenCount,
            outputTokens: usageMetadata!.candidatesTokenCount
          }
        }
      }
    }
  }
}
