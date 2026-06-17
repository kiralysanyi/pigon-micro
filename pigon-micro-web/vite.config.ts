import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
// TODO: add proper icon
export default defineConfig({
  plugins: [react(), VitePWA({
    manifest: {
      name: "Pigon Micro",
      short_name: "Pigon",
      start_url: "/",
      description: "Pigon Micro by kiralysanyi",
      icons: [{
        src: "/icon.png",
        type: "image/png",
        sizes: '256x256'
      }]
    }
  })],
})
