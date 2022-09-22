import type { Primitive } from './primitive.js'

export type FieldTypes = Primitive | Primitive[]
export interface Field {
  readonly $symbol: symbol
  readonly name: string
  readonly value:
    | FieldTypes
    | Record<string, FieldTypes | Record<string, FieldTypes>>
}

export const $symbol = Symbol('@jogger/field')
export function isField(arg: unknown): arg is Field {
  if (typeof arg !== 'object') return false
  if (arg === null) return false
  if ('$symbol' in arg === false) return false

  // @ts-expect-error Already known that $symbol exists
  return arg.$symbol === $symbol
}
