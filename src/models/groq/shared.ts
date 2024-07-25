/**
 * Groq client
 * @module
 */

import type {
  Features,
  GeneratedResponse,
  GenerateInit,
  GeneratingChunk,
  ModelOptions,
} from '../../types.ts'
import { jsonStream } from '../../utils/json-stream.ts'
import { Model } from '../mod.ts'

/**
 * x_groq
 */
interface XGroq {
  id: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * Groq Response
 */
export interface GroqResponse {
  choices: {
    message: {
      content: string
    }
  }[]
  usage: XGroq['usage']
}

/**
 * Stream Chunk for Cohere
 */
export type StreamChunk =
  & {
    choices: {
      delta: { content: string }
    }[]
  }
  & ({
    choices: {
      finish_reason: null
    }[]
  } | {
    choices: {
      finish_reason: string
    }[]
    x_groq: XGroq
  })

const FEATURES: ['system-as-role', 'stream'] = ['system-as-role', 'stream'] as const satisfies Features[]
type GroqFeatures = typeof FEATURES[number]
/**
 * Groq Client Base class
 * @internal
 */
export abstract class GroqClientBase extends Model<GroqFeatures> {
  features = FEATURES
  #modelName: string
  #apiKey: string
  constructor(modelName: string, apiKey: string, options: ModelOptions) {
    super(options)
    this.#modelName = modelName
    this.#apiKey = apiKey
    //conversation
  }
  async #fetch(body: unknown, headers: Record<string, string> = {}) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      headers: {
        'content-type': 'application/json',
        Authorization: `bearer ${this.#apiKey}`,
        ...headers,
      },
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      throw new Error(`Groq throws status code: ${res.status}\n${await res.text()}`)
    }
    return res
  }
  async generate(
    init: GenerateInit<GroqFeatures>,
  ): Promise<GeneratedResponse<GroqFeatures>> {
    const res = await this.#fetch({
      messages: [...(init.systemPrompt ? [{ role: 'sysytem', content: init.systemPrompt }] : []), ...init.messages.map(msg => ({ role: msg.role, content: msg.parts.map(part => part.text).join('\n') ?? '' }))],
      model: this.#modelName,
      max_tokens: init.tokenLimit?.output
    })

    const json: GroqResponse = await res.json()
    return {
      text: json.choices[0].message.content,
      usage: {
        outputTokens: json.usage.completion_tokens,
        inputTokens: json.usage.prompt_tokens
      }
    }
  }
  async *generateStream(
    init: GenerateInit<GroqFeatures>,
  ): AsyncGenerator<GeneratingChunk, GeneratedResponse<GroqFeatures>> {
    const res = await this.#fetch({
      messages: [...(init.systemPrompt ? [{ role: 'sysytem', content: init.systemPrompt }] : []), ...init.messages.map(msg => ({ role: msg.role, content: msg.parts.map(part => part.text).join('\n') ?? '' }))],
      model: this.#modelName,
      stream: true,
      max_tokens: init.tokenLimit?.output,
      temperature: init.temperature ? init.temperature * 2 : void 0
    }, {
      'Transfer-Encoding': 'chunked',
    })
    const body = res.body
    if (!body) {
      throw new TypeError('body is undefined')
    }

    let text = ''
    for await (const chunk of jsonStream<StreamChunk>(body, 'data: ')) {
      const delta = chunk.choices[0].delta.content ?? ''
      text += delta
      yield {
        text: delta
      }
      if ('x_groq' in chunk && 'usage' in chunk.x_groq) {
        return {
          text: text,
          usage: {
            outputTokens: chunk.x_groq.usage.completion_tokens,
            inputTokens: chunk.x_groq.usage.prompt_tokens
          }
        }
      }
    }
    throw new TypeError('Generation stopped')
  }
}
