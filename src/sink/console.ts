import { stderr, stdout } from 'node:process'
import colorize from 'json-colorizer'
import type { Sink } from './sink.js'

const writeLine = (line: string, error = false) => {
  const out = stdout.isTTY ? colorize(line) : line
  const stream = error ? stderr : stdout

  stream.write(out)
  stream.write('\n')
}

export interface Options {
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
export const createConsoleSink: (options?: Options) => Sink = options => {
  const debug = options?.debug ?? false
  const trace = options?.trace ?? false

  const sink: Sink = {
    out(log) {
      writeLine(log)
    },

    err(log) {
      writeLine(log, true)
    },

    debug(log) {
      if (debug === false) return
      writeLine(log)
    },

    trace(log) {
      if (trace === false) return
      writeLine(log)
    },
  }

  return Object.freeze(sink)
}
