import colorize from 'json-colorizer'
import { stderr, stdout } from 'node:process'
import { type Sink } from './sink.js'

interface Options {
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
 * @param options Sink Options
 */
export const createConsoleSink: (
  options?: Options
) => Readonly<Sink> = options => {
  const debug = options?.debug ?? false
  const trace = options?.trace ?? false

  const sink: Sink = {
    out(log) {
      const out = stdout.isTTY ? colorize(log) : log

      stdout.write(out)
      stdout.write('\n')
    },

    err(log) {
      const out = stderr.isTTY ? colorize(log) : log

      stderr.write(out)
      stderr.write('\n')
    },

    debug(log) {
      if (debug === false) return
      const out = stdout.isTTY ? colorize(log) : log

      stdout.write(out)
      stdout.write('\n')
    },

    trace(log) {
      if (trace === false) return
      const out = stdout.isTTY ? colorize(log) : log

      stdout.write(out)
      stdout.write('\n')
    },
  }

  return Object.freeze(sink)
}
