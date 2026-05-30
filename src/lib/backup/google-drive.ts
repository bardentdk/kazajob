/**
 * KAZAJOB — Upload vers Google Drive (sans googleapis)
 * Utilise l'API REST Drive v3 avec Service Account JWT (RS256)
 *
 * Variables d'env requises :
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 *   GOOGLE_DRIVE_FOLDER_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz
 */

import crypto from 'node:crypto'

// ── JWT helpers ───────────────────────────────────────────────────
function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf) : buf
  return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

  if (!email || !rawKey) {
    throw new Error(
      'Variables manquantes : GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'
    )
  }

  const privateKey = rawKey.replace(/\\n/g, '\n')
  const now        = Math.floor(Date.now() / 1000)

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss:   email,
    scope: 'https://www.googleapis.com/auth/drive.file',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  }))

  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${header}.${payload}`)
  const sig = b64url(sign.sign(privateKey))
  const jwt = `${header}.${payload}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google OAuth error : ${err}`)
  }

  const data = await res.json()
  return data.access_token as string
}

// ── Upload multipart vers Drive ───────────────────────────────────
export interface DriveUploadResult {
  fileId:   string
  fileName: string
  webViewLink?: string
  size:     number
}

export async function uploadToDrive(
  content: string,
  fileName: string,
  mimeType = 'application/json'
): Promise<DriveUploadResult> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) throw new Error('Variable GOOGLE_DRIVE_FOLDER_ID manquante')

  const token     = await getAccessToken()
  const boundary  = `kazajob_${Date.now()}`
  const metadata  = JSON.stringify({ name: fileName, parents: [folderId] })
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive upload error (${res.status}) : ${err}`)
  }

  const file = await res.json()
  return {
    fileId:      file.id,
    fileName:    file.name,
    webViewLink: file.webViewLink,
    size:        Buffer.byteLength(content, 'utf8'),
  }
}

// ── Lister les fichiers de backup existants ───────────────────────
export async function listBackups(): Promise<{ id: string; name: string; createdTime: string; size: string }[]> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  if (!folderId) return []

  try {
    const token = await getAccessToken()
    const q     = encodeURIComponent(`'${folderId}' in parents and name contains 'kazajob-backup' and trashed=false`)

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime,size)&orderBy=createdTime+desc&pageSize=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!res.ok) return []
    const data = await res.json()
    return data.files ?? []
  } catch {
    return []
  }
}
