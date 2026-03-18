import { marked } from 'marked'
import morphdom from 'morphdom'
import { highlightAll } from './syntax.js'
import { enhanceCallouts } from './callouts.js'

marked.setOptions({ gfm: true, breaks: true })

// Local image resolution for files opened from the OS
const dataUrlCache = new Map()

const isRelativeSrc = src =>
	src && !src.startsWith('http') && !src.startsWith('blob:') && !src.startsWith('data:') && !src.startsWith('/')

const resolveImageTauri = async (baseDir, relativePath) => {
	const { invoke } = await import('@tauri-apps/api/core')
	return invoke('read_file_as_data_url', {
		baseDir: baseDir,
		relativePath: relativePath,
	})
}

const resolveImageWeb = async (dirHandle, relativePath) => {
	const normalized = relativePath.replace(/^\.\//, '')
	const parts = normalized.split('/')
	let current = dirHandle

	for (let i = 0; i < parts.length - 1; i++) {
		if (parts[i] === '..' || parts[i] === '') continue
		current = await current.getDirectoryHandle(parts[i])
	}

	const fileHandle = await current.getFileHandle(parts[parts.length - 1])
	const file = await fileHandle.getFile()
	return URL.createObjectURL(file)
}

const handleLocalImages = container => {
	const baseDir = window.__fileBaseDir
	if (!baseDir) return

	const isTauri = typeof baseDir === 'string'
	const images = container.querySelectorAll('img')
	for (const img of images) {
		const src = img.getAttribute('src')
		if (!isRelativeSrc(src)) continue

		if (dataUrlCache.has(src)) {
			img.src = dataUrlCache.get(src)
			continue
		}

		const resolve = isTauri
			? resolveImageTauri(baseDir, src)
			: resolveImageWeb(baseDir, src)

		resolve
			.then(url => {
				dataUrlCache.set(src, url)
				img.src = url
			})
			.catch(e => console.error('Failed to resolve image:', src, e))
	}
}

export const setupPreview = ({ getMarkdown, onMarkdownUpdated, previewHtml, profiler }) => {
	let renderScheduled = false
	let debounceTimer = null
	let lastRenderedContent = ''

	const render = async () => {
		const md = getMarkdown()

		// Skip render if content hasn't changed
		if (md === lastRenderedContent) {
			profiler?.markRenderComplete()
			return
		}

		// Mark when actual rendering starts (after debouncing)
		profiler?.markRenderStart()

		// Create temporary container with new content
		const tempDiv = document.createElement('div')
		// marked.parse renders markdown content to HTML
		tempDiv.innerHTML = marked.parse(md) // eslint-disable-line no-unsanitized/property

		// Process callouts and highlighting on temp DOM
		enhanceCallouts(tempDiv)
		await highlightAll(tempDiv)

		// Use morphdom to efficiently update only changed elements
		morphdom(previewHtml, tempDiv, {
			childrenOnly: true, // Only morph children, not the container itself
			onBeforeElUpdated: (fromEl, toEl) => {
				// Preserve images that are already loaded to prevent re-fetching
				if (fromEl.tagName === 'IMG' && toEl.tagName === 'IMG') {
					if (fromEl.src === toEl.src && fromEl.complete) {
						// Keep the existing loaded image
						return false
					}
				}
				return true
			}
		})

		// Resolve local images for files opened from OS
		handleLocalImages(previewHtml)

		// Update last rendered content
		lastRenderedContent = md

		// Wait for actual paint to complete - this captures the real rendering time
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				profiler?.markRenderComplete()
			})
		})
	}

	const scheduleRender = () => {
		if (renderScheduled) return
		renderScheduled = true

		// Clear any existing debounce timer
		clearTimeout(debounceTimer)

		// Debounce rapid changes
		debounceTimer = setTimeout(() => {
			requestAnimationFrame(async () => {
				renderScheduled = false
				await render()
			})
		}, 50) // 50ms debounce for smooth typing
	}

	// Initial render
	scheduleRender()
	onMarkdownUpdated(scheduleRender)
}
