/**
 * Define Command R
 * @module
 */

import type { ModelOptions } from '../../types.ts'
import { CohereClientBase } from './shared.ts'

/**
 * Command R
 */
export class CommandR extends CohereClientBase {
  name = 'cohere/command-r'
  constructor (token: string, options: ModelOptions = {}) {
    super('command-r', token, options)
  }
}
