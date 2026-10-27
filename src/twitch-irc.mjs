export function parseIrc(line) {
  const match = /^(?:@([^ ]+) )?(?::([^ ]+) )?([A-Z0-9]+)(?: (.*))?$/.exec(line);
  if (!match) return null;
  const tags = Object.fromEntries((match[1] || '').split(';').filter(Boolean).map(tag => {
    const split = tag.indexOf('=');
    return split < 0 ? [tag, ''] : [tag.slice(0, split), tag.slice(split + 1)];
  }));
  const rest = match[4] || '';
  const split = rest.indexOf(' :');
  const params = (split < 0 ? rest : rest.slice(0, split)).split(' ').filter(Boolean);
  const trailing = split >= 0 ? rest.slice(split + 2) : rest.startsWith(':') ? rest.slice(1) : '';
  if (rest.startsWith(':')) params.length = 0;
  return { tags, prefix: match[2] || '', command: match[3], params, trailing };
}

// Read-only adapter: it never sends viewer chat or stores credentials.
// Supports both anonymous connection (no token needed for public chat) and authenticated connection.
export function connectTwitch({
  channel,
  username,
  token,
  onChat,
  onStatus = () => {},
  WebSocketImpl = globalThis.WebSocket
}) {
  if (typeof channel !== 'string' || !/^[a-z0-9_]{1,25}$/i.test(channel.trim())) {
    throw new Error('Invalid Twitch channel name');
  }
  channel = channel.trim().toLowerCase();

  const isAnonymous = !token;
  if (!isAnonymous) {
    if (typeof username !== 'string' || !/^[a-z0-9_]{1,25}$/i.test(username.trim()) ||
        typeof token !== 'string' || !/^(?:oauth:)?[a-z0-9]+$/i.test(token.trim())) {
      throw new Error('Invalid Twitch connection settings');
    }
    username = username.trim().toLowerCase();
    token = token.trim();
  } else {
    username = (username && /^[a-z0-9_]{1,25}$/i.test(username.trim()))
      ? username.trim().toLowerCase()
      : `justinfan${Math.floor(10000 + Math.random() * 90000)}`;
    token = 'SCHMOOPIE';
  }

  if (typeof onChat !== 'function' || !WebSocketImpl) {
    throw new Error('Invalid Twitch connection settings');
  }

  let stopped = false, socket, retry, timeout, attempt = 0;
  function open() {
    if (stopped) return;
    onStatus('connecting');
    const ws = socket = new WebSocketImpl('wss://irc-ws.chat.twitch.tv:443');
    let buffer = '';
    timeout = setTimeout(() => ws.close(), 15000);
    ws.onopen = () => {
      if (stopped || ws !== socket) return;
      ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands\r\n');
      if (isAnonymous) {
        ws.send(`PASS ${token}\r\n`);
      } else {
        ws.send(`PASS oauth:${token.replace(/^oauth:/i, '')}\r\n`);
      }
      ws.send(`NICK ${username}\r\n`);
      ws.send(`JOIN #${channel}\r\n`);
    };
    ws.onmessage = ({ data }) => {
      if (stopped || ws !== socket || typeof data !== 'string') return;
      buffer += data;
      if (buffer.length > 65536) { ws.close(); return; }
      let end;
      while ((end = buffer.indexOf('\r\n')) >= 0) {
        const message = parseIrc(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (!message) continue;
        if (message.command === 'PING') ws.send(`PONG :${message.trailing || message.params.join(' ')}\r\n`);
        if (message.command === 'RECONNECT') { ws.close(); return; }
        if (message.command === 'NOTICE' || ['464', '465', '403', '474'].includes(message.command)) {
          stopped = true;
          clearTimeout(timeout);
          onStatus('rejected', message.trailing || message.command);
          ws.close();
          return;
        }
        if ((message.command === 'ROOMSTATE' && message.params[0] === `#${channel}`) ||
            (message.command === '366' && message.params[1] === `#${channel}`)) {
          clearTimeout(timeout);
          attempt = 0;
          onStatus('connected');
        }
        if (message.command === 'PRIVMSG' && message.params[0] === `#${channel}`) {
          onChat({ user: message.prefix.split('!')[0], text: message.trailing, id: message.tags.id });
        }
      }
    };
    ws.onerror = () => ws.close();
    ws.onclose = () => {
      clearTimeout(timeout);
      if (stopped || ws !== socket) return;
      if (++attempt > 6) { stopped = true; onStatus('disconnected', 'Max reconnect attempts reached'); return; }
      onStatus('reconnecting', `Attempt ${attempt}`);
      retry = setTimeout(open, Math.min(30000, 1000 * 2 ** (attempt - 1)) + Math.random() * 500);
    };
  }
  open();
  return () => {
    stopped = true;
    clearTimeout(retry);
    clearTimeout(timeout);
    socket?.close();
    onStatus('disconnected');
  };
}
