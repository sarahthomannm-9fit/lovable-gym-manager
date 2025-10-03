import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (user && !loading) {
      navigate('/painel');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-6 px-4">
        <Dumbbell className="w-20 h-20 mx-auto text-primary animate-pulse" />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          FitManage Pro
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Sistema Completo de Gestão de Academia
        </p>
        <Button 
          onClick={() => navigate('/auth')}
          size="lg"
          className="mt-8"
        >
          Acessar Sistema
        </Button>
      </div>
    </div>
  );
}
