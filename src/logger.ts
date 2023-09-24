import { serialize } from './field.ts'
import type { Data } from './field.ts'
import { isSink } from './sink/index.ts'
import type { Sink } from './sink/index.ts'

type LogLevels = (typeof logLevels)[number]
const logLevels = ['info', 'debug', 'trace', 'warn', 'error'] as const

type LogFn = (data: Data) => void
type WrappedLogFn = (level: LogLevels, data: Data) => void

export type Logger = Readonly<Record<LogLevels, LogFn>>

interface Options {
  /**
   * Logger name
   */
  name: string

  /**
   * Log sink(s)
   */
  sink: Sink | [Sink, ...Sink[]]

  // /**
  //  * Extra fields to include in all log entries
  //  */
  // extra?: Data
}

/**
 * Create a new Logger
 *
 * @param options - Logger Options
 */
export const createLogger: (options: Options) => Logger = options => {
  if (!options) {
    throw new Error('missing options parameter')
  }

  const sinks: Sink[] = Array.isArray(options.sink)
    ? options.sink
    : [options.sink]

  for (const sink of sinks) {
    if (isSink(sink) === false) {
      throw new TypeError(`logger \`${options.name}\` has an invalid sink`)
    }
  }

  const fn: WrappedLogFn = (level, data) => {
    const defaultData: Data = {
      ts: Date.now(),
      logger: options.name,
      level,
    }

    // TODO: Extra fields
    const { ts: _, logger: __, level: ___, ...stripped } = data
    const all = { ...defaultData, ...stripped }
    const serialized = serialize(all)

    for (const sink of sinks) {
      switch (level) {
        case 'debug': {
          sink.debug(serialized)
          break
        }

        case 'trace': {
          sink.trace(serialized)
          break
        }

        case 'error': {
          sink.error(serialized)
          break
        }

        default:
          sink.out(serialized)
          break
      }
    }
  }

  const entries = logLevels.map(level => {
    const logFn = (data: Data) => fn(level, data)
    return [level, logFn]
  })

  const logger = Object.fromEntries(entries) as Logger
  return Object.freeze(logger as Logger)
}
