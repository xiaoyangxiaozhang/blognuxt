declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean
    breaks?: boolean
    linkify?: boolean
    typographer?: boolean
  }

  class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    render(source: string): string
  }

  export default MarkdownIt
}
