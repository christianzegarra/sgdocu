import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, type PropsWithChildren } from "react";
import { Spinner } from "../ui/spinner";

type Props = PropsWithChildren<{
  onOk: () => Promise<void>;
}>;

export const DeleteDialog = ({ children, onOk }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLoading(true);
      await onOk();
    } catch (_) {
    } finally {
      setOpen(false);
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mensaje de Confirmación</AlertDialogTitle>
          <AlertDialogDescription>¿Estás seguro de que deseas eliminar este registro?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Spinner loading={loading}>
            <AlertDialogAction variant='destructive' onClick={onDelete}>
              Continuar
            </AlertDialogAction>
          </Spinner>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
