import getQuestion, { PracticaTestPregunta } from './getQuestion'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

const writeFile = util.promisify(fs.writeFile)

const storePath = path.join(__dirname, '..', 'store', 'practicatest.json')

let store: PracticaTestPregunta[] = []
loadStore()

setInterval(addRandomQuestionarieToStore, 1000 * 15)

let nextQuestionLink =
	'si-estaciona-un-turismo-con-un-remolque-ligero-en-una-pendiente-sensible-debe/ZJyYng==' // Initialize it to something known to work
async function addRandomQuestionarieToStore() {
	const cuestionario = await getQuestion(nextQuestionLink)
	nextQuestionLink = cuestionario.links[0].url

	const alreadyInStore = store.some(
		(_pregunta) => _pregunta.id === cuestionario.pregunta.id
	)
	if (alreadyInStore) return

	store.push(cuestionario.pregunta)

	await saveStore()
}

function log(...stuff: unknown[]) {
	// eslint-disable-next-line no-console
	console.log(new Date(), ...stuff)
}

function loadStore() {
	if (fs.existsSync(storePath)) {
		try {
			store = JSON.parse(fs.readFileSync(storePath, 'utf-8'))
			log(`${store.length} preguntas cargadas`)
		} catch (err) {
			throw new Error('Corrupted store')
		}
	} else {
		log('store no encontrado! Empezando desde 0')
	}
}

function saveStore() {
	return writeFile(storePath, JSON.stringify(store), 'utf-8')
}
