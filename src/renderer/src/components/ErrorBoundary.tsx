import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Isolates a single widget's failures. Per the spec, one broken widget
 * (e.g. camera or a calendar) must not take down the rest of the dashboard.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error(`[widget:${this.props.label}]`, error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl bg-neutral-900/70 p-5 text-center ring-1 ring-red-500/20">
          <span className="text-sm font-semibold text-red-400">{this.props.label} unavailable</span>
          <span className="text-xs text-neutral-500">{this.state.error.message}</span>
        </div>
      )
    }
    return this.props.children
  }
}
