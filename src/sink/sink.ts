type PrintFn = (log: string) => void

export interface Sink {
  out: PrintFn
  err: PrintFn
  debug: PrintFn
  trace: PrintFn
}

export function isSink(arg: unknown): arg is Sink {
  if (typeof arg !== 'object') return false
  if (arg === null) return false

  if ('out' in arg === false) return false
  if ('err' in arg === false) return false
  if ('debug' in arg === false) return false

  // @ts-expect-error Known to have sink interface methods
  const sink: Record<keyof Sink, unknown> = arg
  if (typeof sink.out !== 'function') return false
  if (typeof sink.err !== 'function') return false
  if (typeof sink.debug !== 'function') return false

  return true
}
