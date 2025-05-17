
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface ConfirmAlertProps {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "default" | "destructive";
}

export const confirmAlert = (props: ConfirmAlertProps): Promise<boolean> => {
  return new Promise((resolve) => {
    const dialog = document.createElement("div");
    dialog.id = "confirm-alert-dialog";
    document.body.appendChild(dialog);

    const handleClose = (confirmed: boolean) => {
      document.body.removeChild(dialog);
      resolve(confirmed);
    };

    const AlertDialogComponent = () => {
      const [open, setOpen] = useState(true);
      
      const handleOpenChange = (open: boolean) => {
        if (!open) {
          handleClose(false);
        }
        setOpen(open);
      };

      return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{props.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {props.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleClose(false)}>
                {props.cancelText || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleClose(true)}
                className={
                  props.type === "destructive" ? "bg-destructive hover:bg-destructive/90" : ""
                }
              >
                {props.confirmText || "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    // Render the component
    const root = ReactDOM.createRoot(dialog);
    root.render(<AlertDialogComponent />);
  });
};
