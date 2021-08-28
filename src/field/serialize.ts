import type { Field } from './field.js'

export const serializeFields: (
  ...fields: ReadonlyArray<Readonly<Field>>
) => string = (...fields) => {
  const object: Record<string, any> = {}
  for (const field of fields) {
    if (field.name in object) {
      throw new Error(`duplicate field name: \`${field.name}\``)
    }

    object[field.name] = field.value
  }

  return JSON.stringify(object)
}
