"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

/**
 * Parse YAML frontmatter from markdown content.
 * Returns the parsed key-value pairs and the remaining body.
 */
function parseFrontmatter(raw: string): { meta: Record<string, string | string[]> | null; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) return { meta: null, body: raw };

  const yamlBlock = match[1];
  const body = match[2];
  const meta: Record<string, string | string[]> = {};

  let currentKey: string | null = null;
  let currentArray: string[] | null = null;
  let foldedKey: string | null = null;
  let foldedLines: string[] = [];

  const flushFolded = () => {
    if (foldedKey && foldedLines.length > 0) {
      meta[foldedKey] = foldedLines.join(" ").trim();
    }
    foldedKey = null;
    foldedLines = [];
  };

  for (const line of yamlBlock.split("\n")) {
    // If we're collecting a folded scalar (> or |), indented lines belong to it
    if (foldedKey) {
      if (line.match(/^\s+/) && !line.match(/^(\w[\w\s]*?):\s/)) {
        foldedLines.push(line.trim());
        continue;
      } else {
        flushFolded();
      }
    }

    // Array item (e.g., "  - value")
    const arrayItem = line.match(/^\s+-\s+(.+)/);
    if (arrayItem && currentKey) {
      if (!currentArray) {
        currentArray = [];
        meta[currentKey] = currentArray;
      }
      currentArray.push(arrayItem[1].replace(/^["']|["']$/g, ""));
      continue;
    }

    // Key-value pair (e.g., "name: value")
    const kv = line.match(/^(\w[\w\s]*?):\s*(.*)/);
    if (kv) {
      currentKey = kv[1].trim();
      currentArray = null;
      const val = kv[2].trim().replace(/^["']|["']$/g, "");
      // Folded (>) or literal (|) scalar — collect subsequent indented lines
      if (val === ">" || val === "|") {
        foldedKey = currentKey;
        foldedLines = [];
      } else if (val) {
        meta[currentKey] = val;
      }
    }
  }

  flushFolded();

  return { meta, body };
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  const { meta, body } = parseFrontmatter(content);

  return (
    <div className={className} style={{ width: "100%", lineHeight: 1.6, fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {meta && Object.keys(meta).length > 0 && (
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "0.375rem",
            padding: "12px 16px",
            marginBottom: 20,
            border: "1px solid rgba(218, 193, 185, 0.2)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(meta).map(([key, value]) => (
                <tr key={key}>
                  <td
                    style={{
                      padding: "3px 12px 3px 0",
                      fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      width: 1,
                    }}
                  >
                    {key}
                  </td>
                  <td
                    style={{
                      padding: "3px 0",
                      fontFamily: "var(--font-inter), Inter, sans-serif",
                      fontSize: 13,
                      color: "var(--text-primary)",
                      verticalAlign: "top",
                    }}
                  >
                    {Array.isArray(value) ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {value.map((v, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "#FFDBCF",
                              color: "#390C00",
                              padding: "1px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                            }}
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 style={{ fontFamily: "var(--font-epilogue), Epilogue, sans-serif", color: "var(--text-primary)", fontSize: 28, fontWeight: 700, margin: "24px 0 12px" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontFamily: "var(--font-epilogue), Epilogue, sans-serif", color: "var(--text-primary)", fontSize: 22, fontWeight: 700, margin: "20px 0 10px" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontFamily: "var(--font-epilogue), Epilogue, sans-serif", color: "var(--text-primary)", fontSize: 18, fontWeight: 600, margin: "16px 0 8px" }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ margin: "8px 0", color: "var(--text-primary)" }}>{children}</p>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: "var(--accent-color)", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code style={{ backgroundColor: "var(--bg-secondary)", padding: "2px 6px", borderRadius: "0.25rem", fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace", fontSize: 13 }}>
                  {children}
                </code>
              );
            }
            return (
              <code style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, monospace", fontSize: 13 }}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre style={{ backgroundColor: "var(--bg-secondary)", padding: 16, borderRadius: "0.375rem", overflow: "auto", margin: "12px 0" }}>
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <table style={{ width: "100%", borderCollapse: "collapse", margin: "12px 0" }}>
              {children}
            </table>
          ),
          thead: ({ children }) => (
            <thead style={{ backgroundColor: "var(--bg-secondary)" }}>{children}</thead>
          ),
          tr: ({ children }) => (
            <tr style={{ borderBottom: "1px solid rgba(218, 193, 185, 0.2)" }}>{children}</tr>
          ),
          th: ({ children }) => (
            <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, fontSize: 13 }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ padding: "8px 12px", fontSize: 14 }}>{children}</td>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: 24, margin: "8px 0" }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: 24, margin: "8px 0" }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "4px 0" }}>{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: "3px solid #93452A", paddingLeft: 16, margin: "12px 0", color: "var(--text-secondary)", fontStyle: "italic" }}>
              {children}
            </blockquote>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
