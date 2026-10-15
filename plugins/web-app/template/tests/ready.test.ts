import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ready } from '../src/lib/ready.ts'

test('ready reports the server state', () => {
  assert.equal(ready(true), 'ready')
  assert.equal(ready(false), 'not ready')
})
