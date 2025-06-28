
import { useState, useEffect } from "react";

interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  category?: string;
  studentId?: number;
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
  connected: boolean;
}

export function useBankIntegration() {
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectBank = async (bankData: any) => {
    setIsConnecting(true);
    try {
      // Simular conexão com banco - substituir por integração real
      const mockAccount: BankAccount = {
        id: '1',
        name: 'Conta Principal',
        balance: 0,
        connected: true
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
      // Simular importação de transações - substituir por API real
      const mockTransactions: BankTransaction[] = [];
      setTransactions(mockTransactions);
      return mockTransactions;
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      return [];
    }
  };

  const addManualTransaction = (transaction: Omit<BankTransaction, 'id'>) => {
    const newTransaction: BankTransaction = {
      id: Date.now().toString(),
      ...transaction
    };
    setTransactions(prev => [...prev, newTransaction]);
    return newTransaction;
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
    addManualTransaction
  };
}
