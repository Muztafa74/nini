'use client'

import { useState, useEffect } from 'react'
import { supabase, type ActivityLog } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Heart, User, Clock } from 'lucide-react'
import { toast } from 'sonner'

export default function ActivityHistory() {
  const [open, setOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      toast.error('Unable to load activity history.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchActivities()
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
    }
    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    }
    if (diffInHours < 48) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getActionIcon = (action: string) => {
    if (action.includes('photo')) return '📸'
    if (action.includes('folder')) return '📁'
    if (action.includes('notes')) return '📝'
    return '💖'
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-white border-rose-100">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <DialogTitle className="text-rose-800">Our Family Activity</DialogTitle>
          </div>
          <DialogDescription className="text-rose-600/70">
            A timeline of our precious moments and memories 💖
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <Heart className="w-8 h-8 text-rose-400 animate-pulse mx-auto mb-4" />
              <p className="text-rose-600">Loading activity...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-rose-300 mx-auto mb-4" />
              <p className="text-rose-600">No activity yet</p>
              <p className="text-rose-500 text-sm">Start creating memories to see them here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-rose-50/50 border border-rose-100"
                >
                  <div className="flex-shrink-0 text-lg">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200">
                        <User className="w-3 h-3 mr-1" />
                        {activity.user}
                      </Badge>
                      <span className="text-sm text-rose-600 capitalize font-medium">
                        {activity.action}
                      </span>
                    </div>
                    <p className="text-sm text-rose-700 mb-2">{activity.details}</p>
                    <div className="flex items-center text-xs text-rose-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimestamp(activity.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
