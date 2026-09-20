import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

export function useKeyboardVisible(): boolean {
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        let removeNativeListeners: (() => void) | undefined;

        if (Capacitor.isNativePlatform()) {
            const willShow = Keyboard.addListener('keyboardWillShow', () => {
                setIsKeyboardVisible(true);
            });
            const didShow = Keyboard.addListener('keyboardDidShow', () => {
                setIsKeyboardVisible(true);
            });
            const willHide = Keyboard.addListener('keyboardWillHide', () => {
                setIsKeyboardVisible(false);
            });
            const didHide = Keyboard.addListener('keyboardDidHide', () => {
                setIsKeyboardVisible(false);
            });

            removeNativeListeners = () => {
                willShow.then(h => h.remove());
                didShow.then(h => h.remove());
                willHide.then(h => h.remove());
                didHide.then(h => h.remove());
            };
        }

        // Fallback for visualViewport resize on mobile browser / WebView
        const handleResize = () => {
            if (window.visualViewport) {
                // If the visual viewport is significantly shorter than the window,
                // the soft keyboard is open
                const diff = window.innerHeight - window.visualViewport.height;
                setIsKeyboardVisible(diff > 120);
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);

        return () => {
            if (removeNativeListeners) {
                removeNativeListeners();
            }
            window.visualViewport?.removeEventListener('resize', handleResize);
        };
    }, []);

    return isKeyboardVisible;
}
