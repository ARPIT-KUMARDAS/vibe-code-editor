import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

interface DeleteDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Displays a confirmation dialog for deleting an item.
 *
 * Renders a destructive confirmation AlertDialog with a title, description, and Cancel/Confirm actions.
 * The `description` string will have the token `{item}` replaced with the quoted `itemName` (e.g. `"My File"`).
 *
 * @param isOpen - Whether the dialog is currently open.
 * @param setIsOpen - Callback invoked with the new open state (used by the AlertDialog).
 * @param title - Optional dialog title. Defaults to `"Delete Item"`.
 * @param description - Optional description text. Defaults to `"Are you sure you want to delete this item? This action cannot be undone."`
 * @param itemName - Optional item name inserted into the description at `{item}`.
 * @param onConfirm - Callback invoked when the confirm action is clicked.
 * @param confirmLabel - Label for the confirm button. Defaults to `"Delete"`.
 * @param cancelLabel - Label for the cancel button. Defaults to `"Cancel"`.
 * @returns The AlertDialog JSX element for the delete confirmation.
 */
export function DeleteDialog({
  isOpen,
  setIsOpen,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  onConfirm,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: DeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description.replace("{item}", `"${itemName}"`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}