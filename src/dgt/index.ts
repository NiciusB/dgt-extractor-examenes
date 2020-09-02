import getDgtCuestionario, { DgtPregunta } from './getDgtCuestionario'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

const writeFile = util.promisify(fs.writeFile)

const storePath = path.join(__dirname, '..', '..', 'store', 'dgt.json')

let store: DgtPregunta[] = []
loadStore()

setInterval(addRandomQuestionarieToStore, 1000 * 60)

async function addRandomQuestionarieToStore() {
	const cuestionario = await getDgtCuestionario()
	let foundNewQuestions = false

	cuestionario.preguntas.forEach((pregunta) => {
		const alreadyInStore = store.some(
			(_pregunta) => _pregunta.id === pregunta.id
		)
		if (alreadyInStore) return

		foundNewQuestions = true
		store.push(pregunta)
	})

	if (foundNewQuestions) {
		log(`Found new questions on questionnaire ${cuestionario.id}`)
		await saveStore()
	}
}

function log(...stuff: unknown[]) {
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
