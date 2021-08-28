import colorize from 'json-colorizer'
import { stderr, stdout } from 'node:process'
import type { Sink } from './sink.js'

/**
 * @param debug Whether to include `debug` level logs, defaults to `false`
 */
export const createConsoleSink: (debug?: boolean) => Readonly<Sink> = (
  debug = false
) =>
  Object.freeze({
    out: log => {
      const out = stdout.isTTY ? colorize(log) : log

      stdout.write(out)
      stdout.write('\n')
    },

    err: log => {
      const out = stderr.isTTY ? colorize(log) : log

      stderr.write(out)
      stderr.write('\n')
    },

    debug: log => {
      if (debug === false) return
      const out = stdout.isTTY ? colorize(log) : log

      stdout.write(out)
      stdout.write('\n')
    },
  })
