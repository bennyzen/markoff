// Web Worker-based storage - moves localStorage operations off main thread
let storageWorker = null
let isWorkerReady = false

const createStorageWorker = () => {
	if (!window.Worker) {
		console.warn('Web Workers not supported, falling back to main thread storage')
		return null
	}

	try {
		const worker = new Worker(new URL('./worker.js', import.meta.url))

		worker.onmessage = (event) => {
			const { type, content } = event.data

			switch (type) {
				case 'CONTENT_LOADED':
					// Skip restore if a file was opened via OS file handler
					if (content && !window.__launchedWithFile) {
						window.setMarkdown?.(content)
					}
					break
			}
		}

		worker.onerror = (error) => {
			console.error('Storage worker error:', error)
		}

		return worker
	} catch (error) {
		console.warn('Failed to create storage worker:', error)
		return null
	}
}

const loadFromStorage = () => {
	if (storageWorker && isWorkerReady) {
		storageWorker.postMessage({ type: 'LOAD_CONTENT' })
		return null // Content will be set via worker message
	}

	// No fallback - IndexedDB only
	console.warn('Storage worker not available')
	return null
}

export const createStorage = ({ onMarkdownUpdated, initialContent = '' }) => {
	// Initialize worker
	storageWorker = createStorageWorker()

	if (storageWorker) {
		isWorkerReady = true
	}

	const cleanup = () => {
		if (storageWorker) {
			storageWorker.terminate()
			storageWorker = null
			isWorkerReady = false
		}
		window.removeEventListener('beforeunload', handleBeforeUnload)
		document.removeEventListener('visibilitychange', handleVisibilityChange)
	}

	const handleBeforeUnload = () => {
		if (storageWorker && isWorkerReady) {
			const content = window.getMarkdown?.() || ''
			storageWorker.postMessage({ type: 'FLUSH_NOW', content })
		}
	}

	const handleVisibilityChange = () => {
		if (document.visibilityState === 'hidden' && storageWorker && isWorkerReady) {
			const content = window.getMarkdown?.() || ''
			storageWorker.postMessage({ type: 'FLUSH_NOW', content })
		}
	}

	const debouncedSave = (content) => {
		if (storageWorker && isWorkerReady) {
			storageWorker.postMessage({ type: 'SAVE_CONTENT', content })
		} else {
			// No fallback - IndexedDB only
			console.warn('Storage worker not available, cannot save')
		}
	}

	// Set up event listeners
	onMarkdownUpdated(debouncedSave)
	window.addEventListener('beforeunload', handleBeforeUnload)
	document.addEventListener('visibilitychange', handleVisibilityChange)

	return { load: loadFromStorage, cleanup }
}
