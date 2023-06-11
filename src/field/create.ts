import { $symbol, isField } from './field.js'
import type { Field } from './field.js'
import { isPrimitive } from './primitive.js'
import type { Primitive } from './primitive.js'

function isArrayOf<T>(arg: unknown[], fn: (x: unknown) => x is T): arg is T[] {
  for (const x of arg) {
    if (fn(x) === false) return false
  }

  return true
}

/**
 * @param name - Field name
 * @param value - Primitive value
 */
export function field<T extends Primitive>(name: string, value: T | T[]): Field
/**
 * @param name - Field name
 * @param fields - Fields
 */
export function field(
  name: string,
  ...fields: readonly [Field, ...(readonly Field[])]
): Field
export function field(name: string, ...values: unknown[]): Field {
  if (!name || typeof name !== 'string') {
    throw new TypeError('`name` argument must be a non-empty string')
  }

  const value = values[0]
  if (values.length === 1 && isPrimitive(value)) {
    return Object.freeze({ $symbol, name, value })
  }

  if (values.length === 1 && Array.isArray(value)) {
    return Object.freeze({ $symbol, name, value })
  }

  if (isArrayOf(values, isField)) {
    type FieldEntry = [name: Field['name'], value: Field['value']]
    const entries: FieldEntry[] = values.map(({ name, value }) => [name, value])

    const fields = Object.fromEntries(entries) as Field['value']
    return Object.freeze({ $symbol, name, value: fields })
  }

  throw new TypeError(`field \`${name}\` has an unsupported value type`)
}

/**
 * Create a wrapped field
 *
 * @param name - Field name
 */
export const createField = (name: string) => {
  if (!name || typeof name !== 'string') {
    throw new TypeError('`name` argument must be a non-empty string')
  }

  /**
   * @param value - Primitive value
   */
  function wrappedField<T extends Primitive>(value: T | T[]): Field
  /**
   * @param fields - Fields
   */
  function wrappedField(
    ...fields: readonly [Field, ...(readonly Field[])]
  ): Field
  function wrappedField(...values: unknown[]): Field {
    // @ts-expect-error Passthrough values to field()
    return field(name, ...values)
  }

  return wrappedField
}
