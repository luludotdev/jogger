import { stderr, stdout } from 'node:process'
import colorize from '@pinojs/json-colorizer'
import type { Sink } from './sink.js'

const writeLine = (line: string, { color = true, error = false } = {}) => {
  const out = color ? colorize(line) : line
  const stream = error ? stderr : stdout

  stream.write(out)
  stream.write('\n')
}

export interface Options {
  /**
   * Whether to enable colored output if the terminal supports it
   *
   * Defaults to `true`
   */
  color?: boolean

  /**
   * Whether to include `debug` level logs.
   *
   * Defaults to `false`
   */
  debug?: boolean

  /**
   * Whether to include `trace` level logs.
   *
   * Defaults to `false`
   */
  trace?: boolean
}

/**
 * Create a new Console Sink
 *
 * @param options - Sink Options
 */
export const createConsoleSink = (options?: Options): Sink => {
  const color = options?.color ?? false
  const debug = options?.debug ?? false
  const trace = options?.trace ?? false

  const sink: Sink = {
    out(log) {
      writeLine(log)
    },

    error(log) {
      writeLine(log, { color, error: true })
    },

    debug(log) {
      if (debug === false) return
      writeLine(log, { color })
    },

    trace(log) {
      if (trace === false) return
      writeLine(log, { color })
    },
  }

  return Object.freeze(sink)
}
