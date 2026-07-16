'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';
import { toast } from 'sonner';

// Extensão da tipagem global para incluir o FB SDK
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export function FacebookLoginButton() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Configura o callback para quando o SDK carregar
    window.fbAsyncInit = function() {
      window.FB.init({
        appId            : '1899779954048293', // ID do Visuno CRM
        autoLogAppEvents : true,
        xfbml            : true,
        version          : 'v21.0'
      });
      setIsSdkLoaded(true);
    };

    // Caso o SDK já tenha carregado antes do useEffect
    if (window.FB) {
      setIsSdkLoaded(true);
    }
  }, []);

  const handleLogin = () => {
    if (!window.FB) {
      toast.error('O SDK do Facebook ainda não foi carregado.');
      return;
    }

    setIsLoggingIn(true);

    window.FB.login(
      function(response: any) {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log('Login bem-sucedido! Token obtido.');
          
          // Aqui enviaremos o token para o backend trocar por um token permanente
          toast.success('Autenticação concluída! Salvando configurações...');
          
          // Simula uma requisição para a API
          setTimeout(() => {
            setIsLoggingIn(false);
            toast.success('Configurações salvas com sucesso!');
          }, 1500);

        } else {
          console.error('Usuário cancelou o login ou não autorizou totalmente.');
          setIsLoggingIn(false);
        }
      },
      {
        config_id: '1834552510859132', // Configuração do Cadastro Incorporado Visuno
        response_type: 'code',
        override_default_response_type: true,
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          feature: 'whatsapp_embedded_signup',
          sessionInfoVersion: '3'
        }
      }
    );
  };

  return (
    <>
      <Script 
        src="https://connect.facebook.net/pt_BR/sdk.js" 
        strategy="lazyOnload" 
      />
      
      <Button 
        onClick={handleLogin} 
        disabled={!isSdkLoaded || isLoggingIn}
        className="w-full sm:w-auto bg-[#1877F2] hover:bg-[#1877F2]/90 text-white font-medium shadow-sm transition-all"
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <svg 
              className="mr-2 size-5" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" 
                clipRule="evenodd" 
              />
            </svg>
            Continuar com Facebook
          </>
        )}
      </Button>
    </>
  );
}
