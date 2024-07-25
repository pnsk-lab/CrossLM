/**
 * Define Gemini 1.5 Pro
 * @module
 */

import type { ModelOptions } from '../../mod.ts'
import type { Features } from '../../types.ts'
import { GeminiBase } from './shared.ts'

const FEATURES: ModelFeatures[] = ['stream', 'input-image'] as const satisfies Features[]
type ModelFeatures = ['stream', 'input-image'][number]

/**
 * Gemini 1.5 Pro
 */
export class Gemini15Pro extends GeminiBase<ModelFeatures> {
  features = FEATURES
  name = 'gemini/1.5-flash'
  constructor (apiKey: string, options: ModelOptions = {}) {
    super('gemini-1.5-flash', apiKey, options)
  }
}