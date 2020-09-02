import { DgtApi } from './DgtApi'

export type DgtRespuesta = {
	id: number
	idPregunta: number
	contenido: string
	correcta: boolean
}
export type DgtPregunta = {
	id: number
	urlImagen: string
	idPreguntaCuest: number
	enunciado: string
	respuestas: DgtRespuesta[]
}
export type DgtCuestionario = {
	id: number
	codTipoCuest: string
	idIdioma: number
	preguntas: DgtPregunta[]
}

export default async function getDgtCuestionario(): Promise<DgtCuestionario> {
	const dgtApi = new DgtApi()
	await dgtApi.get('/examen/examen.jsp')
	await dgtApi.post('/service/VerificarExamenServlet', {
		tipoCuest: 'B',
		idioma: 1,
	})
	return await dgtApi
		.get('/service/RecuperarAspiranteServlet')
		.then((res) => res.json())
		.then((res) => res.cuestionario)
}
