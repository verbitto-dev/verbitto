import { visit } from 'unist-util-visit'

/**
 * Rehype plugin to transform mermaid code blocks into custom Mermaid components.
 * This must run BEFORE rehype-pretty-code to intercept mermaid blocks.
 */
export function rehypeMermaid() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      // Look for <pre><code class="language-mermaid">...</code></pre>
      if (
        node.tagName === 'pre' &&
        node.children?.length === 1 &&
        node.children[0]?.tagName === 'code'
      ) {
        const codeNode = node.children[0]
        const className = codeNode.properties?.className

        // Check if it's a mermaid code block
        const isMermaid =
          Array.isArray(className) &&
          className.some((c) => c === 'language-mermaid' || c === 'language-mmd')

        if (isMermaid && parent && typeof index === 'number') {
          // Extract the mermaid code content
          const codeContent = codeNode.children
            ?.filter((child) => child.type === 'text')
            .map((child) => child.value)
            .join('')
            .trim()

          if (codeContent) {
            // Replace the <pre> node with a custom Mermaid component
            // This will be rendered by MDX as <Mermaid chart="..." />
            parent.children[index] = {
              type: 'mdxJsxFlowElement',
              name: 'Mermaid',
              attributes: [
                {
                  type: 'mdxJsxAttribute',
                  name: 'chart',
                  value: codeContent,
                },
              ],
              children: [],
            }
          }
        }
      }
    })
  }
}
