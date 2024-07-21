/**
 * Cohere client
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
 * Cohere Response
 */
export interface CohereResponse {
  text: string
  meta: {
    tokens: {
      input_tokens: number
      output_tokens: number
    }
  }
}

/**
 * Stream Chunk for Cohere
 */
export type StreamChunk =
  & {
    is_finished: boolean
    event_type: string
  }
  & ({
    is_finished: false
    event_type: 'text-generation'
    text: string
  } | {
    is_finished: true
    event_type: 'stream-end'
    response: CohereResponse
  })

const roleMap: Record<string, string> = {
  assistant: 'CHATBOT',
  system: 'SYSTEM',
  user: 'USER'
}

const FEATURES: ['system-as-role', 'stream'] = ['system-as-role', 'stream'] as const satisfies Features[]
type CohereFeatures = typeof FEATURES[number]

/**
 * Cohere Client Base class
 * @internal
 */
export abstract class CohereClientBase extends Model<CohereFeatures> {
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
    const res = await fetch('https://api.cohere.com/v1/chat', {
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `bearer ${this.#apiKey}`,
        ...headers,
      },
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (res.status !== 200) {
      throw new Error(`Cohere throws status code: ${res.status}`)
    }
    return res
  }
  #convertChatHistory (msgs: GenerateInit<CohereFeatures>['messages']) {
    return msgs.map(msg => ({
      role: roleMap[msg.role],
      text: msg.text ?? ''
    }))
  }
  async generate(
    init: GenerateInit<CohereFeatures>,
  ): Promise<GeneratedResponse<CohereFeatures>> {
    const res = await this.#fetch({
      chat_history: this.#convertChatHistory(init.messages.slice(0, -1)),
      message: init.messages.at(-1)?.text ?? '',
      model: this.#modelName,
    })

    const json: CohereResponse = await res.json()
    return {
      text: json.text,
      usage: {
        inputTokens: json.meta.tokens.input_tokens,
        outputTokens: json.meta.tokens.output_tokens
      }
    }
  }
  async *generateStream(
    init: GenerateInit<CohereFeatures>,
  ): AsyncGenerator<GeneratingChunk, GeneratedResponse<CohereFeatures>> {
    const res = await this.#fetch({
      chat_history: this.#convertChatHistory(init.messages.slice(0, -1)),
      message: init.messages.at(-1)?.text ?? '',
      model: this.#modelName,
      stream: true,
    }, {
      'Transfer-Encoding': 'chunked',
    })
    const body = res.body
    if (!body) {
      throw new TypeError('body is undefined')
    }
    for await (const jsonChunk of jsonStream<StreamChunk>(body)) {
      switch (jsonChunk.event_type) {
        case 'text-generation':
          yield {
            text: jsonChunk.text,
          }
          break
        case 'stream-end':
          return {
            text: jsonChunk.response.text,
            usage: {
              inputTokens: jsonChunk.response.meta.tokens.input_tokens,
              outputTokens: jsonChunk.response.meta.tokens.output_tokens,
            }
          }
      }
    }
    throw new TypeError('Generation stopped')
  }
}