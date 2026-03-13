import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import crypto from 'crypto'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('[CLOUDINARY] Missing environment variables')
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResponse {
  public_id: string
  url: string
  secure_url: string
  width: number
  height: number
  bytes: number
  format: string
}

/**
 * Generate signed parameters for client-side upload
 */
export function generateUploadSignature(
  folder: string = 'plenair/products',
  maxFileSize: number = 10 * 1024 * 1024, // 10MB
) {
  const timestamp = Math.floor(Date.now() / 1000)
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || ''

  // Only include params that Cloudinary accepts for signing
  const params: Record<string, string | number | boolean> = {
    timestamp,
    folder,
    eager: 'w_1200,h_800,c_fill|w_400,h_300,c_fill',
    eager_async: true,
  }

  if (uploadPreset) {
    params.upload_preset = uploadPreset
  }

  const paramsStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${key}=${val}`)
    .join('&')

  const signature = crypto
    .createHash('sha256')
    .update(paramsStr + CLOUDINARY_API_SECRET)
    .digest('hex')

  return {
    ...params,
    signature,
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
  }
}

/**
 * Upload file from server (for admin operations)
 */
export async function uploadFile(
  filePath: string,
  options: {
    folder?: string
    publicId?: string
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
  } = {},
): Promise<CloudinaryUploadResponse> {
  try {
    const response = (await cloudinary.uploader.upload(filePath, {
      folder: options.folder || 'plenair/products',
      public_id: options.publicId,
      resource_type: options.resourceType || 'auto',
      eager: ['w_1200,h_800,c_fill', 'w_400,h_300,c_fill'],
      eager_async: true,
    })) as UploadApiResponse

    return {
      public_id: response.public_id,
      url: response.url,
      secure_url: response.secure_url,
      width: response.width || 0,
      height: response.height || 0,
      bytes: response.bytes,
      format: response.format,
    }
  } catch (error) {
    const err = error as UploadApiErrorResponse
    console.error('[CLOUDINARY UPLOAD ERROR]', err.message)
    throw error
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFile(publicId: string): Promise<boolean> {
  try {
    const response = await cloudinary.uploader.destroy(publicId)
    return response.result === 'ok'
  } catch (error) {
    console.error('[CLOUDINARY DELETE ERROR]', error)
    throw error
  }
}

/**
 * Generate responsive image URLs (srcset)
 */
export function generateResponsiveUrls(
  publicId: string,
  format: 'jpg' | 'webp' = 'jpg',
): Record<string, string> {
  const widths = [320, 480, 768, 1024, 1440]
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  const transformation = 'c_fill,q_auto,f_auto'

  return widths.reduce(
    (acc, width) => {
      acc[`w_${width}`] = `${base}/${transformation},w_${width}/plenair/${publicId}.${format}`
      return acc
    },
    {} as Record<string, string>,
  )
}

/**
 * Generate image URL with transformations
 */
export function getCdnUrl(
  publicId: string,
  width?: number,
  height?: number,
  crop: 'fill' | 'limit' = 'fill',
): string {
  const base = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`
  const transformations = []

  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  transformations.push(`c_${crop}`)
  transformations.push('q_auto')
  transformations.push('f_auto')

  const transformation = transformations.join(',')
  return `${base}/${transformation}/plenair/${publicId}`
}

export default cloudinary
