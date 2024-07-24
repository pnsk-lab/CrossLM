/**
 * Define abstract class for model
 * @module
 */

import type { Features, GenerateInit, GeneratedResponse, GeneratedResponseStream, GeneratingChunk, ModelOptions } from '../types.ts'

/**
 * abstract model
 * @public
 */
export abstract class Model<F extends Features> {
  constructor (options: ModelOptions) {
    this.options = options
  }
  abstract name: string
  abstract features: F[]
  abstract generate(init: GenerateInit<F>): Promise<GeneratedResponse<F>>
  abstract generateStream(init: GenerateInit<F>): AsyncGenerator<GeneratingChunk, GeneratedResponseStream<F>>
  readonly options: ModelOptions
}