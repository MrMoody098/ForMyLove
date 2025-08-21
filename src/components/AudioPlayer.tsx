import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Track = { url: string; name: string }

export const AudioPlayer: React.FC = () => {
	const tracks: Track[] = useMemo(() => {
		const sources: Record<string, string>[] = []
		sources.push(import.meta.glob('../songs/**/*.{mp3,m4a,ogg,wav,webm}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)
		sources.push(import.meta.glob('../assets/songs/**/*.{mp3,m4a,ogg,wav,webm}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>)
		const mod = Object.assign({}, ...sources)
		return Object.entries(mod)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([path, url]) => {
				const file = path.split('/').pop() || 'track'
				const decoded = decodeURIComponent(file)
				return { url, name: decoded }
			})
	}, [])

	const [index, setIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [shuffle, setShuffle] = useState(false)
	const [loop, setLoop] = useState(true)
	const [volume, setVolume] = useState(0.6)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		if (!audioRef.current) return
		audioRef.current.volume = volume
	}, [volume])

	useEffect(() => {
		if (!audioRef.current) return
		if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false))
		else audioRef.current.pause()
	}, [isPlaying, index])

	const playNext = () => {
		if (shuffle && tracks.length > 1) {
			let next = Math.floor(Math.random() * tracks.length)
			if (next === index) next = (next + 1) % tracks.length
			setIndex(next)
			return
		}
		setIndex((i) => (i + 1) % Math.max(1, tracks.length))
	}

	const playPrev = () => setIndex((i) => (i - 1 + Math.max(1, tracks.length)) % Math.max(1, tracks.length))

	if (tracks.length === 0) return (
		<div className="audio-player"><div className="ap-title">Add songs in src/songs/ (*.mp3, *.m4a, *.ogg, *.wav)</div></div>
	)

	return (
		<div className="audio-player">
			<audio
				ref={audioRef}
				src={tracks[index].url}
				onEnded={() => (loop ? playNext() : setIsPlaying(false))}
				preload="metadata"
			/>
			<div className="ap-row">
				<button className="ap-btn" onClick={playPrev} aria-label="Previous">⏮</button>
				<button className="ap-btn" onClick={() => setIsPlaying((p) => !p)} aria-label="Play/Pause">{isPlaying ? '⏸' : '▶️'}</button>
				<button className="ap-btn" onClick={playNext} aria-label="Next">⏭</button>
				<button className={`ap-btn ${shuffle ? 'ap-active' : ''}`} onClick={() => setShuffle((s) => !s)} aria-label="Shuffle">🔀</button>
				<button className={`ap-btn ${loop ? 'ap-active' : ''}`} onClick={() => setLoop((l) => !l)} aria-label="Loop">🔁</button>
				<input className="ap-vol" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
			</div>
			<motion.div className="ap-title" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 0.9, y: 0 }}>
				{tracks[index].name}
			</motion.div>
		</div>
	)
}


