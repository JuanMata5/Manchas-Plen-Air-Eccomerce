'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

export interface PendingImage {
  file: File
  preview: string
}

interface ImageUploadProps {
  pendingImages: PendingImage[]
  onPendingImagesChange: (images: PendingImage[]) => void
  multiple?: boolean
  maxFiles?: number
}

export function ImageUpload({
  pendingImages,
  onPendingImagesChange,
  multiple = true,
  maxFiles = 5,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const totalFiles = pendingImages.length + newFiles.length

    if (totalFiles > maxFiles) {
      toast.error(`Máximo ${maxFiles} imágenes permitidas`)
      return
    }

    const validFiles = newFiles.filter((file) => file.type.startsWith('image/'))

    if (validFiles.length !== newFiles.length) {
      toast.error('Solo se aceptan archivos de imagen')
    }

    const newPreviews = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    onPendingImagesChange([...pendingImages, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const updated = [...pendingImages]
    URL.revokeObjectURL(updated[index].preview)
    updated.splice(index, 1)
    onPendingImagesChange(updated)
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
          onChange={(e) => {
            handleFileSelect(e.target.files)
            e.target.value = ''
          }}
          className="hidden"
        />

        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-medium">Arrastrá imágenes o hacé clic para seleccionar</p>
        <p className="text-xs text-gray-500">
          {multiple ? `Máximo ${maxFiles} imágenes, PNG/JPG` : 'PNG/JPG'}
        </p>
      </div>

      {pendingImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">
            Imágenes seleccionadas ({pendingImages.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pendingImages.map((item, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={item.preview}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Las imágenes se subirán automáticamente al guardar.
          </p>
        </div>
      )}
    </div>
  )
}
