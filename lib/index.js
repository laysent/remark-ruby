const fromMarkdown = require('./from-markdown');
const toMarkdown = require('./to-markdown');
const rubyEnd = require('./tokenize/ruby-end');
const rubyStart = require('./tokenize/ruby-start');

module.exports = function ruby(opts) {
  const data = this.data();
  const parenthesis = opts && opts.parenthesis ? opts.parenthesis : '()';

  function add(field, value) {
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }

  add('micromarkExtensions', {
    text: {
      123: rubyStart,
      125: rubyEnd,
    },
    insideSpan: {
      null: rubyStart,
    },
  });
  add('fromMarkdownExtensions', fromMarkdown(parenthesis));
  add('toMarkdownExtensions', toMarkdown);
};
