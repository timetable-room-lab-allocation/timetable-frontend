import { DatabaseZap, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  title: string
  description: string
  icon?: LucideIcon
}

export function EmptyState({
  title,
  description,
  icon: Icon = DatabaseZap,
}: EmptyStateProps) {
  return (
    <Card className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
      <Icon className="mb-4 h-10 w-10 text-slate-400" />

      <h2 className="text-lg font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm text-slate-500">
        {description}
      </p>
    </Card>
  )
}