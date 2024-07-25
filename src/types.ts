/**
 * Type defs for CrossLM
 * @module
 */

import type { Model } from './models/mod.ts'

// Shared, Model, Surface

//  ------
//  SHARED
//  ------

/**
 * Features
 */
export type Features =
  /**
   * Input image
   */
  'input-image' |
  /**
   * If model has 'stream', you can use streaming response 
   */
  'stream' |
  /**
   * You can system promot in message
   */
  'system-as-role' |
  /**
   * You can input documents
   */
  'input-document'

/**
 * Document
 */
export interface Document {
  title: string
  text: string
}

/**
 * Usage of LLM result
 */
export interface Usage {
  /**
   * All input tokens count
   */
  inputTokens: number
  /**
   * All output tokens count
   */
  outputTokens: number
}

/**
 * Generated Object
 * @public
 */
export interface GeneratedResponse<F extends Features> {
  text: string
  usage: Usage
}

/**
 * Stream Generated
 */
export interface GeneratedResponseStream<F extends Features>{
  usage: Usage
}

/**
 * Part
 */
export type Part<F extends Features> = {
  text?: string
} & {
  image?: 'input-image' extends F ? Blob : never
}

/**
 * Message
 */
export interface Message<F extends Features> {
  role: ('system-as-role' extends F ? 'system' : never) | 'user' | 'assistant'
  parts: Part<F>[]
}

/**
 * Generate Init
 * @module
 */
export interface GenerateInit<F extends Features> {
  messages: Message<F>[]
  systemPrompt?: string
  documents?: 'input-document' extends F ? Document : never
  /**
   * Temperature, must be between 0.0 and 1.0
   */
  temperature?: number
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

// -------
// SURFACE
// -------

/**
 * CrossLM Message
 * @public
 */
export type CrossLMMessage<F extends Features> = {
  role: ('system-as-role' extends F ? 'system' : never) | 'user' | 'assistant'
} & ({
  text: string
} | {
  parts: Part<F>[]
})

/**
 * CrossLM Generate Init
 * @public
 */
export interface CrossLMGenerateInit<F extends Features> {
  /**
   * Messages
   */
  messages: CrossLMMessage<F>[]
  /**
   * Model select style
   * @default 'fallback'
   */
  mode?: 'fallback' | 'random'

  /**
   * System Prompt
   */
  systemPrompt?: string

  /**
   * Document
   */
  documents?: 'input-document' extends F ? Document : never

  /**
   * Temperature
   */
  temperature?: number
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
