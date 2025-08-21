import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'

type FloatingPhotosProps = {
	photos: string[]
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
}

const DraggablePhoto: React.FC<DraggablePhotoProps> = ({ name, seed, size, angle, getSize, index, getShared, scale, sizeTick }) => {
	const base = (import.meta as any).env?.BASE_URL || '/'
	const src = `${base.replace(/\/$/, '/')}${`photos/${encodeURIComponent(name)}`.replace(/^\/+/, '')}`
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

	// initial position relative to container
	const seededLeft = seededRandom(seed + 1)
	const seededTop = seededRandom(seed + 2)
	const initialized = useRef(false)
	useEffect(() => {
		const { width: W, height: H } = getSize()
		const w = wRef.current
		const h = hRef.current
		const pad = Math.max(8, 16 * scale)
		if (!initialized.current && W > 0 && H > 0) {
			const x0 = pad + seededLeft * Math.max(1, W - 2 * pad - w)
			const y0 = pad + seededTop * Math.max(1, H - 2 * pad - h)
			x.set(Math.round(x0))
			y.set(Math.round(y0))
			initialized.current = true
		}
	}, [getSize, x, y])

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

		// wrap-around
		if (nextX < -w) nextX = W
		if (nextX > W) nextX = -w
		if (nextY < -h) nextY = H
		if (nextY > H) nextY = -h

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
				// update during drag
				x.set(x.get() + info.delta.x)
				y.set(y.get() + info.delta.y)
				// store velocity in px/s for inertia loop
				vx.current = info.velocity.x
				vy.current = info.velocity.y
			}}
			whileHover={{ scale: 1.06 }}
		/>
	)
}

export const FloatingPhotos: React.FC<FloatingPhotosProps> = ({ photos }) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const sizeRef = useRef<{ width: number; height: number }>({ width: 1200, height: 800 })
	const sharedRef = useRef<{ x: number[]; y: number[]; sizes: number[] }>({ x: [], y: [], sizes: [] })
	const [scale, setScale] = useState(1)
	const [sizeTick, setSizeTick] = useState(0)

	useEffect(() => {
		const el = rootRef.current
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

	const spec = useMemo(() => {
		const arr = photos.map((_, index) => {
			const angle = (seededRandom(index + 1001) - 0.5) * 12 // -6..6
			const size = 140 + Math.round(seededRandom(index + 2001) * 120) // 140..260
			return { seed: index + 1, angle, size }
		})
		sharedRef.current = { x: new Array(arr.length).fill(NaN), y: new Array(arr.length).fill(NaN), sizes: arr.map(a => a.size) }
		return arr
	}, [photos])

	return (
		<div className="photos-layer" ref={rootRef}>
			{photos.map((name, i) => (
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
				/>
			))}
		</div>
	)
}


