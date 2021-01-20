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

/**
 * @param name Field name
 * @param value Primitive value
 */
export function field<T extends Primitive>(
  name: string,
  value: T | T[]
): Readonly<IField>
/**
 * @param name Field name
 * @param field Sub-field
 * @param fields Extra sub-fields
 */
export function field(
  name: string,
  field: Readonly<IField>,
  ...fields: ReadonlyArray<Readonly<IField>>
): Readonly<IField>
export function field(name: string, ...values: unknown[]): Readonly<IField> {
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

  throw new TypeError(`field \`${name}\` has an unsupported value type`)
}

/**
 * Create a wrapped field
 * @param name Field name
 */
export const createField = (name: string) => {
  if (!name || typeof name !== 'string') {
    throw new TypeError('`name` argument must be a non-empty string')
  }

  /**
   * @param value Primitive value
   */
  function wrappedField<T extends Primitive>(value: T | T[]): Readonly<IField>
  /**
   * @param field Sub-field
   * @param fields Extra sub-fields
   */
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
