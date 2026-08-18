import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { mediaObjectExists } from '../lib/r2/storage'

const USER_ID = process.argv[2] || 'a1c962ae-79fd-4c45-853f-b0b5b2f2aa06'
const LOGO_PATH = process.argv[3] || `${USER_ID}/logo_1785024731799.png`

async function run() {
  const logoExists = await mediaObjectExists('branding', LOGO_PATH)
  const faviconPngExists = await mediaObjectExists('branding', `${USER_ID}/favicon.png`)
  const faviconJpgExists = await mediaObjectExists('branding', `${USER_ID}/favicon.jpg`)
  const faviconWebpExists = await mediaObjectExists('branding', `${USER_ID}/favicon.webp`)
  console.log({
    logoPath: LOGO_PATH,
    logoExists,
    faviconPngExists,
    faviconJpgExists,
    faviconWebpExists,
  })
}

void run()
