function locator(value, fromIndex) {
  return value.indexOf('{', fromIndex);
}

const SYNTAX_PATTERN = /^{([^}]+)}\^\(([^)]+)\)/;

module.exports = function plugin(opts) {
  const parenthesis = opts && opts.parenthesis ? opts.parenthesis : '()';
  function inlineTokenizer(eat, value, silent) {
    const match = SYNTAX_PATTERN.exec(value);
    if (!match) return false;
    if (silent) return true;
    const text = match[1];
    const pronounciation = match[2];
    return eat(match[0])({
      type: 'ruby',
      base: text,
      text: pronounciation,
      data: {
        hName: 'ruby',
        hChildren: [
          {
            type: 'text',
            value: text,
          },
          {
            type: 'element',
            children: [
              { type: 'text', value: parenthesis[0] },
            ],
            tagName: 'rp',
          },
          {
            type: 'element',
            children: [
              { type: 'text', value: pronounciation },
            ],
            tagName: 'rt',
          },
          {
            type: 'element',
            children: [
              { type: 'text', value: parenthesis[parenthesis.length - 1] },
            ],
            tagName: 'rp',
          },
        ],
      },
    });
  }
  inlineTokenizer.locator = locator;

  // Inject inlineTokenizer
  const { inlineTokenizers, inlineMethods } = this.Parser.prototype;
  inlineTokenizers.ruby = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf('text'), 0, 'ruby');

  // Stringify for ruby inline
  if (this.Compiler != null) {
    const { visitors } = this.Compiler.prototype;
    if (!visitors) return;

    visitors.ruby = node => `{${node.base}}^(${node.text})`;
  }
};
