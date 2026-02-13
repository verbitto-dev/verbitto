// Vercel Serverless Function entry point (JavaScript)
import app from '../dist/app.js'

function collectBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = []
		req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
		req.on('end', () => resolve(Buffer.concat(chunks)))
		req.on('error', reject)
	})
}

function toHeaders(nodeHeaders) {
	const headers = new Headers()
	for (const [key, value] of Object.entries(nodeHeaders || {})) {
		if (Array.isArray(value)) {
			headers.set(key, value.join(', '))
		} else if (value !== undefined) {
			headers.set(key, String(value))
		}
	}
	return headers
}

export default async function handler(req, res) {
	try {
		const host = req.headers?.host || 'localhost'
		const protocol = req.headers?.['x-forwarded-proto'] || 'https'
		const url = `${protocol}://${host}${req.url || '/'}`
		const headers = toHeaders(req.headers)

		let body
		const method = (req.method || 'GET').toUpperCase()
		const hasBody = !['GET', 'HEAD'].includes(method)

		if (hasBody) {
			if (req.body !== undefined && req.body !== null) {
				body = typeof req.body === 'string' || Buffer.isBuffer(req.body)
					? req.body
					: JSON.stringify(req.body)
				if (!headers.get('content-type')) {
					headers.set('content-type', 'application/json')
				}
			} else {
				body = await collectBody(req)
			}
		}

		const request = new Request(url, {
			method,
			headers,
			body: hasBody ? body : undefined,
		})

		const response = await app.fetch(request)

		response.headers.forEach((value, key) => {
			res.setHeader(key, value)
		})
		res.statusCode = response.status

		const buffer = Buffer.from(await response.arrayBuffer())
		res.end(buffer)
	} catch (error) {
		console.error('[api/index] Handler error:', error)
		res.statusCode = 500
		res.setHeader('content-type', 'application/json')
		res.end(JSON.stringify({ error: 'Internal Server Error' }))
	}
}
