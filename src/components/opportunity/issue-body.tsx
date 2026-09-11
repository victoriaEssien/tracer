"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * An issue body, rendered as the markdown it actually is.
 *
 * The renderer does not pass raw HTML through, which matters: this is text
 * written by strangers on the internet and displayed inside our origin.
 */
export function IssueBody({ markdown }: { markdown: string }) {
  return (
    <div className="issue-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer nofollow ugc">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
