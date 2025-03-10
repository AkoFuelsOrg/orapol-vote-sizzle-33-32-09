
import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface UnfollowDialogProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const UnfollowDialog: React.FC<UnfollowDialogProps> = ({
  username,
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Unfollow Confirmation
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to unfollow <span className="font-medium text-red-500">{username}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="flex items-center">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="flex items-center bg-primary text-primary-foreground">
            <Check className="h-4 w-4 mr-1" />
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UnfollowDialog;
