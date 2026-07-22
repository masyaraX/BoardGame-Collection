import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("BoardGame Collection crashed", error, info);
  }

  render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children;
    }

    return (
      <main className="app theme-wood">
        <section className="crash-panel" role="alert">
          <h1>表示をリセットします</h1>
          <p>画面の状態が壊れたため、保存された一時データを消して再読み込みしてください。</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
          >
            リセットして再読み込み
          </button>
        </section>
      </main>
    );
  }
}
