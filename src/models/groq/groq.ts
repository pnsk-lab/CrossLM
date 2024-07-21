/**
 * Groq Client
 * @module
 */
import type { ModelOptions } from '../../types.ts'
import { GroqClientBase } from './shared.ts'

export type ModelName = (
  'llama3-8b-8192' |
  'llama3-70b-8192' |
  'llama3-groq-8b-8192-tool-use-preview' | 
  'llama3-groq-70b-8192-tool-use-preview' | 
  'mixtral-8x7b-32768' | 
  'gemma-7b-it' |
  'gemma2-9b-it'
) | (string & {})

/**
 * Gloq
 */
export class Groq extends GroqClientBase {
  name: string
  constructor (modelName: ModelName, apiKey: string, options: ModelOptions = {}) {
    super(modelName, apiKey, options)
    this.name = `groq/${modelName}`
  }
}
