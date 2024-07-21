/**
 * Type defs for CrossLM
 * @module
 */

import type { Model } from './models/mod.ts'

export type Features = 'image' | 'stream' | 'system-as-role'

/**
 * Generated Object
 * @public
 */
export interface GeneratedResponse<F extends Features> {
  text: string
  usage: Usage
}

/**
 * Message
 */
export interface Message<F extends Features> {
  role: ('system-as-role' extends F ? 'system' : never) | 'user' | 'assistant'

  text?: string
}

/**
 * Generate Init
 * @module
 */
export interface GenerateInit<F extends Features> {
  messages: Message<F>[]
}

/**
 * Generating Chunk
 */
export interface GeneratingChunk {
  text: string
}

/**
 * Model Options
 * @public
 */
export interface ModelOptions {
  /**
   * Weight for choosing random model
   */
  weight?: number
}

/**
 * CrossLM Generate Init
 */
export interface CrossLMGenerateInit<F extends Features> {
  /**
   * Messages
   */
  messages: Message<F>[]
  /**
   * Model select style
   * @default 'fallback'
   */
  mode?: 'fallback' | 'random'
}

/**
 * LLM Usage
 */
export interface Usage {
  inputTokens: number
  outputTokens: number
}

/**
 * CrossLM generated
 * @public
 */
export interface CrossLMGenerated<F extends Features> {
  usedModel: Model<F>
  text: string

  usage: Usage
}

/**
 * CrossLM stream response
 */
export type CrossLMStreaming<F extends Features> = AsyncGenerator<GeneratingChunk, CrossLMGenerated<F>>

/**
 * CrossLM Stream return
 */
export interface CrossLMStreamReturn<F extends Features> {
  end: Promise<CrossLMGenerated<F>>
  stream: CrossLMStreaming<F>
}
