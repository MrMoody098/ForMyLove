import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { PhotoModal } from './PhotoModal'

type FloatingPhotosProps = {
	photos?: string[]
}

function seededRandom(seed: number) {
	let x = Math.sin(seed) * 10000
	return x - Math.floor(x)
}

type DraggablePhotoProps = {
	name: string
	seed: number
	size: number
	angle: number
	getSize: () => { width: number; height: number }
	index: number
	getShared: () => { x: number[]; y: number[]; sizes: number[] }
	scale: number
	sizeTick: number
	getInitial: (index: number) => { x: number; y: number }
}

const DraggablePhoto: React.FC<DraggablePhotoProps & { onDoubleClick?: () => void }> = ({ name, seed, size, angle, getSize, index, getShared, scale, sizeTick, getInitial, onDoubleClick }) => {
	const base = (import.meta as any).env?.BASE_URL || '/'
	const isAbsolute = /^(https?:|\/|data:)/.test(name)
	const src = isAbsolute ? name : `${base.replace(/\/$/, '/')}${`photos/${encodeURIComponent(name)}`.replace(/^\/+/, '')}`
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const vx = useRef((seededRandom(seed + 900) - 0.5) * 40) // px/s
	const vy = useRef((seededRandom(seed + 901) - 0.5) * 40)
	const wRef = useRef<number>(size * scale)
	const hRef = useRef<number>(Math.round(size * scale * 4 / 3))
	useEffect(() => {
		wRef.current = size * scale
		hRef.current = Math.round(size * scale * 4 / 3)
	}, [size, scale])

	// initial position uses grid via getInitial
	const initialized = useRef(false)
	useEffect(() => {
		const { width: W, height: H } = getSize()
		const w = wRef.current
		const h = hRef.current
		const pad = Math.max(8, 16 * scale)
		if (!initialized.current && W > 0 && H > 0) {
			// use grid-based initial distribution instead of purely random
			const p = getInitial(index)
			const minX = pad
			const maxX = Math.max(pad, W - w - pad)
			const minY = pad
			const maxY = Math.max(pad, H - h - pad)
			const x0 = Math.min(maxX, Math.max(minX, p.x))
			const y0 = Math.min(maxY, Math.max(minY, p.y))
			x.set(Math.round(x0))
			y.set(Math.round(y0))
			initialized.current = true
		}
	}, [getSize, x, y, getInitial, index])

	// Re-clamp into view on container resize
	useEffect(() => {
		const { width: W, height: H } = getSize()
		const w = wRef.current
		const h = hRef.current
		const pad = Math.max(8, 16 * scale)
		const minX = pad
		const maxX = Math.max(pad, W - w - pad)
		const minY = pad
		const maxY = Math.max(pad, H - h - pad)
		x.set(Math.min(maxX, Math.max(minX, x.get())))
		y.set(Math.min(maxY, Math.max(minY, y.get())))
		// also store into shared so repulsion uses the clamped value immediately
		const shared = getShared()
		shared.x[index] = x.get()
		shared.y[index] = y.get()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sizeTick])

	useAnimationFrame((t, deltaMs) => {
		const delta = deltaMs / 1000 // seconds
		if (delta <= 0) return
		// apply simple friction
		const friction = 0.985
		vx.current *= friction
		vy.current *= friction

		let nextX = x.get() + vx.current * delta
		let nextY = y.get() + vy.current * delta

		const { width: W, height: H } = getSize()
		const w = wRef.current
		const h = hRef.current
		const pad = Math.max(8, 16 * scale)

		// simple repulsion to avoid overlaps
		const shared = getShared()
		const thisRadius = Math.min(w, h) * 0.5
		for (let j = 0; j < shared.x.length; j++) {
			if (j === index) continue
			const ox = shared.x[j]
			const oy = shared.y[j]
			if (!Number.isFinite(ox) || !Number.isFinite(oy)) continue
			const otherW = shared.sizes[j]
			const otherH = Math.round(shared.sizes[j] * 4 / 3)
			const otherRadius = Math.min(otherW, otherH) * 0.5
			const dx = nextX - ox
			const dy = nextY - oy
			const dist = Math.hypot(dx, dy) || 0.0001
			const minDist = (thisRadius + otherRadius) * 0.92
			if (dist < minDist) {
				const push = (minDist - dist)
				nextX += (dx / dist) * push * 0.6
				nextY += (dy / dist) * push * 0.6
				vx.current *= 0.9
				vy.current *= 0.9
			}
		}

		// clamp within container bounds, lightly bounce by damping velocity
		const minX = pad
		const maxX = Math.max(pad, W - w - pad)
		const minY = pad
		const maxY = Math.max(pad, H - h - pad)
		if (nextX < minX) { nextX = minX; vx.current *= -0.25 }
		if (nextX > maxX) { nextX = maxX; vx.current *= -0.25 }
		if (nextY < minY) { nextY = minY; vy.current *= -0.25 }
		if (nextY > maxY) { nextY = maxY; vy.current *= -0.25 }

		x.set(nextX)
		y.set(nextY)

		// update shared arrays for others to read next frame
		shared.x[index] = nextX
		shared.y[index] = nextY
	})

	return (
		<motion.img
			src={src}
			alt=""
			className="photo-card"
			style={{ x, y, width: `${size * scale}px` }}
			initial={{ opacity: 0, scale: 0.95, rotate: angle }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.8, ease: 'easeOut' }}
			drag
			dragMomentum={false}
			dragElastic={0.12}
			onDrag={(_e, info) => {
				// update during drag and clamp within bounds
				const { width: W, height: H } = getSize()
				const w = wRef.current
				const h = hRef.current
				const pad = Math.max(8, 16 * scale)
				const minX = pad
				const maxX = Math.max(pad, W - w - pad)
				const minY = pad
				const maxY = Math.max(pad, H - h - pad)
				let nx = x.get() + info.delta.x
				let ny = y.get() + info.delta.y
				nx = Math.min(maxX, Math.max(minX, nx))
				ny = Math.min(maxY, Math.max(minY, ny))
				x.set(nx)
				y.set(ny)
				// store velocity in px/s for inertia loop
				vx.current = info.velocity.x
				vy.current = info.velocity.y
				const shared = getShared()
				shared.x[index] = nx
				shared.y[index] = ny
			}}
			whileHover={{ scale: 1.06 }}
			onDoubleClick={onDoubleClick}
		/>
	)
}

