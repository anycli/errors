import {expect, fancy} from 'fancy-test'
import * as fs from 'fs-extra'
import * as path from 'path'

import {CLIError, config, ExitError} from '../src'
import {handle} from '../src/handle'

const errlog = path.join(__dirname, '../tmp/mytest/error.log')
const x = process.platform === 'win32' ? '»' : '›'

const exit = process.exit

describe('handle', () => {
  beforeEach(() => {
    (process as any).exit = (code: any) => {
      process.exitCode = code
    }
  })
  afterEach(() => {
    (process as any).exit = exit
  })

  fancy
  .stderr()
  .finally(() => delete process.exitCode)
  .it('displays an error from root handle module', ctx => {
    require('../handle')(new Error('x'))
    expect(ctx.stderr).to.contain('Error: x')
    expect(process.exitCode).to.equal(1)
  })

  fancy
  .stderr()
  .finally(() => delete process.exitCode)
  .it('shows an unhandled error', ctx => {
    handle(new Error('x'))
    expect(ctx.stderr).to.contain('Error: x')
    expect(process.exitCode).to.equal(1)
  })

  fancy
  .stderr()
  .finally(() => delete process.exitCode)
  .it('handles a badly formed error object', () => {
    handle({status: 400})
    expect(process.exitCode).to.equal(1)
  })

  fancy
  .stderr()
  .finally(() => delete process.exitCode)
  .it('shows a cli error', ctx => {
    handle(new CLIError('x'))
    expect(ctx.stderr).to.equal(` ${x}   Error: x\n`)
    expect(process.exitCode).to.equal(2)
  })

  fancy
  .stdout()
  .stderr()
  .finally(() => delete process.exitCode)
  .it('hides an exit error', ctx => {
    handle(new ExitError())
    expect(ctx.stdout).to.equal('')
    expect(ctx.stderr).to.equal('')
    expect(process.exitCode).to.equal(0)
  })

  fancy
  .stderr()
  .do(() => {
    config.errlog = errlog
  })
  .finally(() => {
    config.errlog = undefined
  })
  .finally(() => delete process.exitCode)
  .it('logs when errlog is set', async ctx => {
    handle(new CLIError('uh oh!'))
    expect(ctx.stderr).to.equal(` ${x}   Error: uh oh!\n`)
    await config.errorLogger!.flush()
    expect(fs.readFileSync(errlog, 'utf8')).to.contain('Error: uh oh!')
    expect(process.exitCode).to.equal(2)
  })
})
