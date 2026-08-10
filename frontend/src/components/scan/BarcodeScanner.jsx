import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner({ onDetected, active }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [permissionError, setPermissionError] = useState('');

  useEffect(() => {
    if (!active) return undefined;

    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls;
        if (result && !cancelled) {
          onDetected(result.getText());
        }
      })
      .catch((err) => {
        if (err?.name === 'NotAllowedError') {
          setPermissionError("Accès à la caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur.");
        } else {
          setPermissionError("Impossible d'accéder à la caméra sur cet appareil.");
        }
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [active, onDetected]);

  if (permissionError) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100 p-6 text-center text-sm text-gray-600">
        {permissionError}
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-brand-500/80" />
    </div>
  );
}
