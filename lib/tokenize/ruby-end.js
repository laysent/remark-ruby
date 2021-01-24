/* eslint-disable no-underscore-dangle, no-plusplus, no-use-before-define */
const assert = require('assert');
const codes = require('micromark/dist/character/codes');
const markdownLineEnding = require('micromark/dist/character/markdown-line-ending');
const markdownSpace = require('micromark/dist/character/markdown-space');
const chunkedPush = require('micromark/dist/util/chunked-push');
const chunkedSplice = require('micromark/dist/util/chunked-splice');
const normalizeIdentifier = require('micromark/dist/util/normalize-identifier');
const resolveAll = require('micromark/dist/util/resolve-all');
const shallow = require('micromark/dist/util/shallow');

const pronunciationConstruct = { tokenize: tokenizePronunciation };

function resolveAllRubyEnd(events) {
  let index = -1;
  let token;

  while (++index < events.length) {
    [, token] = events[index];

    if (
      !token._used
      && (token.type === 'rubyStart' || token.type === 'rubyEnd')
    ) {
      // Remove the marker.
      events.splice(index + 1, 2);
      token.type = 'data';
      index++;
    }
  }

  return events;
}

function resolveToRubyEnd(events, context) {
  let index = events.length;
  let token;
  let open;
  let close;
  let media;

  // Find an opening.
  while (index--) {
    [, token] = events[index];

    if (open) {
      // If we see another link, or inactive link label, we’ve been here before.
      if (
        token.type === 'ruby'
        || (token.type === 'rubyStart' && token._inactive)
      ) {
        break;
      }

      // Mark other link openings as inactive, as we can’t have links in
      // links.
      if (events[index][0] === 'enter' && token.type === 'rubyStart') {
        token._inactive = true;
      }
    } else if (close) {
      if (
        events[index][0] === 'enter'
        && token.type === 'rubyStart'
        && !token._balanced
      ) {
        open = index;
      }
    } else if (token.type === 'rubyEnd') {
      close = index;
    }
  }

  const group = {
    type: 'ruby',
    start: shallow(events[open][1].start),
    end: shallow(events[events.length - 1][1].end),
  };

  const label = {
    type: 'rubyLabel',
    start: shallow(events[open][1].start),
    end: shallow(events[close][1].end),
  };

  const text = {
    type: 'rubyText',
    start: shallow(events[open + 2][1].end),
    end: shallow(events[close - 2][1].start),
  };

  media = [
    ['enter', group, context],
    ['enter', label, context],
  ];

  // Opening marker.
  media = chunkedPush(media, events.slice(open + 1, open + 3));

  // Text open.
  media = chunkedPush(media, [['enter', text, context]]);

  // Between.
  media = chunkedPush(
    media,
    resolveAll(
      context.parser.constructs.insideSpan.null,
      events.slice(open + 4, close - 3),
      context,
    ),
  );

  // Text close, marker close, label close.
  media = chunkedPush(media, [
    ['exit', text, context],
    events[close - 2],
    events[close - 1],
    ['exit', label, context],
  ]);

  // Pronunciation.
  media = chunkedPush(media, events.slice(close + 1));

  // Media close.
  media = chunkedPush(media, [['exit', group, context]]);

  chunkedSplice(events, open, events.length, media);

  return events;
}

function tokenizeRubyEnd(effects, ok, nok) {
  const self = this;
  let index = self.events.length;
  let rubyStart;
  let defined;

  // Find an opening.
  while (index--) {
    if (
      self.events[index][1].type === 'rubyStart'
      && !self.events[index][1]._balanced
    ) {
      [, rubyStart] = self.events[index];
      break;
    }
  }

  return start;

  function start(code) {
    assert(code === codes.rightCurlyBrace, 'expected `}`');

    if (!rubyStart) {
      return nok(code);
    }

    // It’s a balanced bracket, but contains a link.
    if (rubyStart._inactive) return balanced(code);
    defined = self.parser.defined.indexOf(
      normalizeIdentifier(
        self.sliceSerialize({ start: rubyStart.end, end: self.now() }),
      ),
    ) > -1;
    effects.enter('rubyEnd');
    effects.enter('rubyMarker');
    effects.consume(code);
    effects.exit('rubyMarker');
    effects.exit('rubyEnd');
    return rubyCaret;
  }

  function rubyCaret(code) {
    if (code !== codes.caret) {
      return nok(code);
    }

    effects.consume(code);
    return afterRubyEnd;
  }

  function afterRubyEnd(code) {
    if (code === codes.leftParenthesis) {
      return effects.attempt(
        pronunciationConstruct,
        ok,
        defined ? ok : balanced,
      )(code);
    }

    return defined ? ok(code) : balanced(code);
  }

  function balanced(code) {
    rubyStart._balanced = true;
    return nok(code);
  }
}

function tokenizePronunciation(effects, ok, nok) {
  let size = 0;
  let data;

  return start;

  function start(code) {
    assert(code === codes.leftParenthesis, 'expected left paren');
    effects.enter('rubyPronunciation');
    effects.enter('rubyPronunciationMarker');
    effects.consume(code);
    effects.exit('rubyPronunciationMarker');
    return open;
  }

  function open(code) {
    if (code === codes.rightParenthesis) {
      return end(code);
    }

    if (markdownLineEnding(code)) {
      effects.enter('lineEnding');
      effects.consume(code);
      effects.exit('lineEnding');
      return open;
    }

    effects.enter('chunkString', { contentType: 'string' });
    return pronunciation(code);
  }

  function pronunciation(code) {
    if (
      code === codes.eof
      || code === codes.leftParenthesis
      || code === codes.rightParenthesis
      || markdownLineEnding(code)
      || size++ > 999
    ) {
      effects.exit('chunkString');
      return open(code);
    }

    effects.consume(code);
    data = data || !markdownSpace(code);
    return code === codes.backslash ? pronunciationEscape : pronunciation;
  }

  function pronunciationEscape(code) {
    if (
      code === codes.leftParenthesis
      || code === codes.backslash
      || code === codes.rightParenthesis
    ) {
      effects.consume(code);
      size++;
      return pronunciation;
    }

    return pronunciation(code);
  }

  function end(code) {
    if (code === codes.rightParenthesis) {
      effects.enter('rubyPronunciationMarker');
      effects.consume(code);
      effects.exit('rubyPronunciationMarker');
      effects.exit('rubyPronunciation');
      return ok;
    }

    return nok(code);
  }
}

module.exports = {
  tokenize: tokenizeRubyEnd,
  resolveTo: resolveToRubyEnd,
  resolveAll: resolveAllRubyEnd,
};
