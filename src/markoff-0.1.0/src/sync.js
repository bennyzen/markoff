const findLineInMarkdown = (markdown, text) => {
	const searchText = text.trim().toLowerCase()
	if (!searchText) return null
	
	const lines = markdown.split('\n')
	const index = lines.findIndex(line => {
		const normalized = line.trim().toLowerCase()
		return normalized === searchText || normalized.includes(searchText) || searchText.includes(normalized)
	})
	
	return index >= 0 ? index + 1 : null
}

const findHeaderInMarkdown = (markdown, header) => {
	const prefix = '#'.repeat(header.level) + ' '
	const escapedText = header.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const pattern = new RegExp(`^${prefix}${escapedText}\\s*(?:\\{#.*\\})?$`, 'm')
	const match = markdown.match(pattern)
	return match ? markdown.substring(0, match.index).split('\n').length : null
}

const matchesText = (elText, searchText) => {
	const normalized = elText.trim().toLowerCase()
	return normalized === searchText || normalized.includes(searchText) || searchText.includes(normalized)
}

const findElementInPreview = (previewHtml, lineText) => {
	const searchText = lineText.trim().toLowerCase()
	if (!searchText || !previewHtml) return null
	
	const selectors = [
		['h1, h2, h3, h4, h5, h6'],
		['p, li, code, pre, blockquote']
	]
	
	for (const selector of selectors) {
		const elements = previewHtml.querySelectorAll(selector)
		const found = Array.from(elements).find(el => matchesText(el.textContent, searchText))
		if (found) return found
	}
	
	return null
}

const getVisibleLineFromEditor = (view) => {
	if (!view) return null
	
	const scrollDOM = view.scrollDOM
	const rect = scrollDOM.getBoundingClientRect()
	const topPos = view.posAtCoords({ x: rect.left, y: rect.top })
	if (topPos === null) return null
	
	const line = view.state.doc.lineAt(topPos)
	return { line: line.number, text: line.text }
}

const getVisibleElementFromPreview = (previewContainer) => {
	const previewHtml = previewContainer.querySelector('#previewhtml')
	if (!previewHtml) return null
	
	const containerRect = previewContainer.getBoundingClientRect()
	const scrollTop = previewContainer.scrollTop || previewHtml.scrollTop
	const viewportTop = containerRect.top + 20
	
	const elements = Array.from(previewHtml.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, code, pre, blockquote'))
	
	const inViewport = elements
		.map(el => {
			const elRect = el.getBoundingClientRect()
			const elTop = elRect.top
			const inRange = elTop <= viewportTop && elRect.bottom >= viewportTop
			return { el, elTop, inRange, distance: Math.abs(elTop - viewportTop) }
		})
		.filter(({ inRange }) => inRange)
		.reduce((closest, current) => 
			current.distance < closest.distance ? current : closest, 
			{ distance: Infinity }
		)
	
	const closestEl = inViewport.distance < Infinity 
		? inViewport.el 
		: elements.find(el => el.getBoundingClientRect().top > viewportTop)
	
	if (!closestEl) return null
	
	const text = closestEl.textContent.trim()
	const isHeader = /^h[1-6]$/i.test(closestEl.tagName)
	return { 
		element: closestEl, 
		text,
		isHeader,
		level: isHeader ? parseInt(closestEl.tagName[1]) : null
	}
}

export const createScrollSync = (editorView, previewContainer, getMarkdown, scrollToLine) => {
	let enabled = false
	let syncingEditor = false
	let syncingPreview = false
	let editorScrollHandler = null
	let previewScrollHandler = null
	let previewScroller = null
	let previewHtmlScroller = null
	let editorDebounceTimer = null
	let previewDebounceTimer = null

	const syncEditorToPreview = () => {
		if (syncingEditor || syncingPreview || !enabled) return
		
		clearTimeout(editorDebounceTimer)
		editorDebounceTimer = setTimeout(() => {
			if (syncingEditor || syncingPreview || !enabled) return
			
			syncingEditor = true
			requestAnimationFrame(() => {
				const visible = getVisibleLineFromEditor(editorView)
				if (!visible) {
					syncingEditor = false
					return
				}
				
				const previewHtml = previewContainer.querySelector('#previewhtml')
				if (!previewHtml) {
					syncingEditor = false
					return
				}
				
				const targetEl = findElementInPreview(previewHtml, visible.text)
				if (!targetEl) {
					syncingEditor = false
					return
				}
				
				targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
				setTimeout(() => { syncingEditor = false }, 300)
			})
		}, 50)
	}

	const syncPreviewToEditor = () => {
		if (syncingEditor || syncingPreview || !enabled) return
		
		clearTimeout(previewDebounceTimer)
		previewDebounceTimer = setTimeout(() => {
			if (syncingEditor || syncingPreview || !enabled) return
			
			syncingPreview = true
			requestAnimationFrame(() => {
				const visible = getVisibleElementFromPreview(previewContainer)
				if (!visible) {
					syncingPreview = false
					return
				}
				
				const markdown = getMarkdown()
				if (!markdown) {
					syncingPreview = false
					return
				}
				
				const lineNumber = (visible.isHeader && visible.level)
					? findHeaderInMarkdown(markdown, { text: visible.text, level: visible.level })
					: findLineInMarkdown(markdown, visible.text)
				
				if (!lineNumber || !scrollToLine) {
					syncingPreview = false
					return
				}
				
				scrollToLine(lineNumber)
				setTimeout(() => { syncingPreview = false }, 300)
			})
		}, 50)
	}

	const enable = () => {
		if (enabled) return
		enabled = true
		const editorScroller = editorView.scrollDOM
		const previewHtml = previewContainer.querySelector('#previewhtml')
		
		editorScrollHandler = () => syncEditorToPreview()
		previewScrollHandler = () => syncPreviewToEditor()
		
		editorScroller.addEventListener('scroll', editorScrollHandler, { passive: true })
		
		previewScroller = previewContainer
		previewScroller.addEventListener('scroll', previewScrollHandler, { passive: true })
		
		if (previewHtml) {
			previewHtmlScroller = previewHtml
			previewHtmlScroller.addEventListener('scroll', previewScrollHandler, { passive: true })
		}
	}

	const disable = () => {
		if (!enabled) return
		enabled = false
		
		const editorScroller = editorView.scrollDOM
		if (editorScrollHandler) {
			editorScroller.removeEventListener('scroll', editorScrollHandler)
			editorScrollHandler = null
		}
		
		if (!previewScrollHandler) {
			previewScroller = null
			previewHtmlScroller = null
			return
		}
		
		if (previewScroller) {
			previewScroller.removeEventListener('scroll', previewScrollHandler)
		}
		if (previewHtmlScroller) {
			previewHtmlScroller.removeEventListener('scroll', previewScrollHandler)
		}
		
		previewScrollHandler = null
		previewScroller = null
		previewHtmlScroller = null
	}

	return { enable, disable }
}

