import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ open: false, message: '', type: 'info' });

    const showToast = useCallback((message, type = 'info', duration = 2000) => {
        setToast({ open: true, message, type, duration });
    }, []);

    const handleClose = () => {
        setToast((prev) => ({ ...prev, open: false }));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                open={toast.open}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={handleClose}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext); 