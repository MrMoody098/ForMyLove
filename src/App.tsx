import React from 'react'
import Particles from 'react-tsparticles'
import type { Container, Engine } from 'tsparticles-engine'
import { loadFull } from 'tsparticles'
import { motion } from 'framer-motion'
import { FloatingPhotos } from './components/FloatingPhotos'
import { AudioPlayer } from './components/AudioPlayer'

export const App: React.FC = () => {
	const particlesInit = async (engine: Engine) => {
		await loadFull(engine)
	}

	const particlesLoaded = async (_container?: Container) => {
		return
	}

	const heartSymbols = ['💖', '💛', '💙', '💜', '❤️']

	return (
		<div className="page">
			<Particles
				id="tsparticles"
				init={particlesInit}
				loaded={particlesLoaded}
				options={{
					fullScreen: { enable: true, zIndex: 0 },
					background: { color: { value: 'transparent' } },
					fpsLimit: 60,
					particles: {
						number: { value: 120, density: { enable: true, area: 800 } },
						color: { value: ['#ff6ec7', '#8be9fd', '#ffd166', '#b084ff'] },
						shape: { type: ['star', 'circle'] },
						opacity: { value: 0.7 },
						size: { value: { min: 1, max: 3 } },
						move: {
							enable: true,
							speed: 0.8,
							direction: 'none',
							outModes: { default: 'out' },
						},
						links: {
							enable: false,
						},
					},
					interactivity: {
						events: {
							onHover: { enable: true, mode: 'repulse' },
							onClick: { enable: true, mode: 'push' },
							resize: true,
						},
						modes: {
							repulse: { distance: 80, duration: 0.4 },
							push: { quantity: 4 },
						},
					},
				}}
			/>

			<div className="content" style={{ position: 'relative', zIndex: 5 }}>
				<motion.h1
					className="title"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 1 }}
			>
				<span className="accent">You're</span> Cute <span className="accent">Phil</span>
			</motion.h1>

				<motion.p
					className="subtitle"
					initial={{ opacity: 0 }}
					animate={{ opacity: 0.95 }}
					transition={{ delay: 0.5, duration: 1 }}
				>
					For an evil person with a crusty phone
				</motion.p>

				<div className="hearts">
					{Array.from({ length: 16 }).map((_, index) => (
						<motion.span
							key={index}
							className="heart"
							initial={{ scale: 0, opacity: 0 }}
							animate={{
								scale: [0.8, 1, 0.8],
								opacity: [0.4, 0.9, 0.4],
								y: [0, -8, 0],
							}}
							transition={{
								repeat: Infinity,
								repeatType: 'mirror',
								duration: 3 + (index % 5) * 0.3,
								delay: (index % 8) * 0.2,
							}}
						>
							{heartSymbols[index % heartSymbols.length]}
						</motion.span>
					))}
				</div>
			</div>

			<section className="photos-section">
				<FloatingPhotos />
			</section>

			<AudioPlayer />

			{/* Spotify link - replace href with your playlist */}
			<a
				className="spotify-link"
				href="https://open.spotify.com/playlist/2OjV96DgNBxywV0o0cHKhC?si=a4f4fa9ecee74006"
				target="_blank"
				rel="noreferrer noopener"
				aria-label="Open Spotify playlist"
			>
				<svg className="spotify-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12S6.2 22.5 12 22.5 22.5 17.8 22.5 12 17.8 1.5 12 1.5zm4.9 15.5c-.2.4-.7.6-1.1.4-3-1.8-6.9-2.2-11.4-1.2-.5.1-.9-.2-1-.7-.1-.5.2-1 .7-1.1 4.9-1.1 9.2-.6 12.6 1.4.4.2.5.7.2 1.2zm1.5-3.2c-.3.4-.9.5-1.3.3-3.4-2.1-8.6-2.7-12.6-1.5-.5.1-1.1-.2-1.2-.7-.2-.5.2-1.1.7-1.2 4.6-1.3 10.4-.6 14.3 1.9.4.2.5.8.1 1.2zm.1-3.4c-3.9-2.3-10.3-2.6-14-1.5-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.4-1.4 11.4-1.1 15.8 1.7.6.3.8 1 .5 1.6-.3.5-1 .7-1.6.5z"/>
				</svg>
			</a>
		</div>
	)
}


