'use client';

import { useState } from 'react';
import { verifyEmailConfiguration } from '@/lib/emailHelpers';

export default function TestEmailPage() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testEmailConfig = async () => {
    setIsLoading(true);
    setStatus('Verificando configuración SMTP...');
    
    try {
      const result = await verifyEmailConfiguration();
      
      if (result.connected) {
        setStatus('✅ Configuración exitosa! El sistema de correos está listo.');
      } else {
        setStatus('❌ Error en configuración: ' + result.message);
      }
    } catch (error) {
      setStatus('❌ Error al verificar configuración');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          🧪 Probar Sistema de Correos
        </h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              📝 Instrucciones:
            </h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Instala: <code>npm install nodemailer @types/nodemailer handlebars</code></li>
              <li>2. Crea archivo <code>.env.local</code> con credenciales SMTP</li>
              <li>3. Configura Gmail con contraseña de aplicación</li>
              <li>4. Haz clic en el botón para probar</li>
            </ol>
          </div>
          
          <button
            onClick={testEmailConfig}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : '🔍 Verificar Configuración'}
          </button>
          
          {status && (
            <div className={`p-4 rounded-lg text-sm ${
              status.includes('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status}
            </div>
          )}
        </div>
        
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📧 Flujo de correos:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✉️ <strong>Cliente reserva</strong> → Correo a cliente + admin</li>
            <li>✅ <strong>Admin confirma</strong> → Correo a cliente + conductor</li>
            <li>🏁 <strong>Viaje completo</strong> → Correo a cliente</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 