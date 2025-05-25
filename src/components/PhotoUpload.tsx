'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface PhotoUploadProps {
  folderId: string
  onPhotoUploaded: () => void
}

export default function PhotoUpload({ folderId, onPhotoUploaded }: PhotoUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    setUploading(true)

    try {
      for (const file of files) {
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error('Please select only image files.')
          continue
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error('File size must be less than 10MB.')
          continue
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${folderId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('family-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('family-photos')
          .getPublicUrl(fileName)

        // Save photo record to database
        const { error: dbError } = await supabase.from('photos').insert({
          folder_id: folderId,
          url: urlData.publicUrl,
          uploaded_by: user.username
        })

        if (dbError) throw dbError

        // Add to activity log
        await supabase.from('activity_log').insert({
          action: 'uploaded photo',
          details: "Uploaded a photo",
          user: user.username
        })
      }

      toast.success('Photos uploaded with love! 📸💖')
      onPhotoUploaded()

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast.error('Unable to upload photos. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        onClick={handleFileSelect}
        disabled={uploading}
        className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white"
      >
        {uploading ? (
          <>
            <Upload className="w-4 h-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4 mr-2" />
            Add Photos
          </>
        )}
      </Button>
    </div>
  )
}
