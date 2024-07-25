/**
 * Define CrossLM
 * @module
 */

import type { Model } from './models/mod.ts'
import type {
  CrossLMGenerated,
  CrossLMGenerateInit,
  CrossLMStreaming,
  CrossLMStreamReturn,
  Features,
  GenerateInit,
  Message,
} from './types.ts'
import { weightedRandom } from './utils/random.ts'

/**
 * CrossLM Class
 * @public
 */
export class CrossLM {
  #models: Model<any>[]
  constructor(models: Model<any>[]) {
    this.#models = models
  }
  #getTargetModels<F extends Features, S extends boolean>(
    features: F[],
    isStream: S,
  ): Model<F | ([S, true] extends [true, S] ? 'stream' : never)>[] {
    const targetFeatures = new Set<Features>(features)
    if (isStream) {
      targetFeatures.add('stream')
    }
    const selected = this.#models.filter((model) => {
      const modelFeatures = new Set<Features>(model.features)
      return modelFeatures.isSupersetOf(targetFeatures)
    }) as unknown as Model<
      F | ([S, true] extends [true, S] ? 'stream' : never)
    >[]

    if (selected.length === 0) {
      throw new TypeError('Features')
    }

    return selected
  }

  #getRandomModel<F extends Features>(targetModels: Model<F>[]): Model<F> {
    return targetModels[
      weightedRandom(targetModels.map((model) => model.options.weight ?? 1))
    ]
  }

  #createGenerateInit<F extends Features>(
    init: CrossLMGenerateInit<F>,
  ): GenerateInit<F> {
    const messages: Message<F>[] = init.messages.map((msg) => ({
      role: msg.role,
      parts: 'parts' in msg ? msg.parts : [{ text: msg.text }],
    }))
    return {
      messages,
      systemPrompt: init.systemPrompt,
      documents: init.documents,
      temperature: init.temperature
    }
  }

  public async generate<F extends Features>(
    features: F[],
    init: CrossLMGenerateInit<F>,
  ): Promise<CrossLMGenerated<F>> {
    const targetModels = this.#getTargetModels(features, false)

    const selectedByRandom = init.mode === 'random'
      ? this.#getRandomModel(targetModels)
      : null

    const generateInit = this.#createGenerateInit(init)

    const [used, generated] = selectedByRandom
      ? [selectedByRandom, await selectedByRandom.generate(generateInit)]
      : await (async () => {
        for (const model of targetModels) {
          try {
            return [model, await model.generate(generateInit)]
          } catch {}
        }
        throw new TypeError('All model generation failed.')
      })()

    return {
      usedModel: used,
      text: generated.text,
      usage: generated.usage,
    }
  }

  public generateStream<F extends Features>(
    features: F[],
    init: CrossLMGenerateInit<F | 'stream'>,
  ): CrossLMStreamReturn<F | 'stream'> {
    const targetModels = this.#getTargetModels(features, true)
    const selectedByRandom = init.mode === 'random'
      ? this.#getRandomModel(targetModels)
      : null
    const generateInit = this.#createGenerateInit(init)

    const {
      promise: end,
      resolve: resolveEnd,
    } = Promise.withResolvers<CrossLMGenerated<F | 'stream'>>()

    const stream: CrossLMStreaming<F | 'stream'> = (async function* () {
      const [used, stream] = selectedByRandom
        ? [selectedByRandom, await selectedByRandom.generateStream(generateInit)]
        : await (async () => {
          for (const model of targetModels) {
            try {
              return [model, await model.generateStream(generateInit)]
            } catch {}
          }
          throw new TypeError('All model generation failed.')
        })()
      let text = ''
      while (true) {
        const chunk = await stream.next()
        if (chunk.done) {
          const generated: CrossLMGenerated<F | 'stream'> = {
            text,
            usedModel: used,
            usage: chunk.value.usage,
          }
          resolveEnd(generated)
          return generated
        } else {
          text += chunk.value.text
          yield chunk.value
        }
      }
    })()

    return {
      end,
      stream,
    }
  }
}
