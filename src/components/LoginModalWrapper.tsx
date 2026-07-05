'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LoginModal } from './LoginModal';
import { KeySquare } from 'lucide-react';

export function LoginModalWrapper() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-xl flex items-center shadow-lg transition-all"
      >
        <KeySquare className="w-4 h-4 mr-2" />
        Connect Rebrickable Account
      </button>
      {mounted && createPortal(
        <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />,
        document.body
      )}
    </>
  );
}
