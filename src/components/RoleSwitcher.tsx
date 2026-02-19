import { useRole } from '../contexts/RoleContext';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, GraduationCap } from 'lucide-react';

export function RoleSwitcher() {
  const { role, setRole } = useRole();
  const { logout, user } = useAuth();

  const handleRoleSwitch = (newRole: 'admin' | 'teacher' | 'student') => {
    // If switching away from authenticated role, logout first
    if (user && user.role !== newRole) {
      logout();
    }
    setRole(newRole);
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
      <p className="text-xs font-medium mb-2 opacity-75">Switch View:</p>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => handleRoleSwitch('admin')}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
            role === 'admin'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          <Shield className="w-4 h-4" />
          Admin
        </button>
        <button
          onClick={() => handleRoleSwitch('teacher')}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
            role === 'teacher'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Teacher
        </button>
        <button
          onClick={() => handleRoleSwitch('student')}
          className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
            role === 'student'
              ? 'bg-white/20 text-white'
              : 'text-white/70 hover:bg-white/10'
          }`}
        >
          <User className="w-4 h-4" />
          Student
        </button>
      </div>
    </div>
  );
}