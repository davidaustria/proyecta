import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportProgressProps {
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    currentRecord?: number;
    totalRecords?: number;
    successCount?: number;
    errorCount?: number;
    errors?: string[];
    message?: string;
}

export function ImportProgress({
    status,
    progress = 0,
    currentRecord,
    totalRecords,
    successCount = 0,
    errorCount = 0,
    errors = [],
    message,
}: ImportProgressProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {status === 'processing' && (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                Importando datos...
                            </>
                        )}
                        {status === 'completed' && (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                                Importación completada
                            </>
                        )}
                        {status === 'failed' && (
                            <>
                                <XCircle className="h-5 w-5 text-destructive" />
                                Error en la importación
                            </>
                        )}
                        {status === 'idle' && <>Preparando importación...</>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Progreso
                            </span>
                            <span className="font-medium">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {currentRecord && totalRecords && (
                            <p className="text-xs text-muted-foreground">
                                Procesando registro {currentRecord} de{' '}
                                {totalRecords}
                            </p>
                        )}
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div
                            className={cn(
                                'rounded-lg p-4 text-sm',
                                status === 'processing' &&
                                    'bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200',
                                status === 'completed' &&
                                    'bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-200',
                                status === 'failed' &&
                                    'bg-destructive/10 text-destructive',
                            )}
                        >
                            {message}
                        </div>
                    )}

                    {/* Statistics */}
                    {(successCount > 0 || errorCount > 0) && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
                                <p className="text-sm text-muted-foreground">
                                    Exitosos
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                                    {successCount}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/30">
                                <p className="text-sm text-muted-foreground">
                                    Errores
                                </p>
                                <p className="text-2xl font-bold text-destructive">
                                    {errorCount}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error Log */}
                    {errors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">
                                Errores encontrados:
                            </p>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-muted/50 p-4">
                                {errors.map((error, index) => (
                                    <p
                                        key={index}
                                        className="text-xs text-destructive"
                                    >
                                        • {error}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
