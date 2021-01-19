import type { ISink } from '.'

export const consoleSink: (debug?: boolean) => Readonly<ISink> = (
  debug = false
) =>
  Object.freeze({
    out: log => {
      process.stdout.write(log)
      process.stdout.write('\n')
    },

    err: log => {
      process.stderr.write(log)
      process.stderr.write('\n')
    },

    debug: log => {
      if (debug === false) return

      process.stdout.write(log)
      process.stdout.write('\n')
    },
  })
