import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SettingsAboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">О приложении</h2>
        <p className="text-sm text-muted-foreground">
          Информация о Finstan
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Метрики для стартапа</CardTitle>
          <CardDescription>
            MRR считается по категориям доходов с флагом «Учитывать в MRR».
            Отредактируйте категорию и отметьте галочку для подписок.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">О приложении</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Finstan — система управления финансами бизнеса. Версия 0.1.0
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
