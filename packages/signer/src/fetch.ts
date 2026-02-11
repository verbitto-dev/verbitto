/**
 * Fetch with retry and exponential backoff.
 * Retries on network errors and 5xx responses.
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    maxRetries = 3
): Promise<Response> {
    let lastError: Error | undefined
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)
            // Don't retry client errors (4xx), only 5xx
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                return response
            }
            // 5xx — will retry
            lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
            console.warn(
                `  ⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed (HTTP ${response.status}), retrying...`
            )
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err))
            console.warn(
                `  ⚠️ Attempt ${attempt + 1}/${maxRetries + 1} failed (${lastError.message}), retrying...`
            )
        }
        if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // 1s, 2s, 4s... max 10s
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
    throw lastError
}
