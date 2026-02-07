export const speak = (text: string, type: 'success' | 'error' = 'success') => {
    if (!('speechSynthesis' in window)) return;
  
    // Cancel any current speaking
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.2; // Slightly faster for efficiency
    utterance.pitch = type === 'error' ? 0.8 : 1.1; // Lower pitch for errors
  
    window.speechSynthesis.speak(utterance);
  };