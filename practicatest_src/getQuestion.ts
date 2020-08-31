import { PracticaTestApi } from './PracticaTestApi'
import * as cheerio from 'cheerio'

export type PracticaTestRespuesta = {
	id: string
	contenido: string
	correcta: boolean
}
export type PracticaTestPregunta = {
	id: string
	urlImagen: string
	enunciado: string
	respuestas: PracticaTestRespuesta[]
	explicacion: string
}
export type PracticaTestLink = {
	id: string
	url: string
}

export default async function getQuestion(
	link: string
): Promise<{
	pregunta: PracticaTestPregunta
	links: PracticaTestLink[]
}> {
	const practicaTestApi = new PracticaTestApi()

	const preguntasHtml = await practicaTestApi
		.get(`/preguntas/qB/${link}`)
		.then((res) => res.text())
	const $ = cheerio.load(preguntasHtml)

	const correct_answser_index = $('.hide.option_correct').text()
	const respuestas = Array.from($('.test_simple li')).map(
		(respuestaDom, index) => {
			const contenido = capitalize(
				$('a[href=#]', respuestaDom)
					.text()
					.replace(/^\w\) /, '') // Remove initial B)
					.replace(/\.$/, '') // Remove final dot that sometimes appear
			)
			return {
				id: respuestaDom.attribs.id,
				contenido,
				correcta: (index + 1).toString() === correct_answser_index,
			}
		}
	)

	const preguntaID = link.split('/').pop()

	const explicacion = await practicaTestApi
		.post(`/ajax/dudas-permiso`, {
			permiso_c: 'B',
			codigo: preguntaID,
			numero: '1',
			tipo: 'P.Shared',
		})
		.then((res) => res.text())
		.then((str) => cheerio.load(str).root().text()) // Strip HTML

	const pregunta = {
		id: preguntaID,
		urlImagen: $('#content-test img.img-responsive').attr().src,
		enunciado: $('.container .row h1.fs-25').text(),
		respuestas,
		explicacion,
	}

	const links = Array.from($('.card-block .fs-14 a')).map((otherLink) => {
		const url = otherLink.attribs.href
			.replace('https://practicatest.com/preguntas/qB/', '')
			.split('?')[0]
		return {
			url,
			id: url.split('/').pop(),
		}
	})

	return { pregunta, links }
}

const capitalize = (s: string): string => {
	if (typeof s !== 'string') return ''
	return s.charAt(0).toUpperCase() + s.slice(1)
}