export const FloatingPhotos: React.FC<FloatingPhotosProps> = ({ photos }) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const sizeRef = useRef<{ width: number; height: number }>({ width: 1200, height: 800 })
	const sharedRef = useRef<{ x: number[]; y: number[]; sizes: number[] }>({ x: [], y: [], sizes: [] })
	const [scale, setScale] = useState(1)
	const [sizeTick, setSizeTick] = useState(0)
	const [openName, setOpenName] = useState<string | null>(null)

	useEffect(() => {
		const el = rootRef.current?.parentElement as HTMLElement | null
		if (!el) return
		const update = () => {
			sizeRef.current = { width: el.clientWidth, height: el.clientHeight }
			// responsive scaling for mobile/tablet
			const w = sizeRef.current.width
			if (w < 360) setScale(0.5)
			else if (w < 420) setScale(0.6)
			else if (w < 640) setScale(0.7)
			else if (w < 900) setScale(0.85)
			else setScale(1)
			setSizeTick(t => t + 1)
		}
		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => ro.disconnect()
	}, [])

	const getSize = () => sizeRef.current
	const getShared = () => sharedRef.current

	const autoUrls = useMemo(() => {
		const mod = import.meta.glob('../photos/**/*.{png,jpg,jpeg,webp,gif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
		return Object.values(mod)
	}, [])

	const effectivePhotos = useMemo(() => (photos && photos.length ? photos : autoUrls), [photos, autoUrls])

	const spec = useMemo(() => {
		const N = effectivePhotos.length
		const { width: W, height: H } = sizeRef.current
		const aspect = W > 0 && H > 0 ? W / H : 1
		let columns = Math.max(1, Math.round(Math.sqrt(N * aspect)))
		let rows = Math.max(1, Math.ceil(N / columns))
		const arr = effectivePhotos.map((_, index) => {
			const angle = (seededRandom(index + 1001) - 0.5) * 12 // -6..6
			const size = 140 + Math.round(seededRandom(index + 2001) * 120) // 140..260
			return { seed: index + 1, angle, size }
		})
		sharedRef.current = { x: new Array(arr.length).fill(NaN), y: new Array(arr.length).fill(NaN), sizes: arr.map(a => a.size) }
		// Pre-compute grid-based initial positions
		;(sharedRef.current as any).initial = { columns, rows }
		return arr
	}, [effectivePhotos])

	// Provide an initial equal-spread grid position with slight jitter
	const getInitial = (index: number) => {
		const { width: W, height: H } = sizeRef.current
		const pad = 24
		const grid = (sharedRef.current as any).initial as { columns: number; rows: number } | undefined
		const total = effectivePhotos.length
		const cols = grid?.columns ?? Math.ceil(Math.sqrt(total))
		const rows = grid?.rows ?? Math.ceil(total / cols)
		const halfRows = Math.max(1, Math.floor(rows / 2))
		const topCount = Math.ceil(total / 2)

		const inTopBand = index < topCount
		const indexInBand = inTopBand ? index : index - topCount
		const bandRows = inTopBand ? halfRows : rows - halfRows
		const bandOffset = inTopBand ? 0 : rows - bandRows

		const col = indexInBand % cols
		const rowLocal = Math.floor(indexInBand / cols)
		const row = bandOffset + Math.min(bandRows - 1, rowLocal)

		const cellW = Math.max(1, (W - pad * 2) / cols)
		const cellH = Math.max(1, (H - pad * 2) / rows)
		const jitterX = (seededRandom(index + 3001) - 0.5) * 0.08 * cellW
		const jitterY = (seededRandom(index + 4001) - 0.5) * 0.08 * cellH
		const x = pad + col * cellW + cellW * 0.5 + jitterX
		const y = pad + row * cellH + cellH * 0.5 + jitterY
		return { x, y }
	}

	return (
		<div className="photos-layer" ref={rootRef}>
			{effectivePhotos.map((name, i) => (
				<DraggablePhoto
					key={name}
					name={name}
					seed={spec[i].seed}
					size={spec[i].size}
					angle={spec[i].angle}
					getSize={getSize}
					index={i}
					getShared={getShared}
					scale={scale}
					sizeTick={sizeTick}
					getInitial={getInitial}
					onDoubleClick={() => setOpenName(name)}
				/>
			))}
			<PhotoModal name={openName} onClose={() => setOpenName(null)} />
		</div>
	)
}


