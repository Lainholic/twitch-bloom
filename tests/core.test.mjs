import test from 'node:test';
import assert from 'node:assert/strict';
import { createGarden, parseCommand, flowerTraits } from '../src/garden.mjs';
import { parseIrc, connectTwitch } from '../src/twitch-irc.mjs';
import { createDemoSimulation } from '../src/demo-sim.mjs';

test('commands must match valid keywords and aliases', () => {
  assert.equal(parseCommand(' !PLANT '), 'water');
  assert.equal(parseCommand(' !물 '), 'water');
  assert.equal(parseCommand(' !water '), 'water');
  assert.equal(parseCommand(' !햇빛 '), 'sun');
  assert.equal(parseCommand(' !sun '), 'sun');
  assert.equal(parseCommand(' !bloom '), 'sun');
  assert.equal(parseCommand(' !쓰레기 '), 'trash');
  assert.equal(parseCommand(' !trash '), 'trash');
  assert.equal(parseCommand(' !물약 '), 'trash');
  assert.equal(parseCommand(' !potion '), 'trash');
  assert.equal(parseCommand(' !청소 '), 'clean');
  assert.equal(parseCommand(' !clean '), 'clean');
  assert.equal(parseCommand(' ㅋㅋㅋㅋㅋ '), 'laugh');
  assert.equal(parseCommand(' lol '), 'laugh');
  for (const text of ['hello !plant', '!waterfall', '', null]) {
    assert.equal(parseCommand(text), null);
  }
});
test('water grows flower, sun blooms flower; cooldown is tracked', () => {
  const garden = createGarden({ cooldownMs: 1500 });
  const act = (text, now) => garden.apply({ user: 'Viewer', text }, now);

  // First water germinates the sprout
  const res1 = act('!물', 0);
  assert.equal(res1.accepted, true);
  assert.equal(res1.isNew, true);
  assert.equal(res1.flower.growth, 0);

  // Cooldown rejects rapid input
  assert.equal(act('!햇빛', 500).reason, 'cooldown');

  // Next water grows flower
  assert.equal(act('!water', 2000).accepted, true);
  assert.equal(garden.snapshot()[0].growth, 1);

  // Sun blooms the flower
  assert.equal(act('!sun', 4000).accepted, true);
  assert.equal(garden.snapshot()[0].blooming, true);

  // Water grows it to maximum stage (stage 3)
  assert.equal(act('!water', 6000).accepted, true);
  assert.equal(act('!water', 8000).accepted, true);
  assert.equal(garden.snapshot()[0].growth, 3);
});
test('capacity, deduplication, ownership and detached snapshots', () => {
  const garden = createGarden({ capacity: 1, cooldownMs: 1500 });
  const r1 = garden.apply({ user: 'a', text: '!water', id: '1' }, 0);
  assert.equal(r1.accepted, true);

  // Duplicate ID rejected
  assert.equal(garden.apply({ user: 'a', text: '!water', id: '1' }, 3000).reason, 'duplicate');

  // Capacity full evicts oldest flower (FIFO)
  const r2 = garden.apply({ user: 'b', text: '!water' }, 3000);
  assert.equal(r2.accepted, true);
  const snap = garden.snapshot();
  assert.equal(snap.length, 1);
  assert.equal(snap[0].owner, 'b');

  // Snapshot immutability
  const copy = garden.snapshot();
  copy[0].traits.hue = -1;
  assert.notEqual(garden.snapshot()[0].traits.hue, -1);

  // Traits deterministic per username
  assert.deepEqual(flowerTraits('a'), flowerTraits('a'));

  // Invalid user rejected
  assert.equal(garden.apply({ user: 'a\r\n', text: '!water' }).reason, 'invalid');
});
test('IRC parses tags, prefixes, colon text and keepalive', () => {
  const message = parseIrc('@id=abc;display-name=Viewer :viewer!viewer@host PRIVMSG #garden :!plant');
  assert.equal(message.tags.id, 'abc');
  assert.equal(message.trailing, '!plant');
  assert.equal(parseIrc('PING :tmi.twitch.tv').trailing, 'tmi.twitch.tv');
  assert.equal(parseIrc(':a!a@host PRIVMSG #garden :hello : there').trailing, 'hello : there');
  assert.equal(parseIrc('garbage'), null);
});
test('adapter handles split/multiple IRC lines, channel filtering and shutdown', () => {
  let ws;
  class FakeSocket {
    sent = [];
    constructor() { ws = this; }
    send(text) { this.sent.push(text); }
    close() { this.onclose?.(); }
  }
  const chats = [], statuses = [];
  const stop = connectTwitch({ channel: 'garden', username: 'bot', token: 'testtoken',
    WebSocketImpl: FakeSocket, onChat: event => chats.push(event), onStatus: s => statuses.push(s) });
  try {
    ws.onopen();
    assert.match(ws.sent[1], /^PASS oauth:/);
    assert.equal(statuses.includes('connected'), false);
    ws.onmessage({ data: 'PING :tmi.twitch.tv\r\n:server 366 bot #garden :End\r\n@id=1 :a!a@host PRIVMSG #garden :!pl' });
    assert.equal(statuses.at(-1), 'connected');
    ws.onmessage({ data: 'ant\r\n:a!a@host PRIVMSG #other :!plant\r\n' });
    assert.deepEqual(chats, [{ user: 'a', text: '!plant', id: '1' }]);
    assert.ok(ws.sent.includes('PONG :tmi.twitch.tv\r\n'));
    assert.throws(() => connectTwitch({ channel: 'a\r\nJOIN #bad', username: 'bot', token: 'x', onChat() {} }));
  } finally { stop(); }
  assert.equal(statuses.at(-1), 'disconnected');
});
test('authentication rejection stops reconnecting', () => {
  let ws;
  class FakeSocket {
    constructor() { ws = this; }
    close() { this.onclose?.(); }
  }
  const statuses = [];
  const stop = connectTwitch({ channel: 'garden', username: 'bot', token: 'bad',
    WebSocketImpl: FakeSocket, onChat() {}, onStatus: s => statuses.push(s) });
  ws.onmessage({ data: ':server NOTICE * :Login authentication failed\r\n' });
  assert.equal(statuses.at(-1), 'rejected');
  assert.equal(statuses.includes('reconnecting'), false);
  stop();
});

