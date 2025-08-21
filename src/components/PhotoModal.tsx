import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

type PhotoModalProps = {
	name: string | null
	onClose: () => void
}

export const PhotoModal: React.FC<PhotoModalProps> = ({ name, onClose }) => {
	const isOpen = Boolean(name)
	const base = (import.meta as any).env?.BASE_URL || '/'
	const isAbsolute = name ? /^(https?:|\/|data:)/.test(name) : false
	const src = name ? (isAbsolute ? name : `${base.replace(/\/$/, '/')}${`photos/${encodeURIComponent(name)}`.replace(/^\/+/, '')}`) : ''

	useEffect(() => {
		if (!isOpen) return
		const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
		document.addEventListener('keydown', onKey)
		const prev = document.body.style.overflow
		document.body.style.overflow = 'hidden'
		return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
	}, [isOpen, onClose])

	return createPortal(
		<AnimatePresence>
			{isOpen && (
				<motion.div
					className="modal-backdrop"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={onClose}
				>
					<motion.button
						className="modal-close"
						type="button"
						aria-label="Close"
						onClick={(e) => { e.stopPropagation(); onClose() }}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
					>
						×
					</motion.button>
					<motion.img
						onClick={(e) => e.stopPropagation()}
						className="modal-photo"
						src={src}
						alt=""
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 220, damping: 26 }}
					/>
				</motion.div>
			)}
		</AnimatePresence>,
		document.body
	)
}


