import React from 'react'
import Particles from 'react-tsparticles'
import type { Container, Engine } from 'tsparticles-engine'
import { loadFull } from 'tsparticles'
import { motion } from 'framer-motion'
import { FloatingPhotos } from './components/FloatingPhotos'

export const App: React.FC = () => {
	const particlesInit = async (engine: Engine) => {
		await loadFull(engine)
	}

	const particlesLoaded = async (_container?: Container) => {
		return
	}

	const heartSymbols = ['💖', '💛', '💙', '💜', '❤️']
	const photosList = [
		'9DWT7Ujat2ZWZA29BMwPW.1020.jpg',
		'09gl55piO8wtiaQFoia7m.1020.jpg',
		'AQNaXtRaOgb9nCC1vDmW9.1020.jpg',
		'D9gfhDJ3ddZ1NiKUO6brF.1020.jpg',
		'jopbokehXCNZ4lgzncPd1.1020.jpg',
		'oYXOwvboRKpkDNx7uL2ry.1020.jpg',
		'UIc4bas9W3ld2DZyl1Jx8.1020 (1).jpg',
		'y6rZUQGzeGt3Ax7SjzfLw.1020.jpg',
		'yGh1Z7GThsHIYEaPvJzM5.1020.jpg',
	]

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
				<FloatingPhotos photos={photosList} />
			</section>
		</div>
	)
}


