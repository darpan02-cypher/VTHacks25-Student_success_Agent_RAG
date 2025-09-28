import type React from "react"

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Parse markdown content and convert to JSX
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let currentTable: string[][] = []
    let inTable = false
    let listItems: string[] = []
    let inList = false

    const flushTable = () => {
      if (currentTable.length > 0) {
        const headers = currentTable[0]
        const rows = currentTable.slice(2) // Skip separator row
        elements.push(
          <div key={elements.length} className="overflow-x-auto my-4">
            <table className="w-full border-collapse border border-border/30 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  {headers.map((header, i) => (
                    <th key={i} className="border border-border/30 px-3 py-2 text-left font-semibold text-sm">
                      {header.replace(/\*\*/g, "").trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    {row.map((cell, j) => (
                      <td key={j} className="border border-border/30 px-3 py-2 text-sm">
                        <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell.trim()) }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        )
        currentTable = []
        inTable = false
      }
    }

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside space-y-1 my-3 ml-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
              </li>
            ))}
          </ul>,
        )
        listItems = []
        inList = false
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Handle tables
      if (line.includes("|") && line.trim() !== "") {
        if (!inList) flushList()
        inTable = true
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell !== "")
        currentTable.push(cells)
        continue
      } else if (inTable) {
        flushTable()
      }

      // Handle lists
      if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
        if (inTable) flushTable()
        inList = true
        listItems.push(line.trim().substring(1).trim())
        continue
      } else if (inList && line.trim() === "") {
        continue // Skip empty lines in lists
      } else if (inList) {
        flushList()
      }

      // Handle headers
      if (line.startsWith("###")) {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(
          <h3 key={elements.length} className="text-lg font-semibold mt-6 mb-3 text-foreground">
            {line.replace("###", "").trim()}
          </h3>,
        )
      } else if (line.startsWith("##")) {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(
          <h2 key={elements.length} className="text-xl font-bold mt-6 mb-4 text-foreground">
            {line.replace("##", "").trim()}
          </h2>,
        )
      } else if (line.startsWith("**") && line.endsWith("**")) {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(
          <h1 key={elements.length} className="text-2xl font-bold mt-6 mb-4 text-foreground">
            {line.replace(/\*\*/g, "").trim()}
          </h1>,
        )
      } else if (line.trim() === "---") {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(<hr key={elements.length} className="my-6 border-border/30" />)
      } else if (line.trim() !== "") {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(
          <p key={elements.length} className="text-sm leading-relaxed mb-3">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          </p>,
        )
      } else {
        if (inTable) flushTable()
        if (inList) flushList()
        elements.push(<div key={elements.length} className="h-2" />)
      }
    }

    // Flush any remaining content
    if (inTable) flushTable()
    if (inList) flushList()

    return elements
  }

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
  }

  return <div className="markdown-content">{parseMarkdown(content)}</div>
}
