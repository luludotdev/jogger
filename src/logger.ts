import { field, serializeFields } from './field/index.js'
import type { IField } from './field/index.js'
import { isSink } from './sink/index.js'
import type { ISink } from './sink/index.js'

type LogLevels = typeof logLevels[number]
const logLevels = ['info', 'debug', 'warn', 'error'] as const

type LogFn = (
  field: Readonly<IField>,
  ...fields: Array<Readonly<IField>>
) => void

type WrappedLogFn = (
  level: LogLevels,
  ...fields: Array<Readonly<IField>>
) => void

export type Logger = Record<LogLevels, LogFn>

interface ILoggerOptions {
  /**
   * Logger name
   */
  name: string

  /**
   * Log sink(s)
   */
  sink: Readonly<ISink> | [Readonly<ISink>, ...Array<Readonly<ISink>>]

  /**
   * Extra fields to include in all log entries
   */
  fields?: Array<Readonly<IField>>
}

/**
 * Create a new Logger
 * @param options Logger Options
 */
export const createLogger: (
  options: ILoggerOptions
) => Readonly<Logger> = options => {
  if (!options) {
    throw new Error('missing options parameter')
  }

  const sinks: ISink[] = Array.isArray(options.sink)
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
      if (level === 'debug') sink.debug(serialized)
      else if (level === 'error') sink.err(serialized)
      else sink.out(serialized)
    }
  }

  const logger: Partial<Logger> = {}
  for (const level of logLevels) {
    logger[level] = (...args) => fn(level, ...args)
  }

  return Object.freeze(logger as Logger)
}
