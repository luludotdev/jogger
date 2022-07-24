import { Mutex } from 'async-mutex'
import { globby } from 'globby'
import mkdirp from 'mkdirp'
import { Buffer } from 'node:buffer'
import { createReadStream, createWriteStream, statSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { join, parse, posix } from 'node:path'
import { createGzip } from 'node:zlib'
import { type Sink } from './sink.js'

const FILE_EXT = '.log'
const GZIP_EXT = '.gz'

interface Options {
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
   * File permissions to write files as.
   *
   * Defaults to `0o644`
   */
  permissions?: number

  /**
   * Directory permissions to create as (if required).
   *
   * Defaults to `0o755`
   */
  dirPermissions?: number

  /**
   * Whether to include `debug` level logs.
   *
   * Defaults to `false`
   */
  debug?: boolean

  /**
   * Whether to include `trace` level logs.
   *
   * Defaults to `false`
   */
  trace?: boolean

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
   * Roll logfiles on each new day. Note that days are always counted using UTC.
   *
   * Defaults to `false
   */
  rollEveryDay?: boolean

  /**
   * Roll old logfiles on application launch.
   *
   * Defaults to `false`
   */
  rollOnLaunch?: boolean

  /**
   * Whether to use gzip compression on rotated log files.
   * If a number is passed that will set the gzip compression level,
   * otherwise defaults to whatever Node.js has configured as default.
   *
   * Defaults to `true`
   */
  compress?: boolean | number
}

interface FileSink {
  /**
   * Roll logfiles manually.
   * @param file File stream. If error logs are sent to the same file then `err` means the same as `out`.
   */
  roll: (file?: 'out' | 'err') => Promise<void>

  /**
   * Flush all pending writes.
   */
  flush: () => Promise<void>
}

/**
 * Create a new File Sink
 * @param options Sink Options
 */
export const createFileSink: (options: Options) => Readonly<Sink & FileSink> =
  // eslint-disable-next-line complexity
  options => {
    if (!options) {
      throw new Error('missing options parameter')
    }

    if (typeof options.directory !== 'string' || options.directory === '') {
      throw new TypeError('file sink directory must be a non-empty string')
    }

    const dirMode = options.dirPermissions ?? 0o755
    mkdirp.sync(options.directory, { mode: dirMode })

    if (typeof options.name !== 'string' || options.name === '') {
      throw new TypeError('file sink name must be a non-empty string')
    }

    const mutex = new Mutex()
    const debug = options.debug ?? false
    const trace = options.trace ?? false
    const compress = options.compress ?? true

    const maxSize = options.maxSize ?? 100
    const maxAge = options.maxAge ?? 0
    const maxBackups = options.maxBackups ?? 0

    const rollEveryDay = options.rollEveryDay ?? false
    const rollOnLaunch = options.rollOnLaunch ?? false

    if (typeof compress === 'number') {
      if (Number.isInteger(compress) === false) {
        throw new TypeError('compress must be an integer')
      }

      if (compress < 1 || compress > 9) {
        throw new Error('compress must be between 1 and 9')
      }
    }

    if (maxSize !== 0 && maxSize < 5) {
      throw new Error(`maxSize must be greater than 5MB (or 0 to disable)`)
    }

    if (maxAge < 0) {
      throw new Error('maxAge must be greater than 0')
    }

    if (maxBackups < 0) {
      throw new Error('maxBackups must be greater than 0')
    }

    const createStream = (name: string) => {
      const fileSize = () => {
        try {
          const { size } = statSync(path)
          return size
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            error.message.includes('no such file or directory')
          ) {
            return 0
          }

          throw error
        }
      }

      const mode = options.permissions ?? 0o644
      const path = join(options.directory, `${name}${FILE_EXT}`)
      const stream = createWriteStream(path, { mode, flags: 'a' })
      const size = fileSize()

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

        const previousLog = _stream.lastLog
        _stream.lastLog = new Date()

        const rollSize = maxSize !== 0 && _stream.size > maxSize * 1024 ** 2
        const rollDay =
          rollEveryDay &&
          previousLog.getUTCDate() !== _stream.lastLog.getUTCDate()

        if (rollSize || rollDay) await roll()
      }

      const roll = async () => {
        _stream.stream.close()

        await _roll()
        await cleanup()

        _stream.stream = createWriteStream(path, { mode })
        _stream.size = 0
      }

      const _roll: () => Promise<void> = async () =>
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
            const level = typeof compress === 'number' ? compress : undefined
            inStream.pipe(createGzip({ level })).pipe(outStream)
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

        const jobs = toRemove.map(async ({ file }) => unlink(file))
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

      const init = async () => {
        const release = await mutex.acquire()
        try {
          if (rollOnLaunch) await roll()
          await cleanup()
        } finally {
          release()
        }
      }

      void init()

      const _stream = {
        path,
        stream,
        size,
        write,
        roll,

        lastLog: new Date(),
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

    const sink: Sink & FileSink = {
      async out(line) {
        await log(line, false)
      },

      async err(line) {
        await log(line, true)
      },

      async debug(line) {
        if (debug === false) return
        await log(line, false)
      },

      async trace(line) {
        if (trace === false) return
        await log(line, false)
      },

      async roll(file = 'out') {
        const release = await mutex.acquire()
        try {
          const stream = file === 'err' ? errorStream : logStream
          await stream.roll()
        } finally {
          release()
        }
      },

      async flush() {
        const release = await mutex.acquire()
        release()
      },
    }

    return Object.freeze(sink)
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
