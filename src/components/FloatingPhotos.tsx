import React, { useMemo, useRef } from 'react'
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
}

const DraggablePhoto: React.FC<DraggablePhotoProps> = ({ name, seed, size, angle }) => {
	const src = `/photos/${encodeURIComponent(name)}`
	const x = useMotionValue(0)
	const y = useMotionValue(0)
	const vx = useRef((seededRandom(seed + 900) - 0.5) * 40) // px/s
	const vy = useRef((seededRandom(seed + 901) - 0.5) * 40)
	const wRef = useRef<number>(size)
	const hRef = useRef<number>(Math.round(size * 4 / 3))

	// initial position in px
	const initX = useRef<number>(Math.round((6 + seededRandom(seed + 1) * 88) / 100 * (typeof window !== 'undefined' ? window.innerWidth : 1200)))
	const initY = useRef<number>(Math.round((8 + seededRandom(seed + 2) * 74) / 100 * (typeof window !== 'undefined' ? window.innerHeight : 800)))
	if (x.get() === 0 && y.get() === 0) {
		x.set(initX.current)
		y.set(initY.current)
	}

	useAnimationFrame((t, deltaMs) => {
		const delta = deltaMs / 1000 // seconds
		if (delta <= 0) return
		// apply simple friction
		const friction = 0.985
		vx.current *= friction
		vy.current *= friction

		let nextX = x.get() + vx.current * delta
		let nextY = y.get() + vy.current * delta

		const W = typeof window !== 'undefined' ? window.innerWidth : 1200
		const H = typeof window !== 'undefined' ? window.innerHeight : 800
		const w = wRef.current
		const h = hRef.current

		// wrap-around
		if (nextX < -w) nextX = W
		if (nextX > W) nextX = -w
		if (nextY < -h) nextY = H
		if (nextY > H) nextY = -h

		x.set(nextX)
		y.set(nextY)
	})

	return (
		<motion.img
			src={src}
			alt=""
			className="photo-card"
			style={{ x, y, width: `${size}px` }}
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
	const spec = useMemo(() => {
		return photos.map((_, index) => {
			const angle = (seededRandom(index + 1001) - 0.5) * 12 // -6..6
			const size = 160 + Math.round(seededRandom(index + 2001) * 140) // 160..300
			return { seed: index + 1, angle, size }
		})
	}, [photos])

	return (
		<div className="photos-layer">
			{photos.map((name, i) => (
				<DraggablePhoto key={name} name={name} seed={spec[i].seed} size={spec[i].size} angle={spec[i].angle} />
			))}
		</div>
	)
}


