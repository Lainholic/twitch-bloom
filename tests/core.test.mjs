import test from 'node:test';
import assert from 'node:assert/strict';
import { createGarden, parseCommand, flowerTraits } from '../src/garden.mjs';
import { parseIrc, connectTwitch } from '../src/twitch-irc.mjs';
import { createDemoSimulation } from '../src/demo-sim.mjs';

test('commands must match the whole message', () => {
  assert.equal(parseCommand(' !PLANT '), 'plant');
  for (const text of ['hello !plant', '!plant spam', '!waterfall', '', null]) assert.equal(parseCommand(text), null);
});
test('plant, three water actions, then bloom; cooldown is shared', () => {
  const garden = createGarden();
  const act = (text, now) => garden.apply({ user: 'Viewer', text }, now);
  assert.equal(act('!water', 0).reason, 'plant-first');
  assert.equal(act('!plant', 0).accepted, true);
  assert.equal(act('!bloom', 100).reason, 'cooldown');
  assert.equal(act('!bloom', 3000).reason, 'water-first');
  for (const now of [3000, 6000, 9000]) assert.equal(act('!water', now).accepted, true);
  assert.equal(act('!bloom', 12000).accepted, true);
  assert.equal(act('!bloom', 15000).reason, 'already-blooming');
  assert.equal(act('!water', 15000).reason, 'fully-grown');
  assert.equal(garden.snapshot()[0].blooming, true);
});
test('capacity, deduplication, ownership and detached snapshots', () => {
  const garden = createGarden({ capacity: 1 });
  garden.apply({ user: 'a', text: '!plant', id: '1' }, 0);
  assert.equal(garden.apply({ user: 'a', text: '!water', id: '1' }, 3000).reason, 'duplicate');
  assert.equal(garden.apply({ user: 'b', text: '!plant' }, 3000).reason, 'full');
  const copy = garden.snapshot(); copy[0].traits.hue = -1;
  assert.notEqual(garden.snapshot()[0].traits.hue, -1);
  assert.deepEqual(flowerTraits('a'), flowerTraits('a'));
  assert.equal(garden.apply({ user: 'a\r\n', text: '!plant' }).reason, 'invalid');
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
  assert.equal(garden.apply({ user: 'viewer1', text: '!clean' }, 0).reason, 'no-trash');
  
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

  // Clean
  const cleanRes = garden.apply({ user: 'viewer1', text: '!clean' }, 2000);
  assert.equal(cleanRes.accepted, true);
  assert.equal(garden.getTrash().length, 1);
  assert.equal(garden.getStats().totalCleaned, 1);
});

test('autoPlant option allows !water directly to germinate sprout', () => {
  const garden = createGarden({ autoPlant: true });
  const res = garden.apply({ user: 'grower', text: '!water' }, 0);
  assert.equal(res.accepted, true);
  assert.equal(res.autoPlanted, true);
  assert.equal(garden.snapshot()[0].growth, 1);
  assert.equal(garden.getStats().totalWatered, 1);
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
  assert.equal(events[0].text, '!water');

  sim.stop();
  assert.equal(sim.isRunning(), false);
  const countAfterStop = events.length;

  // Ensure no more events fire after stop
  await new Promise(r => setTimeout(r, 700));
  assert.equal(events.length, countAfterStop);
});


