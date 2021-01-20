import { Primitive } from './primitive'

export type FieldTypes = Primitive | Primitive[]
export interface IField {
  $symbol: symbol
  name: string
  value: FieldTypes | Record<string, FieldTypes | Record<string, FieldTypes>>
}

export const $symbol = Symbol('@jogger/field')
export function isField(arg: unknown): arg is IField {
  if (typeof arg !== 'object') return false
  if (arg === null) return false
  if ('$symbol' in arg === false) return false

  // @ts-expect-error
  return arg.$symbol === $symbol
}
