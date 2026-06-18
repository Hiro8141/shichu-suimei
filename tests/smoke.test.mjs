import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';

test('lunar-javascript が Solar を提供する', () => {
  const { Solar } = pkg;
  assert.equal(typeof Solar.fromYmdHms, 'function');
});
