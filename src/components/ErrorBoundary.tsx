import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, X, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  viewName?: string;
  isModal?: boolean;
  onClose?: () => void;
  onNavigateHome?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  private handleCopy = () => {
    const { error, errorInfo } = this.state;
    const text = `ERROR AGROCONTROL:\nMensaje: ${error?.message || 'Desconocido'}\n\nStack:\n${error?.stack || ''}\n\nComponent Stack:\n${errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { viewName, isModal, onClose, onNavigateHome } = this.props;
      const { error, errorInfo, showDetails, copied } = this.state;

      const cardContent = (
        <div className="bg-white rounded-2xl shadow-xl border border-amber-200 p-6 sm:p-8 max-w-xl w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Ha ocurrido un error inesperado
            </h2>
            <p className="text-sm font-semibold text-amber-800 mt-1">
              Por favor consulte con el desarrollador.
            </p>
            {viewName && (
              <p className="text-xs text-slate-500 mt-1">
                Ocurrió en: <span className="font-semibold text-slate-700">{viewName}</span>
              </p>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            El sistema protegió la aplicación para evitar que se cierre o pierda información de otras pantallas. Puede reintentar la acción o volver a la pantalla principal.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar Pantalla</span>
            </button>

            {onNavigateHome && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  onNavigateHome();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ir al Inicio</span>
              </button>
            )}

            {isModal && onClose && (
              <button
                type="button"
                onClick={() => {
                  this.handleReset();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Ventana</span>
              </button>
            )}
          </div>

          {/* Collapsible Tech Details */}
          <div className="pt-3 border-t border-slate-200 text-left">
            <button
              type="button"
              onClick={() => this.setState({ showDetails: !showDetails })}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
            >
              <span>Ver detalles técnicos para el desarrollador</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono space-y-2 max-h-52 overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-slate-700">
                  <span className="text-amber-400 font-bold">Diagnóstico de Error:</span>
                  <button
                    type="button"
                    onClick={this.handleCopy}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-rose-400 font-bold break-all">
                  {error?.toString() || 'Error no especificado'}
                </p>
                {errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-tight">
                    {errorInfo.componentStack.trim()}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );

      if (isModal) {
        return (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            {cardContent}
          </div>
        );
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4">
          {cardContent}
        </div>
      );
    }

    return this.props.children;
  }
}
