import { type Field, field, serializeFields } from './field/index.js'
import { isSink, type Sink } from './sink/index.js'

type LogLevels = typeof logLevels[number]
const logLevels = ['info', 'debug', 'trace', 'warn', 'error'] as const

type LogFn = (field: Field, ...fields: Field[]) => void
type WrappedLogFn = (level: LogLevels, ...fields: Field[]) => void

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

  /**
   * Extra fields to include in all log entries
   */
  fields?: Field[]
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

  const fn: WrappedLogFn = (level, ...fields) => {
    const defaultFields = [
      field('ts', Date.now()),
      field('logger', options.name),
      field('level', level),
    ]

    const all = options.fields
      ? [...defaultFields, ...options.fields, ...fields]
      : [...defaultFields, ...fields]

    const serialized = serializeFields(...all)
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
    const logFn = (...fields: readonly Field[]) => fn(level, ...fields)
    return [level, logFn]
  })

  const logger = Object.fromEntries(entries) as Logger
  return Object.freeze(logger as Logger)
}
