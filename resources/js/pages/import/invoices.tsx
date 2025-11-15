import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app-sidebar-layout';
import { PageHeader } from '@/components/PageHeader';
import { FileUploader } from '@/components/import/FileUploader';
import {
    ColumnMapper,
    type SystemField,
} from '@/components/import/ColumnMapper';
import { ImportProgress } from '@/components/import/ImportProgress';
import { ImportResults } from '@/components/import/ImportResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type {
    ColumnMapping,
    ImportBatch,
    ImportPreviewData,
    ImportPreviewRow,
} from '@/types';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import axios from 'axios';

const SYSTEM_FIELDS: SystemField[] = [
    {
        key: 'invoice_number',
        label: 'Número de Factura',
        required: true,
        description: 'Identificador único de la factura',
    },
    {
        key: 'customer_code',
        label: 'Código de Cliente',
        required: true,
        description: 'Código del cliente (debe existir en el sistema)',
    },
    {
        key: 'invoice_date',
        label: 'Fecha de Factura',
        required: true,
        description: 'Fecha de emisión (formato: YYYY-MM-DD)',
    },
    {
        key: 'due_date',
        label: 'Fecha de Vencimiento',
        required: false,
        description: 'Fecha de vencimiento (opcional)',
    },
    {
        key: 'subtotal',
        label: 'Subtotal',
        required: true,
        description: 'Monto antes de impuestos',
    },
    {
        key: 'tax',
        label: 'Impuesto',
        required: true,
        description: 'Monto de impuestos',
    },
    {
        key: 'total',
        label: 'Total',
        required: true,
        description: 'Monto total (subtotal + impuesto)',
    },
    {
        key: 'currency',
        label: 'Moneda',
        required: false,
        description: 'Código de moneda (default: MXN)',
    },
    {
        key: 'status',
        label: 'Estado',
        required: false,
        description: 'Estado de la factura (default: issued)',
    },
];

const STEPS = [
    { id: 1, name: 'Subir Archivo', description: 'Seleccionar archivo Excel' },
    {
        id: 2,
        name: 'Mapear Columnas',
        description: 'Relacionar columnas con campos',
    },
    {
        id: 3,
        name: 'Vista Previa',
        description: 'Validar datos antes de importar',
    },
    { id: 4, name: 'Importar', description: 'Ejecutar importación' },
];

