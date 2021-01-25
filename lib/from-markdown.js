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

module.exports = function fromMarkdown(parenthesis) {
  return {
    enter: {
      ruby(token) {
        this.enter({
          type: 'ruby',
          base: null,
          text: null,
          children: [],
          data: {
            hName: 'ruby',
            hChildren: [

            ],
          },
        }, token);
      },
      rubyText() {
        this.stack.push({ type: 'fragment', children: [] });
      },
      rubyPronunciation() {
        this.stack.push({ type: 'fragment', children: [] });
      },
    },
    exit: {
      ruby(token) {
        const element = this.stack[this.stack.length - 1];
        const text = element.base;
        const pronunciation = element.text;

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
        const rubyText = [].concat(pronunciation).map(p => ({
          type: 'element',
          children: [{ type: 'text', value: p }],
          tagName: 'rt',
        }));

        element.data.hChildren = [
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
        ].reduce((prev, curr) => prev.concat(curr), []);
        this.exit(token);
      },
      rubyText() {
        const data = delimitText(this.resume());
        this.stack[this.stack.length - 1].base = data;
      },
      rubyPronunciation() {
        const data = delimitText(this.resume());
        this.stack[this.stack.length - 1].text = data;
      },
    },
  };
};
