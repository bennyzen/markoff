import '@fontsource/bungee'
import '@fontsource/monaspace-argon'
import '@fontsource/monaspace-argon/400-italic.css'
import '@fontsource/monaspace-argon/700.css'
import '@fontsource/monaspace-krypton'
import '@fontsource/monaspace-krypton/400-italic.css'
import '@fontsource/monaspace-krypton/700.css'
import '@fontsource/fira-code'
import '@fontsource/inter'
import '@fontsource/literata'
import '@fontsource/public-sans'
import '@fontsource/public-sans/100.css'
import '@fontsource/source-serif-4'
import '@fontsource/space-grotesk'
import 'iconify-icon'
import tablerIcons from '@iconify-json/tabler/icons.json' with { type: 'json' }
import './style.css'
import './components.css'
import './themes.css'
import './preview-themes.css'
import { createEditor } from './core.js'
import { setupPreview } from './preview.js'
import { initUI } from './ui.js'
import { injectCustomThemesCSS } from './utils.js'
import { updatePWAUI } from './actions.js'

const boot = async () => {
	injectCustomThemesCSS()

	// Configure iconify to use local Tabler icons instead of API
	// Wait for iconify-icon to be ready, then add the collection
	const addTablerIcons = () => {
		if (window.Iconify && window.Iconify.addCollection) {
			window.Iconify.addCollection(tablerIcons)
		} else if (window.customElements && window.customElements.get('iconify-icon')) {
			const iconifyIcon = window.customElements.get('iconify-icon')
			if (iconifyIcon.addCollection) {
				iconifyIcon.addCollection(tablerIcons)
			}
		}
	}

	// Try immediately and also when DOM is ready
	addTablerIcons()
	document.addEventListener('DOMContentLoaded', addTablerIcons)

	const { getMarkdown, setMarkdown, onMarkdownUpdated, cleanup, profiler, scrollToLine, view } = await createEditor()
	const { previewHtml } = await initUI({ getMarkdown, setMarkdown, scrollToLine, view })
	setupPreview({ getMarkdown, onMarkdownUpdated, previewHtml, profiler })

	// Handle PWA install prompt - setup after UI is initialized
	window.addEventListener('beforeinstallprompt', event => {
		event.preventDefault()
		// If pwa-installed flag was set, app was uninstalled - clear flags
		if (localStorage.getItem('pwa-installed') === 'true') {
			localStorage.removeItem('pwa-installed')
			localStorage.removeItem('pwa-banner-dismissed')
		}
		window.deferredPrompt = event
		updatePWAUI()
	})

	// Clear install prompt after successful install
	window.addEventListener('appinstalled', () => {
		localStorage.setItem('pwa-installed', 'true')
		window.deferredPrompt = null
		updatePWAUI()
	})

	// Handle files opened via OS "Open With"
	const native = window.__ELECTRON__ || window.__TAURI_INTERNALS__

	if (native) {
		const api = window.__ELECTRON__ || {
			readFileText: async path => {
				const { invoke } = await import('@tauri-apps/api/core')
				return invoke('read_file_text', { path })
			},
			getPendingFile: async () => {
				const { invoke } = await import('@tauri-apps/api/core')
				return invoke('get_pending_file')
			},
		}

		const openFileFromPath = async filePath => {
			try {
				const text = await api.readFileText(filePath)
				const dir = filePath.replace(/[/\\][^/\\]+$/, '')
				window.__launchedWithFile = true
				window.__fileBaseDir = dir
				localStorage.setItem('last-file-base-dir', dir)
				setMarkdown(text)
			} catch (e) {
				console.error('Failed to open file:', e)
			}
		}

		try {
			const pendingFile = await api.getPendingFile()
			if (pendingFile) {
				await openFileFromPath(pendingFile)
			} else {
				const savedDir = localStorage.getItem('last-file-base-dir')
				if (savedDir) window.__fileBaseDir = savedDir
			}
		} catch (e) {
			console.error('Failed to get pending file:', e)
		}
	} else if ('launchQueue' in window) {
		// PWA: use Launch Queue API
		window.launchQueue.setConsumer(async launchParams => {
			if (!launchParams.files.length) return
			const fileHandle = launchParams.files[0]
			const file = await fileHandle.getFile()
			const text = await file.text()
			window.__launchedWithFile = true
			window.__fileHandle = fileHandle
			setMarkdown(text)
		})
	}

	// Update PWA UI on initial load (check if already installed)
	updatePWAUI()

	// Expose profiler globally for console inspection
	window.__MARKON_PERF__ = profiler

	// Cleanup storage on page unload
	window.addEventListener('beforeunload', cleanup)
}

boot()
