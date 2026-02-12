import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { rehypeMermaid } from './src/lib/rehype-mermaid.js'

const DIRECTORY_PATTERN_REGEX = /\(([^)]*)\)\//g

/** @type {import('contentlayer2/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: 'string',
    resolve: (doc) => {
      const path = doc._raw.flattenedPath
        .replace(DIRECTORY_PATTERN_REGEX, '')
        .replace(/\/index$/, '')
        .replace(/^index$/, '')
      return path ? `/docs/${path}` : '/docs'
    },
  },
  slugAsParams: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(DIRECTORY_PATTERN_REGEX, ''),
  },
}

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: '**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string' },
    published: { type: 'boolean', default: true },
    toc: { type: 'boolean', default: true },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: './src/docs',
  documentTypes: [Doc],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      // Transform mermaid code blocks into Mermaid components (must run BEFORE rehype-pretty-code)
      rehypeMermaid,
      // Pre-process: Extract raw string from code blocks for copy functionality
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'pre') {
            const [codeEl] = node.children
            if (codeEl?.tagName !== 'code') return
            node.__rawString__ = codeEl.children?.[0]?.value
          }
        })
      },
      // Syntax highlighting with rehype-pretty-code
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          keepBackground: true,
          onVisitLine(node) {
            // Prevent empty lines from collapsing in grid mode
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }]
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className = [...(node.properties.className || []), 'line--highlighted']
          },
          onVisitHighlightedChars(node) {
            node.properties.className = ['word--highlighted']
          },
        },
      ],
      // Post-process: Pass raw string to pre element for copy button
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'div') {
            if (!('data-rehype-pretty-code-fragment' in node.properties)) return
            const preElement = node.children.at(-1)
            if (preElement?.tagName !== 'pre') return
            preElement.properties.__rawString__ = node.__rawString__
          }
        })
      },
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            ariaLabel: 'Link to section',
            className: ['subheading-anchor'],
          },
        },
      ],
    ],
  },
})
