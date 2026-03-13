'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, X, AlertCircle } from 'lucide-react'

interface ImageUploadProps {
  onImageUpload: (
    data: {
      publicId: string
      url: string
      width: number
      height: number
    }[],
  ) => void
  multiple?: boolean
  maxFiles?: number
}

export function ImageUpload({
  onImageUpload,
  multiple = true,
  maxFiles = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previews, setPreviews] = useState<Array<{ file: File; preview: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const totalFiles = previews.length + newFiles.length

    if (totalFiles > maxFiles) {
      toast.error(`Máximo ${maxFiles} imágenes permitidas`)
      return
    }

    const newPreviews = newFiles
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))

    if (newPreviews.length !== newFiles.length) {
      toast.error('Solo se aceptan archivos de imagen')
    }

    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const handleUpload = async () => {
    if (previews.length === 0) {
      toast.error('Selecciona al menos una imagen')
      return
    }

    setUploading(true)
    const uploadedImages = []

    try {
      // Get signed upload params from our API
      const signRes = await fetch('/api/cloudinary/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'plenair/products' }),
      })

      if (!signRes.ok) {
        throw new Error('Failed to get upload signature')
      }

      const signData = await signRes.json()

      for (let i = 0; i < previews.length; i++) {
        const { file } = previews[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', signData.api_key)
        formData.append('timestamp', String(signData.timestamp))
        formData.append('signature', signData.signature)
        formData.append('folder', signData.folder)
        formData.append('eager', signData.eager)
        formData.append('eager_async', String(signData.eager_async))
        if (signData.upload_preset) {
          formData.append('upload_preset', signData.upload_preset)
        }

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
          {
            method: 'POST',
            body: formData,
          },
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Cloudinary error:', errorData)
          throw new Error(`Upload failed for ${file.name}`)
        }

        const data = await response.json()
        uploadedImages.push({
          publicId: data.public_id,
          url: data.secure_url,
          width: data.width,
          height: data.height,
        })

        setUploadProgress(Math.round(((i + 1) / previews.length) * 100))
      }

      onImageUpload(uploadedImages)
      setPreviews([])
      setUploadProgress(0)
      toast.success(`${uploadedImages.length} imagen(es) subida(s) exitosamente`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error al subir las imágenes')
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault()
          handleFileSelect(e.dataTransfer.files)
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-medium">Arrastra imágenes o haz clic para seleccionar</p>
        <p className="text-xs text-gray-500">
          {multiple ? `Máximo ${maxFiles} imágenes, PNG/JPG` : 'PNG/JPG'}
        </p>
      </div>

      {previews.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Imágenes seleccionadas ({previews.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {previews.map((item, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={item.preview}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePreview(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Subiendo imágenes...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={uploading || previews.length === 0}
        className="w-full"
      >
        {uploading ? `Subiendo (${uploadProgress}%)` : `Subir ${previews.length} imagen(es)`}
      </Button>
    </div>
  )
}
