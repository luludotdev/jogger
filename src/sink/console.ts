import colorize from 'json-colorizer'
import type { ISink } from '.'

export const consoleSink: (debug?: boolean) => Readonly<ISink> = (
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
