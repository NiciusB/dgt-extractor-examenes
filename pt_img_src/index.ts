import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

type StoreItem = {
	id: string
	imgUrl: string
}

const store: StoreItem[] = JSON.parse(
	fs.readFileSync(
		path.join(__dirname, '..', 'store', 'practicatest.json'),
		'utf-8'
	)
).map((q) => ({ id: q.id, imgUrl: q.urlImagen }))

const img_folder = path.join(__dirname, '..', 'store_pt_img')

async function main() {
	try {
		fs.mkdirSync(img_folder)
	} catch (err) {}
	const existingFilesIDs = fs
		.readdirSync(img_folder)
		.map((filename) => filename.split('.')[0])

	const storeWithoutFiles = store.filter(
		(q) => !existingFilesIDs.includes(q.id)
	)

	for (const store of storeWithoutFiles) {
		await downloadImage(store)
		await new Promise((resolve) => setTimeout(resolve, 1500))
	}
}
main()

async function downloadImage(store: StoreItem) {
	const res = await fetch(store.imgUrl)
	await new Promise((resolve, reject) => {
		const fileStream = fs.createWriteStream(
			path.join(img_folder, `${store.id}.jpg`)
		)
		res.body.pipe(fileStream)
		res.body.on('error', (err) => {
			reject(err)
		})
		fileStream.on('finish', function () {
			resolve()
		})
	})
}
