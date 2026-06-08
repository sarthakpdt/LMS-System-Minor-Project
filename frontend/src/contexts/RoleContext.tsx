import { createContext, useContext } from 'react';

interface RoleContextType {
  role: 'admin' | 'teacher' | 'student';
  setRole: (role: 'admin' | 'teacher' | 'student') => void;
}

export const RoleContext = createContext<RoleContextType>({
  role: 'admin',
  setRole: () => {},
});

export const useRole = () => useContext(RoleContext);
