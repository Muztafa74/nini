'use client'

import { useState, useEffect } from 'react'
import type { Photo } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight, User } from 'lucide-react'

interface PhotoLightboxProps {
  photos: Photo[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export default function PhotoLightbox({ photos, initialIndex, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Update currentIndex when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  const currentPhoto = photos[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!currentPhoto) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[95vh] p-0 sm:p-6 bg-black/95 border-none">
        <DialogTitle className="sr-only">
          Photo Viewer - {currentPhoto?.uploaded_by}'s photo from {currentPhoto && formatDate(currentPhoto.uploaded_at)}
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Photo */}
          <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            {currentPhoto && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={currentPhoto.url}
                  alt={`Photo by ${currentPhoto.uploaded_by} from ${formatDate(currentPhoto.uploaded_at)}`}
                  className="max-h-[calc(100vh-200px)] max-w-[calc(100vw-100px)] object-contain"
                  style={{
                    maxHeight: 'calc(100vh - 200px)',
                    maxWidth: 'calc(100vw - 100px)',
                    objectFit: 'contain'
                  }}
                />
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between p-2 sm:p-4 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="text-white hover:bg-white/10 disabled:opacity-50 pointer-events-auto"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              disabled={currentIndex === photos.length - 1}
              className="text-white hover:bg-white/10 disabled:opacity-50 pointer-events-auto"
              aria-label="Next photo"
            >
              <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" />
            </Button>
          </div>

          {/* Photo info */}
          <div className="bg-black/50 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <User className="w-3 h-3 mr-1" />
                  {currentPhoto?.uploaded_by}
                </Badge>
                <span className="text-sm text-white/80">
                  {currentPhoto && formatDate(currentPhoto.uploaded_at)}
                </span>
              </div>
              <div className="text-sm text-white/60">
                {currentIndex + 1} of {photos.length}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
