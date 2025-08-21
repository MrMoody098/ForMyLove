import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
	plugins: [react()],
	// Use base only in production (GitHub Pages)
	base: mode === 'production' ? '/ForMyLove/' : '/',
}))


