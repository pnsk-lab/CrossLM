/**
 * Define Command R
 * @module
 */

import type { Features, ModelOptions } from '../../types.ts'
import { CohereClientBase } from './shared.ts'

const FEATURES: ['system-as-role', 'stream'] = ['system-as-role', 'stream'] as const satisfies Features[]
type CommandFeatures = typeof FEATURES[number]

/**
 * Command
 */
export class Command extends CohereClientBase<CommandFeatures> {
  name = 'cohere/command'
  features = FEATURES
  constructor (token: string, options: ModelOptions = {}) {
    super('command', token, options)
  }
}