export default function InvoicesImport() {
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [previewData, setPreviewData] = useState<ImportPreviewData | null>(
        null,
    );
    const [importBatch, setImportBatch] = useState<ImportBatch | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [importStatus, setImportStatus] = useState<
        'idle' | 'processing' | 'completed' | 'failed'
    >('idle');

    const handleFileSelect = async (file: File) => {
        setSelectedFile(file);
        setIsLoading(true);

        try {
            // Upload file to get headers
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post<{ headers: string[] }>(
                '/api/v1/import/upload',
                formData,
            );

            setExcelHeaders(response.data.headers);

            // Auto-map columns based on name similarity
            const autoMappings: ColumnMapping[] = [];
            response.data.headers.forEach((header) => {
                const normalizedHeader = header.toLowerCase().trim();
                const matchingField = SYSTEM_FIELDS.find(
                    (field) =>
                        field.key.toLowerCase() === normalizedHeader ||
                        field.label.toLowerCase() === normalizedHeader,
                );
                if (matchingField) {
                    autoMappings.push({
                        excel_column: header,
                        system_field: matchingField.key,
                    });
                }
            });
            setMappings(autoMappings);

            toast.success('Archivo cargado correctamente');
        } catch (error) {
            toast.error('Error al cargar el archivo');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        if (currentStep === 2) {
            // Validate mappings before proceeding to preview
            const requiredFields = SYSTEM_FIELDS.filter((f) => f.required).map(
                (f) => f.key,
            );
            const mappedFields = new Set(mappings.map((m) => m.system_field));
            const missingFields = requiredFields.filter(
                (f) => !mappedFields.has(f),
            );

            if (missingFields.length > 0) {
                toast.error(
                    'Por favor mapea todos los campos requeridos antes de continuar',
                );
                return;
            }

            // Generate preview
            await generatePreview();
        } else if (currentStep === 3) {
            // Proceed to import
            await executeImport();
        }

        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const generatePreview = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('mappings', JSON.stringify(mappings));

            const response = await axios.post<ImportPreviewData>(
                '/api/v1/import/preview',
                formData,
            );

            setPreviewData(response.data);
            toast.success('Vista previa generada');
        } catch (error) {
            toast.error('Error al generar vista previa');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const executeImport = async () => {
        if (!selectedFile) return;

        setImportStatus('processing');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('mappings', JSON.stringify(mappings));

            const response = await axios.post<ImportBatch>(
                '/api/v1/import/import',
                formData,
            );

            setImportBatch(response.data);
            setImportStatus('completed');
            toast.success('Importación completada');
        } catch (error) {
            setImportStatus('failed');
            toast.error('Error durante la importación');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartNew = () => {
        setCurrentStep(1);
        setSelectedFile(null);
        setExcelHeaders([]);
        setMappings([]);
        setPreviewData(null);
        setImportBatch(null);
        setImportStatus('idle');
    };

    const canProceed = () => {
        if (currentStep === 1) return selectedFile !== null;
        if (currentStep === 2) {
            const requiredFields = SYSTEM_FIELDS.filter((f) => f.required).map(
                (f) => f.key,
            );
            const mappedFields = new Set(mappings.map((m) => m.system_field));
            return requiredFields.every((f) => mappedFields.has(f));
        }
        if (currentStep === 3)
            return previewData && previewData.valid_rows > 0;
        return true;
    };

    return (
        <AppSidebarLayout>
            <Head title="Importar Facturas" />

            <div className="space-y-6">
                <PageHeader
                    title="Importar Facturas"
                    subtitle="Importa tus facturas históricas desde un archivo Excel"
                />

                {/* Steps Indicator */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={cn(
                                                'flex h-10 w-10 items-center justify-center rounded-full border-2 font-medium transition-colors',
                                                currentStep > step.id
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : currentStep === step.id
                                                      ? 'border-primary bg-background text-primary'
                                                      : 'border-muted-foreground/25 bg-background text-muted-foreground',
                                            )}
                                        >
                                            {currentStep > step.id ? (
                                                <CheckCircle2 className="h-5 w-5" />
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p
                                                className={cn(
                                                    'text-sm font-medium',
                                                    currentStep >= step.id
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {step.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={cn(
                                                'mx-4 h-0.5 w-24 transition-colors',
                                                currentStep > step.id
                                                    ? 'bg-primary'
                                                    : 'bg-muted-foreground/25',
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {currentStep === 1 && (
                        <FileUploader
                            onFileSelect={handleFileSelect}
                            maxSize={10}
                            allowedExtensions={['.xlsx', '.xls']}
                        />
                    )}

                    {currentStep === 2 && (
                        <ColumnMapper
                            excelHeaders={excelHeaders}
                            systemFields={SYSTEM_FIELDS}
                            mappings={mappings}
                            onMappingChange={setMappings}
                        />
                    )}

                    {currentStep === 3 && previewData && (
                        <PreviewTable previewData={previewData} />
                    )}

                    {currentStep === 4 && !importBatch && (
                        <ImportProgress
                            status={importStatus}
                            progress={importStatus === 'completed' ? 100 : 50}
                        />
                    )}

                    {currentStep === 4 && importBatch && (
                        <ImportResults
                            batch={importBatch}
                            onViewDetails={() =>
                                router.visit(`/import/history/${importBatch.id}`)
                            }
                            onStartNew={handleStartNew}
                        />
                    )}
                </div>

                {/* Navigation Buttons */}
                {currentStep < 4 && (
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={handleBack}
                            disabled={currentStep === 1 || isLoading}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Atrás
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                            className="gap-2"
                        >
                            {currentStep === 3 ? 'Importar' : 'Siguiente'}
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </AppSidebarLayout>
    );
}

function PreviewTable({
    previewData,
}: {
    previewData: ImportPreviewData;
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                            Vista Previa de Datos
                        </h3>
                        <div className="flex gap-2">
                            <Badge variant="default">
                                {previewData.valid_rows} válidos
                            </Badge>
                            {previewData.invalid_rows > 0 && (
                                <Badge variant="destructive">
                                    {previewData.invalid_rows} con errores
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">
                                        #
                                    </th>
                                    {previewData.headers.map((header) => (
                                        <th
                                            key={header}
                                            className="px-4 py-3 text-left font-medium"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3 text-left font-medium">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.rows
                                    .slice(0, 10)
                                    .map((row: ImportPreviewRow) => (
                                        <tr
                                            key={row.row_number}
                                            className={cn(
                                                'border-b',
                                                !row.is_valid &&
                                                    'bg-destructive/5',
                                            )}
                                        >
                                            <td className="px-4 py-2 text-muted-foreground">
                                                {row.row_number}
                                            </td>
                                            {previewData.headers.map(
                                                (header) => (
                                                    <td
                                                        key={header}
                                                        className="px-4 py-2"
                                                    >
                                                        {String(
                                                            row.data[header] ||
                                                                '',
                                                        )}
                                                    </td>
                                                ),
                                            )}
                                            <td className="px-4 py-2">
                                                {row.is_valid ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                                    >
                                                        Válido
                                                    </Badge>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <Badge variant="destructive">
                                                            Error
                                                        </Badge>
                                                        {row.errors && (
                                                            <div className="text-xs text-destructive">
                                                                {row.errors.join(
                                                                    ', ',
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {previewData.total_rows > 10 && (
                        <p className="text-sm text-muted-foreground">
                            Mostrando las primeras 10 filas de{' '}
                            {previewData.total_rows} registros totales
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