test('trash and clean actions modify junkyard state and accumulate stats', () => {
  const garden = createGarden({ trashCapacity: 2, cooldownMs: 1000 });

  // Clean with empty junkyard accepts cleanly with 0 cleaned
  const emptyClean = garden.apply({ user: 'viewer1', text: '!clean' }, 0);
  assert.equal(emptyClean.accepted, true);
  assert.equal(emptyClean.cleanedCount, 0);

  const res1 = garden.apply({ user: 'viewer1', text: '!trash' }, 0);
  assert.equal(res1.accepted, true);
  assert.equal(garden.getTrash().length, 1);
  assert.equal(garden.getStats().totalTrash, 1);

  // Cooldown check for viewer1
  assert.equal(garden.apply({ user: 'viewer1', text: '!trash' }, 500).reason, 'cooldown');

  // Another user can trash
  const res2 = garden.apply({ user: 'viewer2', text: '!trash' }, 500);
  assert.equal(res2.accepted, true);
  assert.equal(garden.getTrash().length, 2);

  // Exceeding capacity evicts oldest
  const res3 = garden.apply({ user: 'viewer3', text: '!trash' }, 1000);
  assert.equal(res3.accepted, true);
  assert.equal(garden.getTrash().length, 2);
  assert.equal(garden.getStats().totalTrash, 3);

  // Clean sweeps items away
  const cleanRes = garden.apply({ user: 'viewer1', text: '!clean' }, 2000);
  assert.equal(cleanRes.accepted, true);
  assert.ok(cleanRes.cleanedCount >= 1);
  assert.ok(garden.getStats().totalCleaned >= 1);
});

