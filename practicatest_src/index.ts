import getQuestion, {
	PracticaTestPregunta,
	PracticaTestLink,
} from './getQuestion'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'

const writeFile = util.promisify(fs.writeFile)

const storePath = path.join(__dirname, '..', 'store', 'practicatest.json')

let store: PracticaTestPregunta[] = []
loadStore()

const pendingLinks = []
pendingLinks.push(
	'si-estaciona-un-turismo-con-un-remolque-ligero-en-una-pendiente-sensible-debe/ZJyYng=='
) // Initialize it to something known to work

setInterval(
	retrieveNextQuestion,
	1000 * (process.env.NODE_ENV === 'dev' ? 1 : 20)
)

function parseNextLinks(links: PracticaTestLink[]) {
	// try to find a new question
	for (const link of links) {
		const alreadyInStore = store.some((_q) => _q.id === link.id)
		if (!alreadyInStore) pendingLinks.push(link.url)
	}
	if (pendingLinks.length === 0) {
		// nothing found, add random question
		pendingLinks.push(links[Math.floor(Math.random() * links.length)].url)
	}
}

async function retrieveNextQuestion() {
	const cuestionario = await getQuestion(pendingLinks.pop())
	parseNextLinks(cuestionario.links)

	const alreadyInStore = store.some((_q) => _q.id === cuestionario.pregunta.id)
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
