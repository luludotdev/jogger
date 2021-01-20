import colorize from 'json-colorizer'
import type { ISink } from './sink'

/**
 * @param debug Whether to include `debug` level logs, defaults to `false`
 */
export const createConsoleSink: (debug?: boolean) => Readonly<ISink> = (
  debug = false
) =>
  Object.freeze({
    out: log => {
      const out = process.stdout.isTTY ? colorize(log) : log

      process.stdout.write(out)
      process.stdout.write('\n')
    },

    err: log => {
      const out = process.stderr.isTTY ? colorize(log) : log

      process.stderr.write(out)
      process.stderr.write('\n')
    },

    debug: log => {
      if (debug === false) return
      const out = process.stdout.isTTY ? colorize(log) : log

      process.stdout.write(out)
      process.stdout.write('\n')
    },
  })
