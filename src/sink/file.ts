import { Mutex } from 'async-mutex'
import {
  createReadStream,
  createWriteStream,
  promises as fs,
  statSync,
} from 'fs'
import globby from 'globby'
import { join, parse, posix } from 'path'
import { createGzip } from 'zlib'
import type { ISink } from '.'

const FILE_EXT = '.log'
const GZIP_EXT = '.gz'

interface IOptions {
  /**
   * Directory to write logfiles to
   */
  directory: string

  /**
   * Prefix for log filename
   */
  name: string

  /**
   * Prefix for error log filename
   *
   * Only specify if you want to separate error logs from other logs
   */
  errorName?: string

  /**
   * Whether to include `debug` level logs.
   *
   * Defaults to `false`
   */
  debug?: boolean

  /**
   * Maximum file size in MB of the log file before it gets rotated. Set to `0` to disable rotation.
   *
   * Defaults to `100`
   */
  maxSize?: number

  /**
   * Maximum number of days to keep old log files. Set to `0` to disable age-based cleanup.
   *
   * Defaults to `0`
   */
  maxAge?: number

  /**
   * Maximum number of old log files to keep. Set to `0` to disable number-based cleanup.
   *
   * Defaults to `0`
   */
  maxBackups?: number

  /**
   * Whether to use gzip compression on rotated log files.
   *
   * Defaults to `true`
   */
  compress?: boolean
}

export const createFileSink: (
  options: IOptions
) => Readonly<ISink> = options => {
  if (typeof options.directory !== 'string' || options.directory === '') {
    throw new Error('file sink directory must be a non-empty string')
  }

  if (typeof options.name !== 'string' || options.name === '') {
    throw new Error('file sink name must be a non-empty string')
  }

  const mutex = new Mutex()
  const debug = options.debug ?? false
  const compress = options.compress ?? true

  const maxSize = options.maxSize ?? 100
  const maxAge = options.maxAge ?? 0
  const maxBackups = options.maxBackups ?? 0

  if (maxSize !== 0 && maxSize < 5) {
    throw new Error(`maxSize must be greated than 5MB or 0 to disable`)
  }

  if (maxAge < 0) {
    throw new Error('maxAge must be greater than 0')
  }

  if (maxBackups < 0) {
    throw new Error('maxBackups must be greater than 0')
  }

  const createStream = (name: string) => {
    const mode = 0o600

    const path = join(options.directory, `${name}${FILE_EXT}`)
    const stream = createWriteStream(path, { mode, flags: 'a' })
    const { size } = statSync(path)

    const _write: (buffer: Buffer) => Promise<void> = async buffer =>
      new Promise((resolve, reject) => {
        _stream.stream.write(buffer, error => {
          if (error) {
            reject(error)
          } else {
            _stream.size += buffer.byteLength
            resolve()
          }
        })
      })

    const write = async (buffer: Buffer) => {
      await _write(buffer)

      if (maxSize !== 0 && _stream.size > maxSize * 1024 ** 2) {
        _stream.stream.close()

        await roll()
        await cleanup()

        _stream.stream = createWriteStream(path, { mode })
        _stream.size = 0
      }
    }

    const roll: () => Promise<void> = async () =>
      new Promise((resolve, reject) => {
        const date = new Date()
          .toISOString()
          .replace('Z', '')
          .replace(/:/g, '-')

        let fileName = `${name}-${date}${FILE_EXT}`
        if (compress) fileName += GZIP_EXT
        const newPath = join(options.directory, fileName)

        const inStream = createReadStream(path)
        const outStream = createWriteStream(newPath, { mode })

        inStream
          .on('close', () => resolve())
          .on('error', error => reject(error))

        if (compress) {
          inStream.pipe(createGzip()).pipe(outStream)
        } else {
          inStream.pipe(outStream)
        }
      })

    const cleanup = async () => {
      const now = new Date()
      const dir = posix.normalize(options.directory.replace(/\\/g, '/'))
      const glob = posix.join(dir, `${name}-*`)
      const files = await globby(glob)

      const mapped = files
        .map(file => ({ file, ts: parseDate(file) }))
        .sort((a, b) => a.ts.getTime() - b.ts.getTime())

      const toRemove: typeof mapped = []

      if (maxBackups > 0) {
        toRemove.push(...mapped.splice(0, mapped.length - maxBackups))
      }

      if (maxAge > 0) {
        for (const log of mapped) {
          if (isNDaysOld(log.ts, now, maxAge)) {
            toRemove.push(log)
          }
        }
      }

      const jobs = toRemove.map(async ({ file }) => fs.unlink(file))
      await Promise.all(jobs)
    }

    const parseDate: (filename: string) => Date = filename => {
      const { base } = parse(filename)
      const tsString = base
        .replace(`${name}-`, '')
        .replace(FILE_EXT, '')
        .replace(GZIP_EXT, '')

      const [a, b] = tsString.split('T')
      return new Date(`${a}T${b.replace(/-/g, ':')}Z`)
    }

    void cleanup()

    const _stream = {
      path,
      stream,
      size,
      write,
    }

    return _stream
  }

  const logStream = createStream(options.name)
  const errorStream =
    options.errorName === undefined
      ? logStream
      : createStream(options.errorName)

  const log = async (line: string, error: boolean) => {
    const release = await mutex.acquire()

    try {
      const data = Buffer.from(`${line}\n`)
      const stream = error ? errorStream : logStream

      await stream.write(data)
    } finally {
      release()
    }
  }

  return Object.freeze({
    out: async line => {
      await log(line, false)
    },

    err: async line => {
      await log(line, true)
    },

    debug: async line => {
      if (debug === false) return
      await log(line, false)
    },
  })
}

const isNDaysOld: (target: Date, now: Date, days: number) => boolean = (
  target,
  now,
  days
) => {
  const millis = 1000 * 60 * 60 * 24 * days
  const x = now.getTime() - millis

  return x > target.getTime()
}
