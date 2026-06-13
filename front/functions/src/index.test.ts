import assert from 'node:assert/strict';
import test from 'node:test';
import {
  eligibleMentions,
  extractMentions,
  newMentions,
  notificationId
} from './index';

test('extracts unique portable UID mentions', () => {
  assert.deepEqual(
    [...extractMentions('Hello @first-user, @second_user and @first-user.')],
    ['first-user', 'second_user']
  );
});

test('returns only newly introduced mentions', () => {
  assert.deepEqual(
    newMentions('Existing @first-user', 'Existing @first-user and new @second-user'),
    ['second-user']
  );
  assert.deepEqual(newMentions('Removed @first-user', 'No mention'), []);
  assert.deepEqual(newMentions('No mention', 'Reintroduced @first-user'), ['first-user']);
});

test('uses versioned deterministic notification IDs', () => {
  const first = notificationId('project', 'Index.md', 2, 'recipient');
  assert.equal(first, notificationId('project', 'Index.md', 2, 'recipient'));
  assert.notEqual(first, notificationId('project', 'Index.md', 3, 'recipient'));
});

test('filters invalid members and self-mentions while retaining multiple recipients', () => {
  assert.deepEqual(
    eligibleMentions(
      '',
      '@actor @member-one @outsider @member-two',
      'actor',
      ['actor', 'member-one', 'member-two']
    ),
    ['member-one', 'member-two']
  );
});

test('does not notify unchanged mentions and allows a removed mention to be reintroduced', () => {
  assert.deepEqual(
    eligibleMentions('@member-one', '@member-one', 'actor', ['member-one']),
    []
  );
  assert.deepEqual(
    eligibleMentions('Mention removed.', 'Mention restored @member-one', 'actor', ['member-one']),
    ['member-one']
  );
});
