'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthContainerProps {
  initialMode?: string;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export default function AuthContainer({ initialMode = 'login' }: AuthContainerProps) {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode as AuthMode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setCurrentMode(initialMode as AuthMode);
  }, [initialMode]);

  const switchMode = (mode: AuthMode) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentMode(mode);
      setIsTransitioning(false);
    }, 150);
  };

  const toggleLoginRegister = () => {
    switchMode(currentMode === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    switchMode('forgot-password');
  };

  const handleBackToLogin = () => {
    switchMode('login');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con tabs - solo mostrar para login/register */}
        {currentMode !== 'forgot-password' && (
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex rounded-lg bg-white/10 backdrop-blur-sm p-1">
              <button
                onClick={() => currentMode !== 'login' && switchMode('login')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentMode === 'login'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => currentMode !== 'register' && switchMode('register')}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                  currentMode === 'register'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Registrarse
              </button>
            </div>
          </div>
        )}

        {/* Form container con animación */}
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          {currentMode === 'login' && (
            <LoginForm 
              onToggleForm={toggleLoginRegister} 
              onForgotPassword={handleForgotPassword}
            />
          )}
          {currentMode === 'register' && (
            <RegisterForm onToggleForm={toggleLoginRegister} />
          )}
          {currentMode === 'forgot-password' && (
            <ForgotPasswordForm onBack={handleBackToLogin} />
          )}
        </div>
      </div>
    </div>
  );
} 