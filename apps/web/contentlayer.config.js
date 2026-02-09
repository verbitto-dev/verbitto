import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

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
  contentDirPath: 'docs',
  documentTypes: [Doc],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
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
