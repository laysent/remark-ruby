const assert = require('assert');
const rubyEnd = require('./ruby-end');

function tokenizeRubyStart(effects, ok) {
  return function start(code) {
    assert(code === 123, 'expected `{`');
    effects.enter('rubyStart');
    effects.enter('rubyMarker');
    effects.consume(code);
    effects.exit('rubyMarker');
    effects.exit('rubyStart');
    return ok(code);
  };
}

module.exports = {
  tokenize: tokenizeRubyStart,
  resolveAll: rubyEnd.resolveAll,
};
