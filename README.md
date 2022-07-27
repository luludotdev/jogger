# 🏃 Jogger
![Node.js CI](https://github.com/lolPants/jogger/workflows/Node.js%20CI/badge.svg?branch=master)
[![NPM version](https://img.shields.io/npm/v/@lolpants/jogger.svg?maxAge=3600)](https://www.npmjs.com/package/@lolpants/jogger)
[![NPM downloads](https://img.shields.io/npm/dt/@lolpants/jogger.svg?maxAge=3600)](https://www.npmjs.com/package/@lolpants/jogger)
> Elegant JSON logging system inspired by [Zap](https://github.com/uber-go/zap)

## ⚠️ Warning
**Jogger is still in the pre-release phase.** It may not be particularly optimised, and the public API is still subject to change. Use in production at your own risk.

## 💾 Installation
Jogger is published to the NPM registry as [`@lolpants/jogger`](https://www.npmjs.com/package/@lolpants/jogger). Install it with your NPM client of choice.

## ❓ Concepts
Jogger splits the logging process up into loggers and sinks. Loggers are responsible for parsing fields and outputting formatted JSON log lines to sinks.
Sinks are responsible for sending log lines to various outputs (ie: stdout). One logger can have many sinks, and send each log line to all registered sinks. One sink can be used by many loggers. This has the advantage of allowing multiple loggers to access the same resource (eg: file descriptor) simultaneously.

Loggers only accept fields as arguments. Fields are strongly typed and can be any primitive type, an array of primitive types, or sub-fields. Field names must be unique to each object level, top level fields can not use reserved field names (`ts`, `logger`, `level`).

## 📝 Documentation
All public methods are documented using JSDoc, your IDE should provide you with enough context. Refer to the example below for a basic setup.

## 🚀 Example
Note that by default `debug` and `trace` level logs are discarded. You must manually enable them in each sink's config.

```ts
import { createConsoleSink, createLogger, field } from '@lolpants/jogger'

// Enable debug log level
const consoleSink = createConsoleSink({ debug: true })
const logger = createLogger({
  name: 'app',
  sink: [consoleSink],
})

logger.info(field('a', 'b'))
logger.warn(field('reason', 'http server down'))
logger.debug(field('object', field('x', true), field('y', false)))
```
