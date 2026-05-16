"use client"

import { useCallback, useLayoutEffect, useRef } from "react"
import { observeDynamicHeight } from "@modules/app/core/utils/get-dynamic-height"

type UseElementHeightCssVarOptions = {
	/**
	 * CSS custom property name (including the leading `--`).
	 * Example: `--address-infos-height`
	 */
	cssVarName: `--${string}`
	/**
	 * Initial value used before the first measurement (in px).
	 * Helps reduce layout shift on first paint.
	 */
	initialPx?: number
	/**
	 * Round the measured height to an integer (px).
	 * Reduces update churn caused by sub-pixel differences.
	 */
	roundPx?: boolean
	/**
	 * Where to write the CSS variable.
	 * - "element": write on the measured element (default, best for descendants)
	 * - "root": write on document.documentElement (best for siblings/global usage)
	 */
	writeTo?: "element" | "root"
}

/**
 * Measures an element’s height with ResizeObserver and writes it to a CSS variable
 * on the element itself. Throttled to one write per animation frame.
 */
export function useElementHeightCssVar({
	cssVarName,
	initialPx = 0,
	roundPx = true,
	writeTo = "element",
}: UseElementHeightCssVarOptions) {
	const elRef = useRef<HTMLElement | null>(null)
	const lastWrittenRef = useRef<number | null>(null)
	const rafIdRef = useRef<number | null>(null)

	const measureHeight = useCallback(() => {
		const el = elRef.current
		if (!el) return 0

		// Different layout situations report different “heights”.
		// Use the max to better approximate the visible box.
		const rectH = el.getBoundingClientRect().height
		const offsetH = el.offsetHeight
		const scrollH = el.scrollHeight
		return Math.max(rectH, offsetH, scrollH)
	}, [])

	const writeHeight = useCallback(
		(next: number) => {
			const measuredEl = elRef.current
			if (!measuredEl) return

			const value = roundPx ? Math.round(next) : next
			if (lastWrittenRef.current === value) return

			const target =
				writeTo === "root" ? document.documentElement : measuredEl

			lastWrittenRef.current = value
			target.style.setProperty(cssVarName, `${value}px`)
		},
		[cssVarName, roundPx, writeTo]
	)

	const ref = useCallback(
		(node: HTMLElement | null) => {
			elRef.current = node
			if (node) {
				lastWrittenRef.current = null
				const target =
					writeTo === "root" ? document.documentElement : node
				target.style.setProperty(cssVarName, `${initialPx}px`)
			}
		},
		[cssVarName, initialPx, writeTo]
	)

	useLayoutEffect(() => {
		const el = elRef.current
		if (!el) return

		// Initial synchronous measurement to reduce first-frame mismatch.
		writeHeight(measureHeight())

		const stopObserving = observeDynamicHeight({
			element: el,
			onHeightChange: (height) => {
				// Keep one rAF batching layer here to coalesce fast observer bursts.
				if (rafIdRef.current != null) return
				rafIdRef.current = window.requestAnimationFrame(() => {
					rafIdRef.current = null
					writeHeight(height)
				})
			},
		})

		return () => {
			stopObserving()
			if (rafIdRef.current != null) {
				window.cancelAnimationFrame(rafIdRef.current)
				rafIdRef.current = null
			}
		}
	}, [measureHeight, writeHeight])

	return { ref }
}

