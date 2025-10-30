'use client'
import { useEffect, useState } from 'react'
import PricingWrapper from '@/views/front-pages/pricing'

export default function PricingClientPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => res.json())
      .then(setData)
  }, [])

  if (!data) return <div>Loading...</div>
  return <PricingWrapper data={data} />
}