test('potion and fertilizer drop as random trash items', () => {
  const garden = createGarden({ cooldownMs: 0 });
  const resPotion = garden.apply({ user: 'alchemist', text: '!물약' }, 0);
  assert.equal(resPotion.accepted, true);
  assert.equal(resPotion.command, 'trash');
  assert.ok(['pizza', 'can', 'banana', 'fishbone', 'paper', 'mushroom', 'potion'].includes(resPotion.trash.type));
  assert.equal(garden.getTrash().length, 1);

  const resFertilizer = garden.apply({ user: 'farmer', text: '!비료' }, 100);
  assert.equal(resFertilizer.accepted, true);
  assert.equal(resFertilizer.command, 'trash');
  assert.ok(['pizza', 'can', 'banana', 'fishbone', 'paper', 'mushroom', 'potion'].includes(resFertilizer.trash.type));
  assert.equal(garden.getTrash().length, 2);
});

test('adapter connects anonymously when no token is provided', () => {
  let ws;
  class FakeSocket {
    sent = [];
    constructor() { ws = this; }
    send(text) { this.sent.push(text); }
    close() { this.onclose?.(); }
  }
  const stop = connectTwitch({
    channel: 'streamer_channel',
    WebSocketImpl: FakeSocket,
    onChat() {}
  });
  try {
    ws.onopen();
    assert.match(ws.sent[1], /^PASS SCHMOOPIE/);
    assert.match(ws.sent[2], /^NICK justinfan/);
    assert.equal(ws.sent[3], 'JOIN #streamer_channel\r\n');
  } finally {
    stop();
  }
});

test('demo simulation dispatches scripted events and stops cleanly', async () => {
  const events = [];
  let shownCard = false;
  const fakeCard = { isVisible: () => shownCard, show: () => { shownCard = true; } };

  const sim = createDemoSimulation({
    handleEvent: (e) => events.push(e),
    summaryCard: fakeCard,
    onStep: () => {}
  });

  assert.equal(sim.isRunning(), false);
  sim.start();
  assert.equal(sim.isRunning(), true);

  // Wait 400ms for first step to trigger
  await new Promise(r => setTimeout(r, 450));
  assert.ok(events.length >= 1);
  assert.equal(events[0].user, 'green_thumb');
  assert.equal(events[0].text, '!물');

  sim.stop();
  assert.equal(sim.isRunning(), false);
  const countAfterStop = events.length;

  // Ensure no more events fire after stop
  await new Promise(r => setTimeout(r, 700));
  assert.equal(events.length, countAfterStop);
});
test('crowd control: laughter throttling and per-user cooldown prevent screen clutter', () => {
  const garden = createGarden({ laughCooldownMs: 1500 });

  // First laugh from user1 emits visual effect
  const r1 = garden.apply({ user: 'viewer1', text: 'ㅋㅋㅋㅋㅋ' }, 0);
  assert.equal(r1.accepted, true);
  assert.equal(r1.emitEffect, true);

  // Immediate spam from user1 is blocked by per-user cooldown
  const r2 = garden.apply({ user: 'viewer1', text: 'ㅋㅋㅋㅋㅋ' }, 500);
  assert.equal(r2.accepted, false);
  assert.equal(r2.reason, 'cooldown');

  // Another user laughs within 1000ms: accepted for tally, but visual effect throttled to prevent chaos
  const r3 = garden.apply({ user: 'viewer2', text: 'lol' }, 600);
  assert.equal(r3.accepted, true);
  assert.equal(r3.emitEffect, false);

  // After 1000ms window, next laugh from another user emits visual effect again
  const r4 = garden.apply({ user: 'viewer3', text: 'lmao' }, 1100);
  assert.equal(r4.accepted, true);
  assert.equal(r4.emitEffect, true);
});

test('memory capping: userActions respects MAX_USERS cap under high traffic', () => {
  const garden = createGarden({ cooldownMs: 0 });

  // Simulate 520 distinct users chatting
  for (let i = 0; i < 520; i++) {
    garden.apply({ user: `user_${i}`, text: '!물' }, i * 10);
  }

  // userActions map must not grow unbounded (capped at 500)
  assert.ok(garden.snapshot().stats.userCount <= 500);

  // topUsers returned from getStats() is a safe shallow copy
  const stats = garden.getStats();
  const top1 = stats.topUsers[0];
  top1.total = -999;
  assert.notEqual(garden.getStats().topUsers[0].total, -999);
});



