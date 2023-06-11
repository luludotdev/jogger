export type Primitive =
  | Primitive[]
  | bigint
  | number
  | string
  | { [key: string]: Primitive }
  | null

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type Data = { [key: string]: Primitive }

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
