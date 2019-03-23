function locator(value, fromIndex) {
  return value.indexOf('{', fromIndex);
}

const SYNTAX_PATTERN = /^{([^}]+)}\^\(([^)]+)\)/;
const GROUP_PATTERN = /\[[^\]]+\]/;

function delimitText(input) {
  let text = input;
  const ret = [];
  let match = GROUP_PATTERN.exec(text);
  if (!match) return text;
  while (match) {
    if (match.index !== 0) {
      ret.push(text.substr(0, match.index));
    }
    ret.push(match[0].substr(1, match[0].length - 2));
    text = text.substr(match[0].length + match.index);
    match = GROUP_PATTERN.exec(text);
  }
  if (ret.length <= 1) return ret[0];
  return ret;
}

function joinText(input) {
  if (typeof input === 'string') return input;
  return input.map(text => `[${text}]`).join('');
}

module.exports = function plugin(opts) {
  const parenthesis = opts && opts.parenthesis ? opts.parenthesis : '()';
  function inlineTokenizer(eat, value, silent) {
    const match = SYNTAX_PATTERN.exec(value);
    if (!match) return false;
    if (silent) return true;
    const text = delimitText(match[1]);
    const pronounciation = delimitText(match[2]);

    let rubyBase;
    if (typeof text === 'string') {
      rubyBase = [{ type: 'text', value: text }];
    } else {
      rubyBase = text.map(base => ({
        type: 'element',
        children: [{ type: 'text', value: base }],
        tagName: 'rb',
      }));
    }
    const rubyText = [].concat(pronounciation).map(p => ({
      type: 'element',
      children: [{ type: 'text', value: p }],
      tagName: 'rt',
    }));
    return eat(match[0])({
      type: 'ruby',
      base: text,
      text: pronounciation,
      data: {
        hName: 'ruby',
        hChildren: [
          rubyBase,
          {
            type: 'element',
            children: [
              { type: 'text', value: parenthesis[0] },
            ],
            tagName: 'rp',
          },
          rubyText,
          {
            type: 'element',
            children: [
              { type: 'text', value: parenthesis[parenthesis.length - 1] },
            ],
            tagName: 'rp',
          },
        ].reduce((prev, curr) => prev.concat(curr), []),
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

    visitors.ruby = (node) => {
      const base = joinText(node.base);
      const text = joinText(node.text);
      return `{${base}}^(${text})`;
    };
  }
};
