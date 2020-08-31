import fetch, { Response } from 'node-fetch'
import { CookieJar } from 'tough-cookie'

class DgtApiError extends Error {
	url: string
	statusCode: number

	constructor(m: string, res: Response) {
		super(m)
		this.statusCode = res.status
		this.url = res.url
	}
}

export class DgtApi {
	jar: CookieJar

	constructor() {
		this.jar = new CookieJar()
	}

	async _sendRequest(
		method: string,
		path: string,
		body: unknown
	): Promise<Response> {
		const url = 'https://sedeapl.dgt.gob.es/WEB_EXAM_AUTO' + path
		let parsedBody = undefined
		const headers = {
			'user-agent': 'dgtExtractorExamenes/1.0',
			'accept-language': 'es,en;q=0.9,pt;q=0.8',
			cookie: await this.jar.getCookieString(url),
		}

		if (body) {
			// For POST requests
			headers['Content-Type'] = 'application/x-www-form-urlencoded'
			parsedBody = Object.entries(body)
				.map(([key, value]) => `${key}=${value}`)
				.join('&')
		}

		return await fetch(url, {
			method,
			body: parsedBody,
			headers,
		}).then(async (res) => {
			if (!res.ok) {
				throw new DgtApiError(res.statusText, res)
			}

			const cookies = res.headers.raw()['set-cookie'] ?? []
			await Promise.all(
				cookies.map((cookie) => this.jar.setCookie(cookie, res.url))
			)

			return res
		})
	}

	async get(path: string): Promise<Response> {
		return this._sendRequest('GET', path, null)
	}
	async post(path: string, data: unknown): Promise<Response> {
		return this._sendRequest('POST', path, data)
	}
}
