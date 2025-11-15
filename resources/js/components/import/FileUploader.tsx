import { Upload, X, FileSpreadsheet } from 'lucide-react';
import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    maxSize?: number; // in MB
    allowedExtensions?: string[];
}

export function FileUploader({
    onFileSelect,
    maxSize = 10,
    allowedExtensions = ['.xlsx', '.xls'],
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const validateFile = useCallback(
        (file: File): boolean => {
            setError('');

            // Check extension
            const fileName = file.name.toLowerCase();
            const hasValidExtension = allowedExtensions.some((ext) =>
                fileName.endsWith(ext.toLowerCase()),
            );

            if (!hasValidExtension) {
                setError(
                    `Formato de archivo no válido. Solo se permiten archivos: ${allowedExtensions.join(', ')}`,
                );
                return false;
            }

            // Check size
            const fileSizeInMB = file.size / (1024 * 1024);
            if (fileSizeInMB > maxSize) {
                setError(
                    `El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB`,
                );
                return false;
            }

            return true;
        },
        [allowedExtensions, maxSize],
    );

    const handleFile = useCallback(
        (file: File) => {
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        },
        [validateFile, onFileSelect],
    );

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [handleFile],
    );

    const handleFileInput = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        },
        [handleFile],
    );

    const handleRemoveFile = useCallback(() => {
        setSelectedFile(null);
        setError('');
    }, []);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 text-center transition-colors',
                            isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25',
                            error && 'border-destructive',
                        )}
                    >
                        {!selectedFile ? (
                            <>
                                <div className="rounded-full bg-muted p-4">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">
                                        Arrastra y suelta tu archivo Excel aquí
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        o haz clic para seleccionar un archivo
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    accept={allowedExtensions.join(',')}
                                    onChange={handleFileInput}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Formatos permitidos:{' '}
                                    {allowedExtensions.join(', ')} • Tamaño
                                    máximo: {maxSize}MB
                                </p>
                            </>
                        ) : (
                            <div className="flex w-full items-center gap-4 rounded-lg border bg-muted/50 p-4">
                                <div className="rounded bg-primary/10 p-2">
                                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm font-medium">
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(
                                            selectedFile.size /
                                            (1024 * 1024)
                                        ).toFixed(2)}{' '}
                                        MB
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveFile}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 rounded-lg border border-destructive bg-destructive/10 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
