import { useCallback } from 'react';
import { useToast } from '../components/Toast';

export default function useClipboard() {
  const toast = useToast();
  return useCallback(
    async (text, label = 'Copied to clipboard') => {
      if (text === undefined || text === null || text === '') return;
      try {
        await navigator.clipboard.writeText(String(text));
        toast(label);
      } catch {
        // Fallback for insecure contexts
        const ta = document.createElement('textarea');
        ta.value = String(text);
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          toast(label);
        } catch {
          toast('Copy failed');
        }
        document.body.removeChild(ta);
      }
    },
    [toast]
  );
}
