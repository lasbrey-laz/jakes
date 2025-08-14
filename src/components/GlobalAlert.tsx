import React from 'react';
import CustomAlert, { useAlert } from './CustomAlert';

export default function GlobalAlert() {
  const { alertState, hideAlert } = useAlert();

  return (
    <CustomAlert 
      message={alertState.message}
      type={alertState.type}
      isOpen={alertState.isOpen}
      onClose={hideAlert}
    />
  );
}
