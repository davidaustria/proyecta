import { cn } from '@/lib/utils';
import {
    AlertCircleIcon,
    AlertTriangleIcon,
    CheckCircle2Icon,
    InfoIcon,
    XIcon,
} from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Toast item
 */
export type Toast = {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
};

/**
 * Toast context type
 */
type ToastContextType = {
    toasts: Toast[];
    toast: (
        message: string,
        options?: Partial<Omit<Toast, 'id' | 'message'>>,
    ) => void;
    success: (
        message: string,
        options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
    ) => void;
    error: (
        message: string,
        options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
    ) => void;
    info: (
        message: string,
        options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
    ) => void;
    warning: (
        message: string,
        options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
    ) => void;
    dismiss: (id: string) => void;
};

/**
 * Toast context
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast provider props
 */
type ToastProviderProps = {
    children: ReactNode;
};

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastType) {
    switch (type) {
        case 'success':
            return <CheckCircle2Icon className="size-5 text-green-500" />;
        case 'error':
            return <AlertCircleIcon className="size-5 text-red-500" />;
        case 'warning':
            return <AlertTriangleIcon className="size-5 text-yellow-500" />;
        case 'info':
            return <InfoIcon className="size-5 text-blue-500" />;
    }
}

/**
 * Get background color for toast type
 */
function getToastBgColor(type: ToastType) {
    switch (type) {
        case 'success':
            return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
        case 'error':
            return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
        case 'warning':
            return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
        case 'info':
            return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    /**
     * Dismiss a toast
     */
    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    /**
     * Add a toast
     */
    const toast = useCallback(
        (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) => {
            const id = Math.random().toString(36).substring(2, 9);
            const duration = options?.duration ?? 5000;

            const newToast: Toast = {
                id,
                message,
                type: options?.type ?? 'info',
                title: options?.title,
                duration,
            };

            setToasts((prev) => [...prev, newToast]);

            if (duration > 0) {
                setTimeout(() => {
                    dismiss(id);
                }, duration);
            }
        },
        [dismiss],
    );

    /**
     * Show success toast
     */
    const success = useCallback(
        (
            message: string,
            options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
        ) => {
            toast(message, { ...options, type: 'success' });
        },
        [toast],
    );

    /**
     * Show error toast
     */
    const error = useCallback(
        (
            message: string,
            options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
        ) => {
            toast(message, { ...options, type: 'error' });
        },
        [toast],
    );

    /**
     * Show info toast
     */
    const info = useCallback(
        (
            message: string,
            options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
        ) => {
            toast(message, { ...options, type: 'info' });
        },
        [toast],
    );

    /**
     * Show warning toast
     */
    const warning = useCallback(
        (
            message: string,
            options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>,
        ) => {
            toast(message, { ...options, type: 'warning' });
        },
        [toast],
    );

    return (
        <ToastContext.Provider
            value={{ toasts, toast, success, error, info, warning, dismiss }}
        >
            {children}
            {typeof window !== 'undefined' &&
                createPortal(
                    <div className="pointer-events-none fixed top-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]">
                        {toasts.map((t) => (
                            <div
                                key={t.id}
                                className={cn(
                                    'pointer-events-auto flex w-full gap-3 rounded-lg border p-4 shadow-lg transition-all',
                                    getToastBgColor(t.type),
                                    'animate-in slide-in-from-top-full sm:slide-in-from-right-full',
                                )}
                            >
                                <div className="flex-shrink-0">
                                    {getToastIcon(t.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    {t.title && (
                                        <div className="text-sm font-semibold">
                                            {t.title}
                                        </div>
                                    )}
                                    <div className="text-sm">{t.message}</div>
                                </div>
                                <button
                                    onClick={() => dismiss(t.id)}
                                    className="flex-shrink-0 rounded-xs opacity-70 transition-opacity hover:opacity-100"
                                    aria-label="Close"
                                >
                                    <XIcon className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>,
                    document.body,
                )}
        </ToastContext.Provider>
    );
}

/**
 * Custom hook to use toast notifications
 *
 * @example
 * ```tsx
 * const { success, error, info, warning, toast } = useToast();
 *
 * // Simple success toast
 * success('Customer created successfully');
 *
 * // Error toast with title
 * error('Failed to create customer', { title: 'Error' });
 *
 * // Custom toast
 * toast('Processing...', { type: 'info', duration: 0 }); // 0 = no auto-dismiss
 * ```
 */
export function useToast() {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}
