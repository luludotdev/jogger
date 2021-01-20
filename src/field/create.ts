import { $symbol, isField } from './field'
import type { FieldTypes, IField } from './field'
import { isPrimitive } from './primitive'
import type { Primitive } from './primitive'

function isArrayOf<T>(arg: unknown[], fn: (x: unknown) => x is T): arg is T[] {
  for (const x of arg) {
    if (fn(x) === false) return false
  }

  return true
}

export function field<T extends Primitive>(
  name: string,
  value: T | T[]
): Readonly<IField>
export function field(
  name: string,
  field: Readonly<IField>,
  ...fields: ReadonlyArray<Readonly<IField>>
): Readonly<IField>
export function field(name: string, ...values: unknown[]): Readonly<IField> {
  const value = values[0]

  if (values.length === 1 && isPrimitive(value)) {
    return Object.freeze({ $symbol, name, value })
  }

  if (values.length === 1 && Array.isArray(value)) {
    return Object.freeze({ $symbol, name, value })
  }

  if (isArrayOf(values, isField)) {
    // eslint-disable-next-line unicorn/no-array-reduce
    const fields = values.reduce<
      Record<string, FieldTypes | Record<string, FieldTypes>>
    >((acc, curr) => {
      // @ts-expect-error
      acc[curr.name] = curr.value
      return acc
    }, {})

    return Object.freeze({ $symbol, name, value: fields })
  }

  throw new Error(`field \`${name}\` has an unsupported value type`)
}

export const createField = (name: string) => {
  function wrappedField<T extends Primitive>(value: T | T[]): Readonly<IField>
  function wrappedField(
    field: Readonly<IField>,
    ...fields: Array<Readonly<IField>>
  ): Readonly<IField>
  function wrappedField(...values: unknown[]): Readonly<IField> {
    // @ts-expect-error
    return field(name, ...values)
  }

  return wrappedField
}
