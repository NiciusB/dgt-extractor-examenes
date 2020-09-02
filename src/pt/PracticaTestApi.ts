import fetch, { Response } from 'node-fetch'
import { CookieJar } from 'tough-cookie'

class PracticaTestApiError extends Error {
	url: string
	statusCode: number

	constructor(m: string, res: Response) {
		super(m)
		this.statusCode = res.status
		this.url = res.url
	}
}

export class PracticaTestApi {
	jar: CookieJar

	constructor() {
		this.jar = new CookieJar()
	}

	async _sendRequest(
		method: string,
		path: string,
		body: unknown
	): Promise<Response> {
		const url = 'https://practicatest.com' + path
		let parsedBody = undefined
		const headers = {
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
			'accept-language': 'es,en;q=0.9,pt;q=0.8',
			cookie: await this.jar.getCookieString(url),
			accept: 'application/json, text/javascript, */*; q=0.01',
			lang: 'es',
			pais: 'ES',
		}

		if (body) {
			// For POST requests
			headers['x-requested-with'] = 'XMLHttpRequest'
			headers['Content-Type'] =
				'application/x-www-form-urlencoded; charset=UTF-8'
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
				throw new PracticaTestApiError(res.statusText, res)
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
