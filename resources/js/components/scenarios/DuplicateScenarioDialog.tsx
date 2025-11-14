import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/useToast';
import type { Scenario } from '@/types';

interface DuplicateScenarioDialogProps {
  scenario: Scenario;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDuplicationComplete?: () => void;
  trigger?: React.ReactNode;
}

export function DuplicateScenarioDialog({
  scenario,
  open: controlledOpen,
  onOpenChange,
  onDuplicationComplete,
  trigger,
}: DuplicateScenarioDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(`${scenario.name} (Copia)`);
  const [copyAssumptions, setCopyAssumptions] = useState(true);
  const [copyProjections, setCopyProjections] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const { toast } = useToast();

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset form when opening
      setName(`${scenario.name} (Copia)`);
      setCopyAssumptions(true);
      setCopyProjections(false);
      setNameError(null);
    }
    setIsOpen(open);
  };

  const handleDuplicate = () => {
    // Validate name
    if (!name.trim()) {
      setNameError('El nombre es requerido');
      return;
    }

    if (name.trim() === scenario.name) {
      setNameError('El nombre debe ser diferente al original');
      return;
    }

    setIsDuplicating(true);
    setNameError(null);

    router.post(
      `/api/v1/scenarios/${scenario.id}/duplicate`,
      {
        name: name.trim(),
        copy_assumptions: copyAssumptions,
        copy_projections: copyProjections,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast({
            title: 'Escenario duplicado',
            description: `El escenario "${name}" ha sido creado exitosamente.`,
            variant: 'success',
          });

          setIsOpen(false);
          onDuplicationComplete?.();
        },
        onError: (errors: any) => {
          if (errors.name) {
            setNameError(errors.name);
          } else {
            const errorMessage = errors.error || 'Ocurrió un error al duplicar el escenario';
            toast({
              title: 'Error al duplicar',
              description: errorMessage,
              variant: 'destructive',
            });
          }
        },
        onFinish: () => {
          setIsDuplicating(false);
        },
      }
    );
  };

  const dialogContent = (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Duplicar Escenario</DialogTitle>
          <DialogDescription>
            Crea una copia del escenario "{scenario.name}" con una nueva configuración.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del nuevo escenario <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              placeholder="Ingresa el nombre del escenario"
              disabled={isDuplicating}
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <Label>Opciones de duplicación</Label>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="copy_assumptions"
                checked={copyAssumptions}
                onCheckedChange={(checked) => setCopyAssumptions(checked as boolean)}
                disabled={isDuplicating}
              />
              <div className="space-y-1">
                <label
                  htmlFor="copy_assumptions"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Copiar supuestos
                </label>
                <p className="text-sm text-muted-foreground">
                  Incluir todos los supuestos configurados ({scenario.assumptions_count} total)
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="copy_projections"
                checked={copyProjections}
                onCheckedChange={(checked) => setCopyProjections(checked as boolean)}
                disabled={isDuplicating}
              />
              <div className="space-y-1">
                <label
                  htmlFor="copy_projections"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Copiar proyecciones
                </label>
                <p className="text-sm text-muted-foreground">
                  Incluir proyecciones existentes ({scenario.projections_count} total). No
                  recomendado, es preferible recalcularlas.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-3 rounded-md text-sm">
            <p className="font-medium mb-1">Información del escenario original:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Año base: {scenario.base_year}</li>
              <li>Años de proyección: {scenario.projection_years}</li>
              <li>Método: {scenario.calculation_method === 'average' ? 'Promedio Simple' : 'Análisis de Tendencias'}</li>
              <li>Estado: Se creará como "Borrador"</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDuplicating}
          >
            Cancelar
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating}>
            {isDuplicating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Duplicando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // If trigger is provided, wrap in a button
  if (trigger) {
    return (
      <>
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
        {dialogContent}
      </>
    );
  }

  return dialogContent;
}
