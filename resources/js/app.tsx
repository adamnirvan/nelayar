import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import GisLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { applyStoredToken } from '@/lib/auth';
import { startOfflineSync } from '@/lib/offline/sync';
import { registerServiceWorker } from '@/lib/pwa';

applyStoredToken();
registerServiceWorker();
startOfflineSync();

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'Landing':
            case name === 'Prices/Index':
            case name === 'Auth/Register':
            case name === 'Auth/Login':
            case name === 'Auth/ForgotPassword':
            case name === 'Auth/ResetPassword':
                return null;
            case name.startsWith('Auth/'):
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
            case name.startsWith('teams/'):
                return [AppLayout, SettingsLayout];
            case name.startsWith('Map/'):
            case name.startsWith('Weather/'):
                return GisLayout;
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
