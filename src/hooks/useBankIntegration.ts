
import { useState, useEffect } from "react";

interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category?: string;
  studentId?: number;
  studentName?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  connected: boolean;
  lastSync?: string;
}

export function useBankIntegration() {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      amount: 200.00,
      description: 'Pagamento João Silva - Personal Training',
      type: 'credit',
      category: 'Aluno Fixo',
      studentId: 1,
      studentName: 'João Silva',
      status: 'confirmed'
    },
    {
      id: '2',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 150.00,
      description: 'Pagamento Maria Santos - Plano Trimestral',
      type: 'credit',
      category: 'Aluno Fixo',
      studentId: 2,
      studentName: 'Maria Santos',
      status: 'confirmed'
    },
    {
      id: '3',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: 50.00,
      description: 'Equipamento de Academia',
      type: 'debit',
      category: 'Equipamentos',
      status: 'confirmed'
    }
  ]);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBank = async (bankData: any) => {
    setIsConnecting(true);
    try {
      const mockAccount: BankAccount = {
        id: '1',
        name: 'Conta Principal',
        balance: 2850.00,
        connected: true,
        lastSync: new Date().toISOString()
      };
      setAccount(mockAccount);
      localStorage.setItem('bankAccount', JSON.stringify(mockAccount));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erro ao conectar com o banco' };
    } finally {
      setIsConnecting(false);
    }
  };

  const importTransactions = async () => {
    if (!account?.connected) return [];
    
    try {
      // Simular importação de novas transações
      const mockNewTransactions: BankTransaction[] = [
        {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          amount: 180.00,
          description: 'PIX Recebido - Ana Paula',
          type: 'credit',
          category: 'Aluno Novo',
          status: 'pending'
        }
      ];
      
      setTransactions(prev => [...mockNewTransactions, ...prev]);
      
      // Atualizar último sync
      const updatedAccount = { ...account, lastSync: new Date().toISOString() };
      setAccount(updatedAccount);
      localStorage.setItem('bankAccount', JSON.stringify(updatedAccount));
      
      return mockNewTransactions;
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      return [];
    }
  };

  const addManualTransaction = (transaction: Omit<BankTransaction, 'id' | 'status'>) => {
    const newTransaction: BankTransaction = {
      id: Date.now().toString(),
      status: 'confirmed',
      ...transaction
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  const categorizeTransaction = (id: string, category: string, studentId?: number, studentName?: string) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, category, studentId, studentName } : transaction
    ));
  };

  const updateTransactionStatus = (id: string, status: BankTransaction['status']) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, status } : transaction
    ));
  };

  const getMonthlyRevenue = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && 
               tDate.getFullYear() === currentYear && 
               t.type === 'credit' && 
               t.status === 'confirmed';
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getRevenueByCategory = () => {
    const categories: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'credit' && t.status === 'confirmed')
      .forEach(t => {
        const category = t.category || 'Sem Categoria';
        categories[category] = (categories[category] || 0) + t.amount;
      });
    
    return categories;
  };

  useEffect(() => {
    const savedAccount = localStorage.getItem('bankAccount');
    if (savedAccount) {
      setAccount(JSON.parse(savedAccount));
    }
  }, []);

  return {
    account,
    transactions,
    isConnecting,
    connectBank,
    importTransactions,
    addManualTransaction,
    categorizeTransaction,
    updateTransactionStatus,
    getMonthlyRevenue,
    getRevenueByCategory
  };
}
