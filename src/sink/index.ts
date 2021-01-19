type PrintFn = (log: string) => void

export interface ISink {
  out: PrintFn
  err: PrintFn
  debug: PrintFn
}

export function isSink(arg: unknown): arg is ISink {
  if (typeof arg !== 'object') return false
  if (arg === null) return false

  if ('out' in arg === false) return false
  if ('err' in arg === false) return false
  if ('debug' in arg === false) return false

  // @ts-expect-error
  const sink: Record<keyof ISink, unknown> = arg
  if (typeof sink.out !== 'function') return false
  if (typeof sink.err !== 'function') return false
  if (typeof sink.debug !== 'function') return false

  return true
}

export { consoleSink } from './console'
export { createFileSink } from './file'
