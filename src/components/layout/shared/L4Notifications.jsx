'use client'

import { useEffect, useState } from 'react'

import NotificationsDropdown from '@components/layout/shared/NotificationsDropdown'

const L4Notifications = () => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/notifications')

        if (!res.ok) return

        const data = await res.json()

        if (active) setNotifications(data.notifications || [])
      } catch {
        /* silencioso */
      }
    }

    load()
    const interval = setInterval(load, 120000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return <NotificationsDropdown notifications={notifications} />
}

export default L4Notifications
