'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth, UseAuthReturn } from '@/hooks/use-auth';

// Create auth context
const AuthContext = createContext<UseAuthReturn | null>(null);

// Provider component
export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuthContext(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within a FirebaseAuthProvider');
  }
  return context;
}

// Export for convenience
export default FirebaseAuthProvider;
