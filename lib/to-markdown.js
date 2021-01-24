function joinText(input) {
  if (typeof input === 'string') return input;
  return input.map(text => `[${text}]`).join('');
}
function handleRuby(node) {
  const base = joinText(node.base);
  const text = joinText(node.text);
  return `{${base}}^(${text})`;
}

function peekRuby() {
  return '{';
}

handleRuby.peek = peekRuby;

module.exports = {
  unsafe: [{ character: '{', inConstruct: 'phrasing' }],
  handlers: { ruby: handleRuby },
};
