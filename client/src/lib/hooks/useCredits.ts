import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface CreditBalance {
  balance: number;
  bonusCredits: number;
  total: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
}

export interface CreditTransaction {
  id: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  featureKey: string | null;
  createdAt: string;
}

export interface DailyUsage {
  creditsUsedToday: number;
  generationsToday: number;
  tokensUsedToday: number;
}

export function useCreditBalance() {
  return useQuery<CreditBalance>({
    queryKey: ['/api/credits/balance'],
    queryFn: async () => {
      const res = await fetch('/api/credits/balance', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch credit balance');
      return res.json();
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useCreditTransactions(limit: number = 50) {
  return useQuery<CreditTransaction[]>({
    queryKey: ['/api/credits/transactions', limit],
    queryFn: async () => {
      const res = await fetch(`/api/credits/transactions?limit=${limit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch transactions');
      return res.json();
    },
  });
}

export function useDailyUsage() {
  return useQuery<DailyUsage>({
    queryKey: ['/api/credits/usage'],
    queryFn: async () => {
      const res = await fetch('/api/credits/usage', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    staleTime: 60000,
  });
}

export function useCheckCredits() {
  return useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/credits/check', { amount });
      return response.json();
    },
  });
}

export function invalidateCreditBalance() {
  queryClient.invalidateQueries({ queryKey: ['/api/credits/balance'] });
  queryClient.invalidateQueries({ 
    predicate: (query) => 
      Array.isArray(query.queryKey) && 
      query.queryKey[0] === '/api/credits/transactions'
  });
  queryClient.invalidateQueries({ queryKey: ['/api/credits/usage'] });
}
