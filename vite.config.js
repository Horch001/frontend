import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('http://localhost:4000'),
    'import.meta.env.VITE_POINTS_PER_PI': JSON.stringify('1')
  }
})


