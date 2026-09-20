import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  err: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(error: Error): State {
    return { err: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI crashed", error, info);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">Something went wrong</p>
        <h2 className="mt-3 text-2xl font-bold">{this.props.fallbackTitle ?? "This view could not be shown."}</h2>
        <p className="mt-2 max-w-md text-sm text-mute">{this.state.err}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ err: null })}
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-mute">
            Return to landing
          </a>
        </div>
      </div>
    );
  }
}
