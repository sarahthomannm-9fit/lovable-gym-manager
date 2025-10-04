import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Componente de loading padrão
export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Wrapper para lazy loading com suspense
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <LoadingFallback />
) {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Pré-carregar componentes
export function preloadComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return () => {
    importFunc();
  };
}