'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary
 * Catches errors that bubble up to the root
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f4f4f5',
            padding: '1rem',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <div style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 24px',
                backgroundColor: '#fecaca',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '32px' }}>!</span>
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#18181b',
                marginBottom: '8px',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                color: '#52525b',
                marginBottom: '24px',
              }}
            >
              An unexpected error occurred. Please try again.
            </p>

            <button
              onClick={reset}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>

            {error.digest && (
              <p
                style={{
                  marginTop: '24px',
                  fontSize: '12px',
                  color: '#a1a1aa',
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
