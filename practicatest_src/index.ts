import getRandomExam, { PracticaTestPregunta } from './getRandomExam'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

const writeFile = util.promisify(fs.writeFile)

const storePath = path.join(__dirname, '..', 'store', 'practicatest.json')

let store: PracticaTestPregunta[] = []

main()

async function main() {
	await loadStore()

	const infiniteLoop = () =>
		retrieveNextQuestion().then(() => {
			const timeoutMs = process.env.NODE_ENV === 'dev' ? 500 : 1000 * 20
			setTimeout(infiniteLoop, timeoutMs)
		})
	infiniteLoop()
}

async function retrieveNextQuestion() {
	const preguntas = await getRandomExam()

	let foundNewQuestions = false

	preguntas.forEach((pregunta) => {
		const alreadyInStore = store.some((_q) => _q.id === pregunta.id)
		if (alreadyInStore) return
		foundNewQuestions = true
		store.push(pregunta)
	})

	if (!foundNewQuestions) return
	log(`We now have ${store.length} questions`)

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
