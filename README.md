# 🏃 Jogger

![Node.js CI](https://github.com/luludotdev/jogger/workflows/Node.js%20CI/badge.svg?branch=master)
[![NPM version](https://img.shields.io/npm/v/@luludev/jogger.svg?maxAge=3600)](https://www.npmjs.com/package/@luludev/jogger)
[![NPM downloads](https://img.shields.io/npm/dt/@luludev/jogger.svg?maxAge=3600)](https://www.npmjs.com/package/@luludev/jogger)

> Elegant JSON logging system

## ⚠️ Warning

**Jogger is still in the pre-release phase.** It may not be particularly optimised, and the public API is still subject to change. Use in production at your own risk.

## 💾 Installation

Jogger is published to the NPM registry as [`@luludev/jogger`](https://www.npmjs.com/package/@luludev/jogger). Install it with your NPM client of choice.

## ❓ Concepts

Jogger splits the logging process up into loggers and sinks. Loggers are responsible for parsing fields and outputting formatted JSON log lines to sinks.
Sinks are responsible for sending log lines to various outputs (ie: stdout). One logger can have many sinks, and send each log line to all registered sinks. One sink can be used by many loggers. This has the advantage of allowing multiple loggers to access the same resource (eg: file descriptor) simultaneously.

## 📝 Documentation

All public methods are documented using JSDoc, your IDE should provide you with enough context. Refer to the example below for a basic setup.

## 🚀 Example

Note that by default `debug` and `trace` level logs are discarded. You must manually enable them in each sink's config.

```ts
import { createConsoleSink, createLogger, field } from '@luludev/jogger'

// Enable debug log level
const consoleSink = createConsoleSink({ debug: true })
const logger = createLogger({
  name: 'app',
  sink: [consoleSink],
})

logger.info({ a: 'b' })
logger.warn({ reason: 'http server down' })
logger.debug({ deep: { x: true, y: false } })
```
