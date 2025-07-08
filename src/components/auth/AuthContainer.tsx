'use client';

import { useState, useEffect } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthContainerProps {
  initialMode?: string;
}

export default function AuthContainer({ initialMode = 'login' }: AuthContainerProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  const toggleForm = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header con tabs */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex rounded-lg bg-white/10 backdrop-blur-sm p-1">
            <button
              onClick={() => !isLogin && toggleForm()}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                isLogin
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => isLogin && toggleForm()}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-md transition-all duration-200 ${
                !isLogin
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Registrarse
            </button>
          </div>
        </div>

        {/* Form container con animación */}
        <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          {isLogin ? (
            <LoginForm onToggleForm={toggleForm} />
          ) : (
            <RegisterForm onToggleForm={toggleForm} />
          )}
        </div>
      </div>
    </div>
  );
} 