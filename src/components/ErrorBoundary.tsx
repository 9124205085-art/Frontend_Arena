import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
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
    console.error("Scene crashed", error, info);
  }

  render() {
    if (this.state.err) {
      return <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,107,255,0.2),_transparent_60%)]" />;
    }
    return this.props.children;
  }
}
