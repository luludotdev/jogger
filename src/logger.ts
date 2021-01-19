import { field } from './field'
import type { IField } from './field'
import { isSink } from './sink'
import type { ISink } from './sink'

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

type Logger = Record<LogLevels, LogFn>

interface ILoggerOptions {
  name: string
  sink: Readonly<ISink> | [Readonly<ISink>, ...Array<Readonly<ISink>>]
  fields?: Array<Readonly<IField>>
}

export const createLogger: (
  options: ILoggerOptions
) => Readonly<Logger> = options => {
  const sinks: ISink[] = Array.isArray(options.sink)
    ? options.sink
    : [options.sink]

  for (const sink of sinks) {
    if (isSink(sink) === false) {
      throw new Error(`logger \`${options.name}\` has an invalid sink`)
    }
  }

  const fn: WrappedLogFn = (level, ...fields) => {
    const defaultFields = [field('ts', Date.now()), field('level', level)]

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

const serializeFields: (...fields: Array<Readonly<IField>>) => string = (
  ...fields
) => {
  const object: Record<string, any> = {}
  for (const field of fields) {
    if (field.name in object) {
      throw new Error(`duplicate field name: \`${field.name}\``)
    }

    object[field.name] = field.value
  }

  return JSON.stringify(object)
}
