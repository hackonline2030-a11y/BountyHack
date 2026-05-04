"use client"

import React from "react"
import { Section } from "@components/sections/Section"
import { useElementHeightCssVar } from "@modules/app/react/hooks/useElementHeightCssVar"

type BannerSectionProps = {
	children: React.ReactNode
}

/**
 * Client-only banner section that measures its height and exposes it as
 * `--banner-height` so the map section can size itself to the remaining viewport.
 */
export function BannerSection({ children }: BannerSectionProps) {
	const { ref } = useElementHeightCssVar({
		cssVarName: "--banner-height",
		initialPx: 200,
		writeTo: "root",
	})

	return (
		<Section
			ref={ref}
			fluid
			classNames="pt-[var(--header-height)]  -mt-[var(--header-height)] relative bg-pattern flex flex-col justify-center items-center gap-y-10 px-5 md:px-10"
		>
			{children}
		</Section>
	)
}

