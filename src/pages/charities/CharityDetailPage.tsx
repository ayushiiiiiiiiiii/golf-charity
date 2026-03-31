import React from 'react'
import { useParams } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'

const CharityDetailPage: React.FC = () => {
  const { charityId } = useParams({ from: '/charities/$charityId' })

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Charity Details</h1>
      <Card className="p-8">
        <p className="text-muted-foreground">Charity {charityId} details coming soon</p>
      </Card>
    </div>
  )
}

export default CharityDetailPage
