import React, { createContext, useState, useCallback, useRef } from 'react';

export const NotificationContext = createContext(null);

let toastId = 0;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback(
    ({ type = 'info', title, message, duration = 4000 }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title = 'Success') => addToast({ type: 'success', title, message }),
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error') => addToast({ type: 'error', title, message }),
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Warning') => addToast({ type: 'warning', title, message }),
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Info') => addToast({ type: 'info', title, message }),
    [addToast]
  );

  return (
    <NotificationContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
