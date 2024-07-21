/**
 * Define Command R+
 * @module
 */

import type { ModelOptions } from '../../types.ts'
import { CohereClientBase } from './shared.ts'

/**
 * Command R+
 */
export class CommandRPlus extends CohereClientBase {
  name = 'cohere/command-r-plus'
  constructor (token: string, options: ModelOptions = {}) {
    super('command-r-plus', token, options)
  }
}
