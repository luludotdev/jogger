type Primitive = string | number | boolean | null
export function isPrimitive(arg: unknown): arg is Primitive {
  if (typeof arg === 'string') return true
  if (typeof arg === 'number') return true
  if (typeof arg === 'boolean') return true
  if (arg === null) return true

  return false
}

type FieldTypes = Primitive | Primitive[]

const $symbol = Symbol('@jogger/field')
export interface IField {
  $symbol: symbol
  name: string
  value: FieldTypes | Record<string, FieldTypes | Record<string, FieldTypes>>
}

function isField(arg: unknown): arg is IField {
  if (typeof arg !== 'object') return false
  if (arg === null) return false
  if ('$symbol' in arg === false) return false

  // @ts-expect-error
  return arg.$symbol === $symbol
}

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
  ...fields: Array<Readonly<IField>>
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
