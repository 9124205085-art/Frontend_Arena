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
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center" role="alert">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Something went wrong</p>
        <h2 className="mt-3 text-2xl font-bold">{this.props.fallbackTitle ?? "This view could not be shown."}</h2>
        <p className="mt-2 max-w-md text-base text-mute">{this.state.err}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ err: null })}
            className="min-h-12 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Try again
          </button>
          <a href="/" className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white">
            Return to landing
          </a>
        </div>
      </div>
    );
  }
}
