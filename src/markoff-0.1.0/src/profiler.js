const STORAGE_KEY = 'markoff-profiler-visible'
const BUFFER_SIZE = 20

class LatencyProfiler {
	constructor() {
		this.inputStartTime = null
		this.renderStartTime = null
		this.measurements = []
		this.overlay = null
		this.isVisible = localStorage.getItem(STORAGE_KEY) === 'true'
		this.initOverlay()
	}

	markInputStart() {
		this.inputStartTime = performance.now()
	}

	markRenderStart() {
		this.renderStartTime = performance.now()
	}

	markRenderComplete() {
		if (!this.renderStartTime) return

		const renderLatency = performance.now() - this.renderStartTime
		this.addMeasurement(renderLatency)
		this.updateOverlay()
		this.renderStartTime = null
		this.inputStartTime = null
	}

	// Get total time from input to render completion (including debouncing)
	getTotalLatency() {
		if (!this.inputStartTime) return null
		return performance.now() - this.inputStartTime
	}

	addMeasurement(latency) {
		this.measurements.push(latency)
		if (this.measurements.length > BUFFER_SIZE) {
			this.measurements.shift()
		}
	}

	updateOverlay() {
		if (!this.overlay || !this.isVisible) return

		const latest = this.measurements[this.measurements.length - 1]
		if (!latest) return

		const ms = Math.round(latest)
		this.overlay.textContent = `${ms}ms`

		// Color coding
		this.overlay.className = 'profiler-overlay'
		if (ms < 16) this.overlay.classList.add('good')
		else if (ms < 33) this.overlay.classList.add('ok')
		else this.overlay.classList.add('bad')
	}

	initOverlay() {
		this.overlay = document.createElement('div')
		this.overlay.className = 'profiler-overlay'
		this.overlay.textContent = '0ms'
		document.body.appendChild(this.overlay)

		this.toggle(this.isVisible)
	}

	toggle(force = null) {
		const shouldShow = force !== null ? force : !this.isVisible
		this.isVisible = shouldShow
		this.overlay.style.display = shouldShow ? 'block' : 'none'
		localStorage.setItem(STORAGE_KEY, String(shouldShow))
	}

	getMetrics() {
		const totalLatency = this.getTotalLatency()
		return {
			renderTime: {
				latest: this.measurements[this.measurements.length - 1] || 0,
				average: this.measurements.length ?
					this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length : 0,
				count: this.measurements.length,
				all: [...this.measurements]
			},
			totalLatency: totalLatency,
			debounceTime: totalLatency ? totalLatency - (this.measurements[this.measurements.length - 1] || 0) : null
		}
	}
}

export const createProfiler = () => new LatencyProfiler()
