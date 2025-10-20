import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running on iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Check if already installed (running in standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check if user has previously dismissed the prompt
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const dismissedDate = dismissed ? new Date(dismissed) : null;
        const daysSinceDismissed = dismissedDate
            ? (new Date().getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
            : 999;

        // Listen for the beforeinstallprompt event (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            // Show prompt only if not dismissed recently (within 7 days)
            if (daysSinceDismissed > 7) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show prompt after a short delay if not in standalone mode and not dismissed recently
        if (ios && !standalone && daysSinceDismissed > 7) {
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000); // Show after 3 seconds
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Show the install prompt (Android/Desktop)
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    };

    // Don't show if already installed or prompt is hidden
    if (isStandalone || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up lg:left-auto lg:right-8 lg:w-96">
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-6 shadow-2xl shadow-blue-500/50">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute right-3 top-3 rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white transition-all"
                    aria-label="Close"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-lg">
                            <img src="/icon-72x72.png" alt="ONYX xPOS" className="h-12 w-12 rounded-lg" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-1">
                            ONYX xPOS Proqramını Yüklə
                        </h3>
                        <p className="text-sm text-blue-50 mb-4">
                            {isIOS
                                ? 'Safari brauzerdə, aşağıdakı "Paylaş" düyməsinə toxunaraq "Ana Ekrana Əlavə Et" seçin.'
                                : 'Tətbiqi cihazınıza yükləyin və offline istifadə edin.'
                            }
                        </p>

                        {!isIOS && deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="flex items-center justify-center space-x-2 w-full rounded-lg bg-white px-4 py-2.5 text-base font-semibold text-blue-600 shadow-md hover:bg-blue-50 hover:shadow-lg transition-all duration-200"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                                <span>İndi Yüklə</span>
                            </button>
                        )}

                        {isIOS && (
                            <div className="flex items-start space-x-2 text-sm text-blue-50">
                                <div className="flex-shrink-0 mt-0.5">
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium">Safari-də:</p>
                                    <ol className="mt-1 space-y-1 list-decimal list-inside">
                                        <li>Paylaş düyməsinə toxunun</li>
                                        <li>"Ana Ekrana Əlavə Et" seçin</li>
                                        <li>"Əlavə et" düyməsinə basın</li>
                                    </ol>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
