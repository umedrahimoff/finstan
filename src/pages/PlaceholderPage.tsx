import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PlaceholderPageProps {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>В разработке</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Раздел будет доступен в следующих версиях приложения.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
