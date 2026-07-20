interface ErpPageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function ErpPageHeader({ title, description, action }: ErpPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-stone-900">{title}</h1>
        {description && <p className="text-sm text-stone-500 mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  )
}
