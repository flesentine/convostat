import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const icon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#1f4f42"/>
  <rect x="88" y="88" width="152" height="152" rx="44" fill="#79b9d6"/>
  <rect x="272" y="88" width="152" height="152" rx="44" fill="#7fd0a8"/>
  <rect x="88" y="272" width="152" height="152" rx="44" fill="#e0776a"/>
  <rect x="272" y="272" width="152" height="152" rx="44" fill="#e6b566"/>
  <circle cx="256" cy="256" r="38" fill="#fdfbf7"/>
</svg>`

const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1f4f42"/>
  <rect x="112" y="112" width="132" height="132" rx="38" fill="#79b9d6"/>
  <rect x="268" y="112" width="132" height="132" rx="38" fill="#7fd0a8"/>
  <rect x="112" y="268" width="132" height="132" rx="38" fill="#e0776a"/>
  <rect x="268" y="268" width="132" height="132" rx="38" fill="#e6b566"/>
  <circle cx="256" cy="256" r="34" fill="#fdfbf7"/>
</svg>`

await mkdir('public', { recursive: true })

await sharp(Buffer.from(icon)).resize(192, 192).png().toFile('public/pwa-192.png')
await sharp(Buffer.from(icon)).resize(512, 512).png().toFile('public/pwa-512.png')
await sharp(Buffer.from(maskable))
  .resize(512, 512)
  .png()
  .toFile('public/pwa-maskable-512.png')
await sharp(Buffer.from(icon))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')

console.log('icons written to public/')
