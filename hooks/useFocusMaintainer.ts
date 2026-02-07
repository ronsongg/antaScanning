import { useEffect, useRef } from 'react';

/**
 * 自动维护输入框焦点
 * 但在有模态框打开时暂停
 */
export const useFocusMaintainer = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const focusInput = () => {
      // 检查是否有模态框打开
      const hasModal = document.querySelector('[role="dialog"]');

      // 检查当前聚焦的元素是否是输入框
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' ||
                             activeElement?.tagName === 'TEXTAREA' ||
                             activeElement?.tagName === 'SELECT';

      // 只有在没有模态框且没有其他输入框获得焦点时，才聚焦到扫描框
      if (!hasModal && !isInputFocused) {
        input.focus({ preventScroll: true });
      }
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
      if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT' && target.tagName !== 'A' && target.tagName !== 'TEXTAREA') {
        setTimeout(focusInput, 10);
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
