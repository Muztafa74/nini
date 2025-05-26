'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase, type Folder, type Photo, type Note } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Heart,
  ArrowLeft,
  Calendar,
  User,
  Trash2,
  Edit,
  Save,
  X,
  Star,
  MoreVertical,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import PhotoUpload from './PhotoUpload'
import PhotoLightbox from './PhotoLightbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FolderDetailProps {
  folder: Folder
  onBack: () => void
  onFolderDeleted: () => void
}

export default function FolderDetail({ folder, onBack, onFolderDeleted }: FolderDetailProps) {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteContent, setEditingNoteContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [isEditingFolder, setIsEditingFolder] = useState(false)
  const [folderName, setFolderName] = useState(folder.name)
  const [folderDate, setFolderDate] = useState(folder.date)

  const fetchFolderData = useCallback(async () => {
    try {
      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('folder_id', folder.id)
        .order('uploaded_at', { ascending: false })

      if (photosError) throw photosError
      setPhotos(photosData || [])

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('folder_id', folder.id)
        .order('updated_at', { ascending: false })

      if (notesError) throw notesError
      setNotes(notesData || [])
    } catch (error) {
      console.error('Error fetching folder data:', error)
      toast.error('Unable to load folder data.')
    } finally {
      setLoading(false)
    }
  }, [folder.id])

  useEffect(() => {
    fetchFolderData()
  }, [fetchFolderData])

  const addNote = async () => {
    if (!user || !newNoteContent.trim()) return

    // Validate note content
    if (newNoteContent.trim().length > 10000) {
      toast.error('Note is too long. Please keep it under 10,000 characters.')
      return
    }

    const noteToAdd = {
      folder_id: folder.id,
      content: newNoteContent.trim(),
      updated_by: user.username,
      updated_at: new Date().toISOString()
    }

    try {
      // Optimistic update
      const optimisticNote = {
        id: 'temp-' + Date.now(),
        ...noteToAdd
      }
      setNotes([optimisticNote, ...notes])

      // Try to save to database with retry
      let retries = 3
      let success = false
      let data: Note

      while (retries > 0 && !success) {
        try {
          const result = await supabase
            .from('notes')
            .insert(noteToAdd)
            .select()
            .single()

          if (result.error) throw result.error
          data = result.data
          success = true
        } catch (error) {
          retries--
          if (retries === 0) throw error
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        }
      }

      // Update with real data
      setNotes(notes.map(note => 
        note.id === optimisticNote.id ? data : note
      ))
      setNewNoteContent('')
      setIsAddingNote(false)

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'added note',
        details: `Added a new note to folder "${folder.name}"`,
        user: user.username
      })

      toast.success('Note added! 📝💖')
    } catch (error) {
      // Rollback optimistic update
      setNotes(notes.filter(note => !note.id.startsWith('temp-')))
      console.error('Error adding note:', error)
      toast.error('Unable to add note. Please try again.')
    }
  }

  const updateNote = async (noteId: string) => {
    if (!user || !editingNoteContent.trim()) return

    // Validate note content
    if (editingNoteContent.trim().length > 10000) {
      toast.error('Note is too long. Please keep it under 10,000 characters.')
      return
    }

    const noteUpdate = {
      content: editingNoteContent.trim(),
      updated_by: user.username,
      updated_at: new Date().toISOString()
    }

    try {
      // Optimistic update
      const originalNote = notes.find(note => note.id === noteId)
      if (!originalNote) throw new Error('Note not found')

      setNotes(notes.map(note => 
        note.id === noteId 
          ? { ...note, ...noteUpdate }
          : note
      ))

      // Try to save to database with retry
      let retries = 3
      let success = false

      while (retries > 0 && !success) {
        try {
          const { error } = await supabase
            .from('notes')
            .update(noteUpdate)
            .eq('id', noteId)

          if (error) throw error
          success = true
        } catch (error) {
          retries--
          if (retries === 0) throw error
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        }
      }

      setEditingNoteId(null)
      setEditingNoteContent('')

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'edited note',
        details: `Updated a note in folder "${folder.name}"`,
        user: user.username
      })

      toast.success('Note updated! 📝💖')
    } catch (error) {
      // Rollback optimistic update
      setNotes(notes.map(note => 
        note.id === noteId 
          ? originalNote
          : note
      ))
      console.error('Error updating note:', error)
      toast.error('Unable to update note. Please try again.')
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!user) return

    const confirmed = window.confirm('Are you sure you want to delete this note? This cannot be undone.')
    if (!confirmed) return

    try {
      // Optimistic update
      const noteToDelete = notes.find(note => note.id === noteId)
      if (!noteToDelete) throw new Error('Note not found')

      setNotes(notes.filter(note => note.id !== noteId))

      // Try to delete from database with retry
      let retries = 3
      let success = false

      while (retries > 0 && !success) {
        try {
          const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId)

          if (error) throw error
          success = true
        } catch (error) {
          retries--
          if (retries === 0) throw error
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
        }
      }

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'deleted note',
        details: `Deleted a note from folder "${folder.name}"`,
        user: user.username
      })

      toast.success('Note deleted.')
    } catch (error) {
      // Rollback optimistic update
      if (noteToDelete) {
        setNotes([...notes, noteToDelete])
      }
      console.error('Error deleting note:', error)
      toast.error('Unable to delete note. Please try again.')
    }
  }

  const deleteFolder = async () => {
    if (!user) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}" and all its contents? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      // Delete photos from storage
      for (const photo of photos) {
        const fileName = photo.url.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('family-photos')
            .remove([`${folder.id}/${fileName}`])
        }
      }

      // Delete folder (cascade will handle photos and notes)
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folder.id)

      if (error) throw error

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'deleted folder',
        details: `Deleted folder "${folder.name}"`,
        user: user.username
      })

      toast.success('Folder deleted.')
      onFolderDeleted()
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Unable to delete folder.')
    }
  }

  const deletePhoto = async (photo: Photo) => {
    if (!user) return

    const confirmed = window.confirm('Are you sure you want to delete this photo?')
    if (!confirmed) return

    try {
      // Delete from storage
      const fileName = photo.url.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('family-photos')
          .remove([`${folder.id}/${fileName}`])
      }

      // Delete from database
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)

      if (error) throw error

      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'deleted photo',
        details: `Deleted a photo from folder "${folder.name}"`,
        user: user.username
      })

      setPhotos(photos.filter(p => p.id !== photo.id))
      toast.success('Photo deleted.')
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast.error('Unable to delete photo.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index)
    setLightboxOpen(true)
  }

  const saveFolderChanges = async () => {
    if (!user) {
      toast.error('Please log in to edit folders.')
      return
    }

    try {
      // Prepare the update data
      const updateData = {
        name: folderName,
        date: folderDate,
        updated_by: user.username,
        updated_at: new Date().toISOString()
      }

      console.log('Attempting to update folder:', {
        folderId: folder.id,
        updateData,
        username: user.username
      })

      // Try the update
      const { data, error: updateError } = await supabase
        .from('folders')
        .update(updateData)
        .eq('id', folder.id)
        .select()

      if (updateError) {
        console.error('Error updating folder:', {
          error: updateError,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
          message: updateError.message,
          folderId: folder.id,
          updateData,
          username: user.username
        })
        toast.error('Unable to update folder. Please try again.')
        return
      }

      // If we get here, the update was successful
      setIsEditingFolder(false)
      toast.success('Folder updated! 📁💖')

      // Update the local folder state
      folder.name = folderName
      folder.date = folderDate

      // Add activity log
      const { error: logError } = await supabase.from('activity_log').insert({
        action: 'edited folder',
        details: `Updated folder "${folderName}"`,
        user: user.username
      })

      if (logError) {
        console.warn('Error logging folder update:', logError)
      }
    } catch (error) {
      console.error('Error updating folder:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        folderId: folder.id,
        newName: folderName,
        newDate: folderDate,
        username: user.username
      })
      toast.error('Unable to update folder. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse mx-auto mb-4" />
          <p className="text-rose-600">Loading memories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100 fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              {isEditingFolder ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingFolder(false)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveFolderChanges}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingFolder(true)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteFolder}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-20 pb-6 sm:pt-24 sm:pb-8">
        {/* Folder Info */}
        <div className="mb-6 sm:mb-8">
          {isEditingFolder ? (
            <div className="space-y-4">
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Folder name"
                className="text-lg font-bold"
              />
              <Input
                type="date"
                value={folderDate}
                onChange={(e) => setFolderDate(e.target.value)}
                className="text-rose-600"
              />
            </div>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-rose-800">{folder.name}</h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-rose-600/70 mt-1">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(folder.date)}
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {folder.created_by}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group aspect-square">
              <img
                src={photo.url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform duration-300 group-hover:scale-105"
                onClick={() => openLightbox(index)}
                loading="lazy"
              />
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/90 hover:bg-white text-rose-600 shadow-sm"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePhoto(photo);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Photo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
          <PhotoUpload folderId={folder.id} onUploadComplete={fetchFolderData} />
        </div>

        {/* Notes Section */}
        <Card className="bg-white/80 backdrop-blur-sm border-rose-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-rose-800">Notes</CardTitle>
            {!isAddingNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingNote(true)}
                className="border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isAddingNote && (
              <div className="space-y-4 p-4 bg-rose-50/50 rounded-lg">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Write your note here..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingNote(false)
                      setNewNoteContent('')
                    }}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addNote}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Add Note
                  </Button>
                </div>
              </div>
            )}

            {notes.length === 0 && !isAddingNote ? (
              <p className="text-rose-400 italic text-center py-4">No notes yet. Click "Add Note" to start!</p>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-white rounded-lg border border-rose-100">
                    {editingNoteId === note.id ? (
                      <div className="space-y-4">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          placeholder="Write your note here..."
                          className="min-h-[100px] resize-none"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingNoteId(null)
                              setEditingNoteContent('')
                            }}
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => updateNote(note.id)}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="prose prose-rose max-w-none flex-1">
                            <p className="whitespace-pre-wrap">{note.content}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingNoteId(note.id)
                                setEditingNoteContent(note.content)
                              }}
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <div className="p-2 text-sm text-rose-600">
                                  Are you sure you want to delete this note?
                                </div>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNote(note.id);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Yes, Delete Note
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm pt-2 border-t border-rose-100">
                          <Badge variant="secondary" className="w-fit bg-rose-50 text-rose-700 border-rose-200">
                            <User className="w-3 h-3 mr-1" />
                            {note.updated_by}
                          </Badge>
                          <span className="text-rose-500/70">
                            {formatDate(note.updated_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Lightbox */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={photos}
          initialIndex={selectedPhotoIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
