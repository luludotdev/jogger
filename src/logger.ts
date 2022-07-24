import { type Field, field, serializeFields } from './field/index.js'
import { isSink, type Sink } from './sink/index.js'

type LogLevels = typeof logLevels[number]
const logLevels = ['info', 'debug', 'trace', 'warn', 'error'] as const

type LogFn = (field: Readonly<Field>, ...fields: Array<Readonly<Field>>) => void

type WrappedLogFn = (
  level: LogLevels,
  ...fields: Array<Readonly<Field>>
) => void

export type Logger = Record<LogLevels, LogFn>

interface Options {
  /**
   * Logger name
   */
  name: string

  /**
   * Log sink(s)
   */
  sink: Readonly<Sink> | [Readonly<Sink>, ...Array<Readonly<Sink>>]

  /**
   * Extra fields to include in all log entries
   */
  fields?: Array<Readonly<Field>>
}

/**
 * Create a new Logger
 * @param options Logger Options
 */
export const createLogger: (options: Options) => Readonly<Logger> = options => {
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
          sink.err(serialized)
          break
        }

        default:
          sink.out(serialized)
          break
      }
    }
  }

  const logger: Partial<Logger> = {}
  for (const level of logLevels) {
    logger[level] = (...args) => fn(level, ...args)
  }

  return Object.freeze(logger as Logger)
}
