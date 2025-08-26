import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmationDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  setIsOpen: (open: boolean) => void
}

/**
 * Renders a confirmation modal with a title, optional description, and Cancel/Confirm actions.
 *
 * The dialog is controlled by `isOpen`; changes to open state call `setIsOpen`. Clicking the
 * confirm or cancel buttons invokes `onConfirm` and `onCancel` respectively. Button labels can
 * be customized via `confirmLabel` and `cancelLabel` (defaulting to `"Confirm"` and `"Cancel"`).
 *
 * @param confirmLabel - Custom label for the confirm button; defaults to `"Confirm"`.
 * @param cancelLabel - Custom label for the cancel button; defaults to `"Cancel"`.
 *
 */
export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  setIsOpen,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}