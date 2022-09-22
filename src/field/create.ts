import { $symbol, type Field, isField } from './field.js'
import { isPrimitive, type Primitive } from './primitive.js'

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
export function field<T extends Primitive>(
  name: string,
  value: T | T[],
): Readonly<Field>
/**
 * @param name - Field name
 * @param fields - Fields
 */
export function field(
  name: string,
  ...fields: readonly [Readonly<Field>, ...(readonly Readonly<Field>[])]
): Readonly<Field>
export function field(name: string, ...values: unknown[]): Readonly<Field> {
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
  function wrappedField<T extends Primitive>(value: T | T[]): Readonly<Field>
  /**
   * @param fields - Fields
   */
  function wrappedField(
    ...fields: readonly [Readonly<Field>, ...(readonly Readonly<Field>[])]
  ): Readonly<Field>
  function wrappedField(...values: unknown[]): Readonly<Field> {
    // @ts-expect-error Passthrough values to field()
    return field(name, ...values)
  }

  return wrappedField
}
