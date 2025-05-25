'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Heart } from 'lucide-react'
import { toast } from 'sonner'

interface CreateFolderDialogProps {
  onFolderCreated: () => void
}

export default function CreateFolderDialog({ onFolderCreated }: CreateFolderDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderDate, setFolderDate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      // Add activity log
      await supabase.from('activity_log').insert({
        action: 'created folder',
        details: `Created folder "${folderName}"`,
        user: user.username
      })

      const { error } = await supabase.from('folders').insert({
        name: folderName,
        date: folderDate,
        created_by: user.username
      })

      if (error) throw error

      toast.success(`Folder "${folderName}" created with love! 💖`)
      setFolderName('')
      setFolderDate('')
      setOpen(false)
      onFolderCreated()
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Unable to create folder. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border-rose-100">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <DialogTitle className="text-rose-800">Create New Memory Folder</DialogTitle>
          </div>
          <DialogDescription className="text-rose-600/70">
            Give your precious memories a beautiful home 💖
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-rose-700 font-medium">
              Folder Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Beach Day, Family Trip"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-rose-700 font-medium">
              Date of Memory
            </Label>
            <Input
              id="date"
              type="date"
              value={folderDate}
              onChange={(e) => setFolderDate(e.target.value)}
              required
              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
            />
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white"
            >
              {loading ? 'Creating...' : 'Create Folder 💖'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
