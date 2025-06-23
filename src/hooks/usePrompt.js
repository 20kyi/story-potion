import { useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

export function usePrompt(when, onConfirm) {
    const navigator = useContext(NavigationContext).navigator;

    useEffect(() => {
        if (!when) return;
        const push = navigator.push;
        const replace = navigator.replace;
        let unblock;
        navigator.push = (...args) => {
            if (when) {
                onConfirm(args[0], () => push.apply(navigator, args));
            } else {
                push.apply(navigator, args);
            }
        };
        navigator.replace = (...args) => {
            if (when) {
                onConfirm(args[0], () => replace.apply(navigator, args));
            } else {
                replace.apply(navigator, args);
            }
        };
        return () => {
            navigator.push = push;
            navigator.replace = replace;
            if (unblock) unblock();
        };
    }, [when, onConfirm, navigator]);
} 