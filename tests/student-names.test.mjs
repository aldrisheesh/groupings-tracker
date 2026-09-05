import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStudentName } from '../src/utils/studentNames.ts';

test('either complete given name resolves to the full enrolled name', () => {
  const students = [{ name: 'Santos, Roi Aldrich' }];
  for (const input of ['Santos, Roi', 'Santos, Aldrich', 'Santos, Roi Aldrich', ' santos ,  ALDRICH ']) {
    assert.equal(resolveStudentName(input, students), students[0]);
  }
  for (const input of ['Santos, Ald', 'Santo, Roi', 'Santos,', 'Roi Aldrich', 'Santos, Roi Unknown']) {
    assert.equal(resolveStudentName(input, students), undefined);
  }
});

test('ambiguous shortened names are rejected and full matches take priority', () => {
  const students = [{ name: 'Santos, Roi Aldrich' }, { name: 'Santos, Roi Miguel' }];
  assert.equal(resolveStudentName('Santos, Roi', students), undefined);
  assert.equal(resolveStudentName('Santos, Aldrich', students), students[0]);
  assert.equal(resolveStudentName('Santos, Roi Miguel', students), students[1]);
  const exact = { name: 'Santos, Roi' };
  assert.equal(resolveStudentName('Santos, Roi', [...students, exact]), exact);
  assert.equal(resolveStudentName('Santos, Roi', [exact, { ...exact }]), undefined);
});
