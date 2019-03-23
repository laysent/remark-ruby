# remark-ruby

This [remark][remark] plugin parses custom Markdown syntax to produce (HTML) ruby.

It introduces a new [MDAST][mdast] node type: "ruby".

```javascript
interface ruby <: Node {
  type: "ruby";
  base: string;
  text: string;
  data: {
    hName: "ruby";
    hChildren: [
      {
        type: 'text',
        value: string,
      },
      {
        type: 'element',
        children: [
          { type: 'text', value: string }
        ],
        tagName: 'rp',
      },
      {
        type: 'element',
        children: [
          { type: 'text', value: string }
        ],
        tagName: 'rt',
      },
      {
        type: 'element',
        children: [
          { type: 'text', value: string },
        ],
        tagName: 'rp',
      }
    ],
  },
}
```

## Syntax

Ruby is defined in the following way:

```markdown
This plugin works on {Markdown AST}^(MDAST).
```

This would compile to the following HTML:

```html
<p>This plugin works on <ruby>Markdown AST<rp>(</rp><rt>MDAST</rt><rp>)</rp></p>
```

### Text Delimitation

You could also use `[]` to delimit text:

```markdown
{[紳][士]}^([へん][たい])
```

This would compile to the following HTML:

```html
<p><ruby><rb>紳</rb><rb>士</rb><rp>(</rp><rt>へん</rt><rt>たい</rt><rp>)</rp></ruby></p>
```

Notice that this requires the usage of `rb` tag, which is not supported by most of the browsers
except Firefox. Check [caniuse](https://caniuse.com/#search=ruby) for details.

## Installation

[npm][npm]:

```bash
npm install remark-ruby
```

## Usage

Dependencies:

```javascript
const unified = require('unified')
const remarkParse = require('remark-parse')
const remarkRuby = require('remark-ruby')
const stringify = require('rehype-stringify')
const remark2rehype = require('remark-rehype')

```

Usage:

```javascript
unified()
  .use(remarkParse)
  .use(remarkRuby)
  .use(remark2rehype)
  .use(stringify)
```

## Options

### options.parenthesis

Ruby fallback parenthesis which will be used in `rp` tag. It should be a string with at most two characters. The first will be used as left parenthesis, the last will be used as right parenthesis.

By default, it's value is `()`.

**example**

```javascript
.use(remarkAbbr, { parenthesis: '「」' })
```

**given**

```markdown
This plugin works on {Markdown AST}^(MDAST).
```

**produces**

```html
<p>This plugin works on <ruby>Markdown AST<rp>「</rp><rt>MDAST</rt><rp>」</rp></p>
```

## License

[MIT][license] © [LaySent][homepage]

<!-- Definitions -->

[license]: https://github.com/laysent/remark-ruby/blob/master/LICENSE

[homepage]: https://github.com/laysent

[npm]: https://www.npmjs.com/package/remark-ruby

[mdast]: https://github.com/syntax-tree/mdast/blob/master/readme.md

[remark]: https://github.com/remarkjs/remark
