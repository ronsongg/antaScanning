import { useEffect, useRef } from 'react';

export const useFocusMaintainer = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const focusInput = () => {
        // Prevent scrolling to element on mobile
        input.focus({ preventScroll: true });
    };

    // Initial focus
    focusInput();

    // Re-focus on blur
    const onBlur = () => {
      setTimeout(focusInput, 10);
    };

    // Focus on any click in the document (unless clicking a button/input)
    const onDocClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && target.tagName !== 'A') {
            focusInput();
        }
    };

    input.addEventListener('blur', onBlur);
    document.addEventListener('click', onDocClick);

    return () => {
      input.removeEventListener('blur', onBlur);
      document.removeEventListener('click', onDocClick);
    };
  }, []);

  return inputRef;
};