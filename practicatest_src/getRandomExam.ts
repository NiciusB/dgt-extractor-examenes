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

export default async function getQuestion(): Promise<PracticaTestPregunta[]> {
	const practicaTestApi = new PracticaTestApi()

	const preguntasHtml = await practicaTestApi
		.get(`/tests/permiso-B/online`)
		.then((res) => res.text())
	const $ = cheerio.load(preguntasHtml)

	const preguntasPromises = Array.from($('#content-test .well.well-sm')).map(
		async (preguntaElm): Promise<PracticaTestPregunta> => {
			const correct_answser_index = $(
				'.hide.option_correct',
				preguntaElm
			).text()
			const respuestas: PracticaTestRespuesta[] = Array.from(
				$('.test_simple li', preguntaElm)
			).map((respuestaDom, index) => {
				const contenido = capitalize(
					$('a[href=#]', respuestaDom)
						.text()
						.replace(/^\w\) /, '') // Remove initial B)
						.replace(/\.$/, '') // Remove final dot that sometimes appear
						.trim()
				)
				return {
					id: respuestaDom.attribs.id,
					contenido,
					correcta: (index + 1).toString() === correct_answser_index,
				}
			})

			const preguntaID = $('.addthis_sharing_toolbox', preguntaElm)
				.data('url')
				.split('/')
				.pop()
				.split('?')[0]

			const explicacion = await practicaTestApi
				.post(`/ajax/dudas-permiso`, {
					permiso_c: 'B',
					codigo: preguntaID,
					numero: '1',
					tipo: 'P.Shared',
				})
				.then((res) => res.text())
				.then((str) => cheerio.load(str).root().text().trim()) // Strip HTML and clean string

			return {
				id: preguntaID,
				urlImagen: $('#content-test img.img-responsive').attr().src,
				enunciado: $('.container .row h1.fs-25').text(),
				respuestas,
				explicacion,
			}
		}
	)

	return Promise.all(preguntasPromises)
}

const capitalize = (s: string): string => {
	if (typeof s !== 'string') return ''
	return s.charAt(0).toUpperCase() + s.slice(1)
}
