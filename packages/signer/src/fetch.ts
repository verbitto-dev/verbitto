/**
 * Fetch with retry and exponential backoff.
 * Retries on network errors and 5xx responses.
 * Includes request timeout protection.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  timeoutMs = 15000
): Promise<Response> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        // Don't retry client errors (4xx), only 5xx
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response
        }
        // 5xx — will retry
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        console.warn(
          `  ⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed (HTTP ${response.status}), retrying...`
        )
      } catch (fetchErr) {
        clearTimeout(timeoutId)
        throw fetchErr
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${timeoutMs}ms`)
        console.warn(
          `  ⚠️ Attempt ${attempt + 1}/${maxRetries + 1} timed out after ${timeoutMs}ms, retrying...`
        )
      } else {
        lastError = err instanceof Error ? err : new Error(String(err))
        console.warn(
          `  ⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed (${lastError.message}), retrying...`
        )
      }
    }
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * 2 ** attempt, 10000) // 1s, 2s, 4s... max 10s
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
