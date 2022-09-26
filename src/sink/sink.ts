type PrintFn = (log: string) => void

type SinkMethod = typeof sinkMethods[number]
const sinkMethods = ['out', 'error', 'debug', 'trace'] as const

export type Sink = Readonly<Record<SinkMethod, PrintFn>>
export function isSink(arg: unknown): arg is Sink {
  if (typeof arg !== 'object') return false
  if (arg === null) return false

  for (const method of sinkMethods) {
    if (method in arg === false) return false
  }

  // @ts-expect-error Known to have sink interface methods
  const sink: Record<keyof Sink, unknown> = arg
  for (const method of sinkMethods) {
    if (typeof sink[method] !== 'function') return false
  }

  return true
}
