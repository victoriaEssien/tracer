"use client";

/**
 * The last resort: an error in the root layout itself, which means the normal
 * error boundary never mounted. It has to bring its own <html> and its own
 * styling, since nothing above it rendered.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "5rem 1.25rem",
          maxWidth: "42rem",
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Tracer failed to start</h1>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", lineHeight: 1.6 }}>
          Reload the page. If it keeps happening, the server logs will have the detail.
        </p>
        {error.digest ? (
          <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.6 }}>
            Reference: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
