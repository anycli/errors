/* eslint-disable no-process-exit */
/* eslint-disable unicorn/no-process-exit */
import {config} from './config'
import prettyPrint, {PrettyPrintableError} from './errors/pretty-print'
import clean = require('clean-stack')
import {OclifError, CLIError} from './errors/cli'

export const handle = (err: Error & Partial<PrettyPrintableError> & Partial<OclifError>) => {
  try {
    if (!err) err = new CLIError('no error?')
    if (err.message === 'SIGINT') process.exitCode = 1

    const shouldPrint = !(err.code === 'EEXIT')
    const pretty = prettyPrint(err)
    const stack = clean(err.stack || '', {pretty: true})

    if (shouldPrint) {
      console.error(pretty ? pretty : stack)
    }

    const exitCode = err.oclif?.exit !== undefined && err.oclif?.exit !== false ? err.oclif?.exit : 1

    if (config.errorLogger && err.code !== 'EEXIT') {
      if (stack) {
        config.errorLogger.log(stack)
      }

      config.errorLogger.flush()
      .then(() => process.exitCode = exitCode)
      .catch(console.error)
    } else process.exitCode = exitCode
  } catch (error) {
    console.error(err.stack)
    console.error(error.stack)
    process.exitCode = 1
  }
}
