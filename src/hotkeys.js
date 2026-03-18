import { HOTKEYS } from './settings.js'
import { getActionHandlers } from './actions.js'
import { $ } from './utils.js'

// Key event handler
export const createKeyHandler = settingsDialog => e => {
	// Allow hotkeys to work even when editor is focused
	// Only skip if it's a regular input/textarea (not CodeMirror)
	if (e.target.matches('input:not([data-cm-editor]), textarea:not([data-cm-editor])')) return

	const key = e.key.toLowerCase()
	const hasCtrl = e.ctrlKey || e.metaKey
	const hasShift = e.shiftKey

	// Special keys handled by regular hotkey system

	// Build modifier string
	let modifierString = ''
	if (hasCtrl) modifierString += 'ctrl+'
	if (hasShift) modifierString += 'shift+'
	const fullKey = modifierString + key

	// Regular hotkeys
	const hotkey = HOTKEYS.find(([k]) => k === fullKey)
	if (hotkey) {
		e.preventDefault()
		const [, , targetId] = hotkey

		// Special handling for settings
		if (targetId === 'settings') {
			settingsDialog.show()
			return
		}

		// Special handling for cycle-color-scheme (button may not exist in DOM)
		if (targetId === 'cycle-color-scheme') {
			const handlers = getActionHandlers()
			const handler = handlers[targetId]
			if (handler && window.showToast) {
				handler(window.showToast)
			}
			return
		}

		// Special handling for cycle-preview-theme (button may not exist in DOM)
		if (targetId === 'cycle-preview-theme') {
			const handlers = getActionHandlers()
			const handler = handlers[targetId]
			if (handler && window.showToast) {
				handler(window.showToast)
			}
			return
		}

		// Special handling for toggle-reader-mode (button may not exist in DOM)
		if (targetId === 'toggle-reader-mode') {
			const handlers = getActionHandlers()
			const handler = handlers[targetId]
			if (handler && window.showToast) {
				handler(window.showToast)
			}
			return
		}

		// Special handling for print
		if (targetId === 'print') {
			window.print()
			return
		}

		// Special handling for quit
		if (targetId === 'quit') {
			const handlers = getActionHandlers()
			handlers[targetId]?.()
			return
		}

		// Special handling for toggle-editor-sync (button may not exist in DOM)
		if (targetId === 'toggle-editor-sync') {
			const handlers = getActionHandlers()
			const handler = handlers[targetId]
			if (handler && window.showToast) {
				handler(window.showToast)
			}
			return
		}

		$(targetId)?.click()
	}
}

// Setup hotkeys
export const setupHotkeys = settingsDialog => {
	window.addEventListener('keydown', createKeyHandler(settingsDialog), true)
}
