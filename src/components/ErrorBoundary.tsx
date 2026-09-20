import { Component, type ErrorInfo, type ReactNode } from "react";
import MemoryFallback from "./MemoryFallback";

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
    if (this.state.err) return <MemoryFallback />;
    return this.props.children;
  }
}
