import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonProps {
    /**
     * API endpoint for export (e.g., '/api/v1/reports/projections/1')
     */
    endpoint: string;

    /**
     * Filename for the downloaded file (optional, will use server filename if not provided)
     */
    filename?: string;

    /**
     * Additional query parameters or request body
     */
    params?: Record<string, unknown>;

    /**
     * Button variant
     */
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';

    /**
     * Button size
     */
    size?: 'default' | 'sm' | 'lg' | 'icon';

    /**
     * Custom button text (default: 'Exportar a Excel')
     */
    children?: React.ReactNode;

    /**
     * HTTP method (default: 'GET')
     */
    method?: 'GET' | 'POST';

    /**
     * Custom class name
     */
    className?: string;
}

export function ExportButton({
    endpoint,
    filename,
    params = {},
    variant = 'outline',
    size = 'default',
    children,
    method = 'GET',
    className,
}: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);
    const { success, error: showError } = useToast();

    const handleExport = async () => {
        setIsExporting(true);

        try {
            const config = {
                responseType: 'blob' as const,
                ...(method === 'GET' ? { params } : {}),
            };

            const response =
                method === 'GET'
                    ? await axios.get(endpoint, config)
                    : await axios.post(endpoint, params, config);

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Get filename from Content-Disposition header or use provided filename
            const contentDisposition = response.headers['content-disposition'];
            let downloadFilename = filename;

            if (!downloadFilename && contentDisposition) {
                const filenameMatch = contentDisposition.match(
                    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
                );
                if (filenameMatch && filenameMatch[1]) {
                    downloadFilename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            link.setAttribute('download', downloadFilename || 'export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            success('El archivo se ha descargado correctamente.', {
                title: 'Exportación exitosa',
            });
        } catch (error) {
            console.error('Error exporting:', error);

            let errorMessage =
                'No se pudo exportar el archivo. Por favor, intenta de nuevo.';

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    errorMessage = 'No se encontraron datos para exportar.';
                } else if (error.response?.status === 422) {
                    errorMessage =
                        'Los parámetros de exportación no son válidos.';
                } else if (error.response?.status === 500) {
                    errorMessage = 'Error del servidor al generar el reporte.';
                }
            }

            showError(errorMessage, {
                title: 'Error al exportar',
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleExport}
            disabled={isExporting}
            className={className}
        >
            {isExporting ? (
                <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Exportando...
                </>
            ) : (
                <>
                    <Download className="mr-2 size-4" />
                    {children || 'Exportar a Excel'}
                </>
            )}
        </Button>
    );
}
