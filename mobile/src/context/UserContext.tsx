import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {api} from '../api/client';

export type UserData = Record<string, unknown> & {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  claim?: string | null;
  fortune?: number;
  miningSpeed?: number;
  points?: number;
  balance?: number;
  pointLevel?: number | null;
  pointXp?: number;
  hasVoucher?: boolean;
  remainingAcademiesCount?: number;
  referralBalance?: number;
  lastBonusDate?: string | null;
  countBonusDays?: number;
  missions?: Array<{
    id: string;
    status: string;
    completion_time?: string | Date | null;
  }>;
  earnedProfit?: Array<{date: string; profit: number}>;
  language_code?: string;
  tonAddress?: string;
  wallet?: {
    address?: string;
    publicKey?: string;
  };
  level?: number;
  combo?: {
    reward?: number;
    counter?: number;
    date?: string;
  } | null;
  /** Boost cards progress — matches TWA `userData.cards` */
  cards?: Array<{
    id: string;
    level?: number;
    price?: number;
    mining?: number;
  }>;
  /** Academy re-test pricing — aligned with TWA user profile */
  retryTest?: number;
  retryTestDate?: string;
};

type UserContextValue = {
  token: string | null;
  setToken: (t: string | null) => Promise<void>;
  userData: UserData | null;
  refetchUser: () => Promise<void>;
  isHydrated: boolean;
  /** True while token exists and /api/users/me is loading */
  bootstrapping: boolean;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

async function fetchMe() {
  const {data} = await api.get<UserData>('/api/users/me');
  return data;
}

export function UserProvider({children}: {children: React.ReactNode}) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = await AsyncStorage.getItem('token');
      if (!cancelled) {
        setTokenState(t);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setToken = useCallback(async (t: string | null) => {
    if (t) {
      await AsyncStorage.setItem('token', t);
    } else {
      await AsyncStorage.removeItem('token');
    }
    setTokenState(t);
    await queryClient.invalidateQueries({queryKey: ['currentUser']});
  }, [queryClient]);

  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchMe,
    enabled: isHydrated && !!token,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    const err = userQuery.error;
    if (!err || !token) {
      return;
    }
    if (axios.isAxiosError(err)) {
      const s = err.response?.status;
      if (s === 401 || s === 403) {
        void (async () => {
          await AsyncStorage.removeItem('token');
          setTokenState(null);
        })();
      }
    }
  }, [userQuery.error, token]);

  const bootstrapping =
    !isHydrated || (!!token && userQuery.isPending);

  const refetchUser = useCallback(async () => {
    await userQuery.refetch();
  }, [userQuery]);

  const logout = useCallback(async () => {
    await setToken(null);
    queryClient.removeQueries({queryKey: ['currentUser']});
  }, [queryClient, setToken]);

  const value = useMemo<UserContextValue>(
    () => ({
      token,
      setToken,
      userData: (userQuery.data as UserData) ?? null,
      refetchUser,
      isHydrated,
      bootstrapping,
      logout,
    }),
    [
      token,
      setToken,
      userQuery.data,
      refetchUser,
      isHydrated,
      bootstrapping,
      logout,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUserContext must be used within UserProvider');
  }
  return ctx;
}
