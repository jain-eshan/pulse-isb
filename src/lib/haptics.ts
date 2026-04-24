export const tap = () => { if ("vibrate" in navigator) navigator.vibrate(10); };
export const success = () => { if ("vibrate" in navigator) navigator.vibrate([15, 40, 15]); };
