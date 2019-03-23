const unified = require('unified');
const remarkParse = require('remark-parse');
const stringify = require('rehype-stringify');
const remark2rehype = require('remark-rehype');
const remarkStringify = require('remark-stringify');
const plugin = require('.');

const render = (text, config) => unified()
  .use(remarkParse)
  .use(plugin, config)
  .use(remark2rehype)
  .use(stringify)
  .processSync(text);

const renderToMarkdown = (text, config) => unified()
  .use(remarkParse)
  .use(remarkStringify)
  .use(plugin, config)
  .processSync(text);

const configToTest = {
  'no-config': undefined,
  'empty object': {},
  customParenthesis: { parenthesis: '{}' },
  singleParenthesis: { parenthesis: ':' },
};
const markdown = 'According to [Wiki](https://en.wikipedia.org/wiki/Furigana), {Furigana}^(振り仮名) is a Japanese reading aid.\n';

for (const [configName, config] of Object.entries(configToTest)) { // eslint-disable-line no-restricted-syntax, max-len
  it(`should render ruby tag (${configName})`, () => {
    const { contents } = render(markdown, config);
    expect(contents).toMatchSnapshot();
  });
  it(`should compile to markdown (${configName})`, () => {
    const { contents: contentsA } = renderToMarkdown(markdown, config);
    const { contents: contentsB } = renderToMarkdown(contentsA, config);

    expect(markdown).toBe(contentsA);
    expect(contentsA).toBe(contentsB);
  });
  it(`should not render ruby tag when syntax not found (${configName})`, () => {
    const noRubyMarkdown = 'According to [Wiki](https://en.wikipedia.org/wiki/Furigana), {Furigana}(振り仮名) is a Japanese reading aid.\n';
    const { contents } = render(noRubyMarkdown, config);

    expect(contents.indexOf('<ruby>') < 0).toBe(true);
  });
  it(`should handle delimitation in ruby (${configName})`, () => {
    const nested = '{first, [second part] and [third]}^(eins, [zwei] und [drei])';
    const { contents } = render(nested, config);

    expect(contents).toMatchSnapshot();
  });
  it(`should compile delimitation text to markdown (${configName})`, () => {
    const nested = '{[first][second part][third]}^([eins][zwei][drei])\n';
    const { contents: contentsA } = renderToMarkdown(nested, config);
    const { contents: contentsB } = renderToMarkdown(contentsA, config);

    expect(nested).toBe(contentsA);
    expect(contentsA).toBe(contentsB);
  });
}
