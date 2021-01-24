import type { Plugin } from 'unified';

declare namespace ruby {
  interface RubyOptions {
    /**
     * Ruby fallback parenthesis which will be used in `rp` tag. It should be a
     * string with at most two characters. The first will be used as left
     * parenthesis, the last will be used as right parenthesis.
     *
     * @default "()"
     */
    parenthesis: string;
  }
}
declare const ruby: Plugin<[ruby.RubyOptions?]>;
export = ruby;
