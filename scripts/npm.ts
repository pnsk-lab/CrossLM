import denoJSON from '../deno.json' with { type: 'json' }
import { join } from '@std/path'

try {
  await Deno.remove('npm', { recursive: true })
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err
  }
}
await Deno.mkdir('npm')

await Deno.writeTextFile('npm/.npmrc', '@jsr:registry=https://npm.jsr.io')
await Deno.writeTextFile('npm/package.json', JSON.stringify({
  name: 'crosslm',
  version: denoJSON.version,
  dependencies: {
    "@pnsk-lab/crosslm": `npm:@jsr/pnsk-lab__crosslm@${denoJSON.version}`
  },
  exports: await Promise.all(Object.keys(denoJSON.exports).map(async (path) => {
    const from = `@pnsk-lab/crosslm${path.substring(1)}`
    const jsCode = `export * from '${from}'`
    const tsCode = `export type * from '${from}'`
    const targetDir = join('dist', path)
    await Deno.mkdir(join('npm', targetDir), { recursive: true })
    const types = join(targetDir, 'types.d.ts')
    const indexJS = join(targetDir, 'index.js')
    await Deno.writeTextFile(join('npm', types), jsCode)
    await Deno.writeTextFile(join('npm', indexJS), tsCode)

    return {
      types,
      default: indexJS
    }
  }))
}, null, 2))

await Deno.copyFile('README.md', 'npm/README.md')
