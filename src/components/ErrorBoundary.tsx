import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
          <h1 className="text-xl font-bold">Ошибка загрузки</h1>
          <p className="max-w-md text-center text-muted-foreground">
            {this.state.error?.message}
          </p>
          <p className="text-sm text-muted-foreground">
            Проверьте настройки приложения
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Обновить
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
