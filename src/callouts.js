import { createElement } from './utils.js'

// Cache for enhanced callouts to avoid re-processing
const enhancedCallouts = new WeakSet()

export const enhanceCallouts = root => {
	const kinds = ['note', 'tip', 'important', 'warning', 'caution']
	const rx = new RegExp(`^\\s*\\[!(${kinds.map(k => k.toUpperCase()).join('|')})\\]\\s*`, 'i')

	Array.from(root.querySelectorAll('blockquote')).forEach(bq => {
		// Skip if already enhanced
		if (enhancedCallouts.has(bq)) return

		const first = bq.firstElementChild
		if (!first || first.tagName !== 'P') return

		const m = first.textContent.match(rx)
		if (!m) return

		const kind = m[1].toLowerCase()
		if (!kinds.includes(kind)) return

		first.textContent = first.textContent.replace(rx, '').trim()
		const wrapper = createElement('div', {
			className: 'callout',
		})
		wrapper.setAttribute('data-kind', kind)
		wrapper.setAttribute('data-title', kind.toUpperCase())

		while (bq.firstChild) wrapper.appendChild(bq.firstChild)
		bq.replaceWith(wrapper)

		// Mark as enhanced
		enhancedCallouts.add(wrapper)
	})
}
