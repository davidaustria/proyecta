import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Options for confirmation dialog
 */
export type ConfirmOptions = {
    /**
     * Dialog title
     */
    title?: string;
    /**
     * Dialog description/message
     */
    description?: string;
    /**
     * Confirm button text
     */
    confirmText?: string;
    /**
     * Cancel button text
     */
    cancelText?: string;
    /**
     * Confirm button variant
     */
    confirmVariant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    /**
     * Cancel button variant
     */
    cancelVariant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
};

/**
 * Default options for confirmation dialog
 */
const defaultOptions: ConfirmOptions = {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'default',
    cancelVariant: 'outline',
};

/**
 * Custom hook for confirmation dialogs
 *
 * @example
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete customer',
 *     description: 'Are you sure you want to delete this customer? This action cannot be undone.',
 *     confirmText: 'Delete',
 *     confirmVariant: 'destructive',
 *   });
 *
 *   if (confirmed) {
 *     // Perform delete action
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export function useConfirm() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>(defaultOptions);
    const [resolvePromise, setResolvePromise] = useState<
        ((value: boolean) => void) | null
    >(null);

    /**
     * Show confirmation dialog and return a promise that resolves to true if confirmed
     */
    const confirm = useCallback(
        (confirmOptions?: ConfirmOptions): Promise<boolean> => {
            return new Promise((resolve) => {
                setOptions({ ...defaultOptions, ...confirmOptions });
                setIsOpen(true);
                setResolvePromise(() => resolve);
            });
        },
        [],
    );

    /**
     * Handle confirm action
     */
    const handleConfirm = useCallback(() => {
        setIsOpen(false);
        resolvePromise?.(true);
        setResolvePromise(null);
    }, [resolvePromise]);

    /**
     * Handle cancel action
     */
    const handleCancel = useCallback(() => {
        setIsOpen(false);
        resolvePromise?.(false);
        setResolvePromise(null);
    }, [resolvePromise]);

    /**
     * Handle open change (for dialog close)
     */
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                handleCancel();
            }
        },
        [handleCancel],
    );

    /**
     * Confirmation dialog component
     */
    const ConfirmDialog = useCallback(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        return createPortal(
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        {options.description && (
                            <DialogDescription>
                                {options.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant={options.cancelVariant}
                            onClick={handleCancel}
                            type="button"
                        >
                            {options.cancelText}
                        </Button>
                        <Button
                            variant={options.confirmVariant}
                            onClick={handleConfirm}
                            type="button"
                        >
                            {options.confirmText}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>,
            document.body,
        );
    }, [isOpen, options, handleOpenChange, handleCancel, handleConfirm]);

    return {
        confirm,
        ConfirmDialog,
        isOpen,
    };
}
