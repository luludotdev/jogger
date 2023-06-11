import type { ReadonlyDeep } from 'type-fest'
import { z } from 'zod'

const PrimitiveSchema = z
  .string()
  .or(z.number())
  .or(z.bigint())
  .or(z.boolean())
  .or(z.null())

const DeepPrimitiveSchema = PrimitiveSchema.or(
  z.record(z.string(), PrimitiveSchema),
)

export type Data = ReadonlyDeep<z.infer<typeof DataSchema>>
export const DataSchema = z.record(z.string(), DeepPrimitiveSchema)

export const serialize = (data: Data): string => {
  return JSON.stringify(data, (_, value: unknown) => {
    switch (typeof value) {
      case 'bigint':
        return `${value}n`

      default:
        return value
    }
  })
}
