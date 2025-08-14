import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export default function CustomAlert({ message, type, isOpen, onClose, duration = 5000 }: AlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade out animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500 text-green-100';
      case 'error':
        return 'bg-red-900/90 border-red-500 text-red-100';
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-500 text-yellow-100';
      case 'info':
        return 'bg-blue-900/90 border-blue-500 text-blue-100';
      default:
        return 'bg-blue-900/90 border-blue-500 text-blue-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`${getAlertStyles()} border rounded-lg shadow-2xl p-4 min-w-80 max-w-md transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
        }`}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Global alert instance
let globalAlertFunctions: any = null;

export const setGlobalAlertFunctions = (functions: any) => {
  globalAlertFunctions = functions;
};

// Global alert functions
export const showGlobalSuccess = (message: string) => {
  if (globalAlertFunctions) {
    globalAlertFunctions.showSuccess(message);
  }
};

export const showGlobalError = (message: string) => {
  if (globalAlertFunctions) {
    globalAlertFunctions.showError(message);
  }
};

export const showGlobalWarning = (message: string) => {
  if (globalAlertFunctions) {
    globalAlertFunctions.showWarning(message);
  }
};

export const showGlobalInfo = (message: string) => {
  if (globalAlertFunctions) {
    globalAlertFunctions.showInfo(message);
  }
};

// Hook for easy alert usage
export const useAlert = () => {
  const [alertState, setAlertState] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isOpen: boolean;
  }>({
    message: '',
    type: 'info',
    isOpen: false,
  });

  const showAlert = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertState({
      message,
      type,
      isOpen: true,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (message: string) => showAlert(message, 'success');
  const showError = (message: string) => showAlert(message, 'error');
  const showWarning = (message: string) => showAlert(message, 'warning');
  const showInfo = (message: string) => showAlert(message, 'info');

  // Set global functions when this hook is used
  useEffect(() => {
    setGlobalAlertFunctions({ showSuccess, showError, showWarning, showInfo });
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
