import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/formatters';
import type { ImportBatch } from '@/types';
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    FileText,
    XCircle,
} from 'lucide-react';

interface ImportResultsProps {
    batch: ImportBatch;
    onViewDetails?: () => void;
    onDownloadErrorLog?: () => void;
    onStartNew?: () => void;
}

export function ImportResults({
    batch,
    onViewDetails,
    onDownloadErrorLog,
    onStartNew,
}: ImportResultsProps) {
    const hasErrors = batch.failed_records > 0;
    const isFullSuccess = batch.failed_records === 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                {isFullSuccess ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                                        Importación completada exitosamente
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                                        Importación completada con errores
                                    </>
                                )}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Archivo: {batch.filename}
                            </p>
                        </div>
                        <Badge
                            variant={
                                batch.status === 'completed'
                                    ? 'default'
                                    : 'destructive'
                            }
                        >
                            {batch.status === 'completed'
                                ? 'Completado'
                                : 'Fallido'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">
                                Total de registros
                            </p>
                            <p className="text-2xl font-bold">
                                {batch.total_records}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/30">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                                <p className="text-sm text-muted-foreground">
                                    Exitosos
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                                {batch.successful_records}
                            </p>
                        </div>
                        <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/30">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-destructive" />
                                <p className="text-sm text-muted-foreground">
                                    Fallidos
                                </p>
                            </div>
                            <p className="text-2xl font-bold text-destructive">
                                {batch.failed_records}
                            </p>
                        </div>
                    </div>

                    {/* Import Details */}
                    <div className="space-y-2 rounded-lg border bg-muted/50 p-4">
                        <h4 className="text-sm font-medium">
                            Detalles de la importación
                        </h4>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-muted-foreground">
                                Fecha de importación:
                            </dt>
                            <dd className="font-medium">
                                {formatDateTime(batch.created_at)}
                            </dd>
                            {batch.source_system && (
                                <>
                                    <dt className="text-muted-foreground">
                                        Sistema origen:
                                    </dt>
                                    <dd className="font-medium">
                                        {batch.source_system}
                                    </dd>
                                </>
                            )}
                            <dt className="text-muted-foreground">
                                Tasa de éxito:
                            </dt>
                            <dd className="font-medium">
                                {batch.total_records > 0
                                    ? Math.round(
                                          (batch.successful_records /
                                              batch.total_records) *
                                              100,
                                      )
                                    : 0}
                                %
                            </dd>
                        </dl>
                    </div>

                    {/* Error Log Preview */}
                    {hasErrors && batch.error_log && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">
                                Errores encontrados
                            </h4>
                            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border bg-muted/50 p-4">
                                <pre className="text-xs whitespace-pre-wrap text-destructive">
                                    {JSON.stringify(batch.error_log, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                        {onViewDetails && (
                            <Button
                                variant="outline"
                                onClick={onViewDetails}
                                className="gap-2"
                            >
                                <FileText className="h-4 w-4" />
                                Ver detalles completos
                            </Button>
                        )}
                        {hasErrors && onDownloadErrorLog && (
                            <Button
                                variant="outline"
                                onClick={onDownloadErrorLog}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Descargar log de errores
                            </Button>
                        )}
                        {onStartNew && (
                            <Button onClick={onStartNew} className="gap-2">
                                Nueva importación
                            </Button>
                        )}
                    </div>

                    {/* Success Message */}
                    {isFullSuccess && (
                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/30">
                            <p className="text-sm text-green-900 dark:text-green-200">
                                ✓ Todas las facturas se importaron
                                correctamente. Ahora puedes usar estos datos
                                para crear escenarios de proyección.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
