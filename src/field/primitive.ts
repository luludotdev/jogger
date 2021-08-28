export type Primitive = string | number | BigInt | boolean | null

export function isPrimitive(arg: unknown): arg is Primitive {
  if (typeof arg === 'string') return true
  if (typeof arg === 'number') return true
  if (typeof arg === 'bigint') return true
  if (typeof arg === 'boolean') return true
  if (arg === null) return true

  return false
}
