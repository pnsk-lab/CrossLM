/**
 * @example
 * ```ts
 * import { CrossLM } from '@pnsk-lab/crosslm'
 * import { CommandRPlus } from '@pnsk-lab/crosslm/cohere/command-r-plus'
 *
 * const lm = new CrossLM([new CommandRPlus()])
 * 
 * const { end, stream } = lm.generateStream([], {
 *   messages: [{ role: 'system', text: '1+1=?' }]
 * })
 * 
 * for await (const { text } of stream) {
 *   console.log(text)
 * }
 * ```
 * @module
 */
export { CrossLM } from './crosslm.ts'
export * from './types.ts'
