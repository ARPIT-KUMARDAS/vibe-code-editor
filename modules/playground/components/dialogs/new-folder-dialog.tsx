"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

interface NewFolderDialogProps {
    isOpen: boolean
    onClose: () => void
    onCreateFolder: (folderName: string) => void
  }

  /**
   * Renders a modal dialog that allows the user to create a new folder.
   *
   * The dialog provides a single input for the folder name. Submitting with a non-empty
   * trimmed name invokes `onCreateFolder` with that name and clears the input. The
   * "Create" button is disabled while the input is empty or contains only whitespace.
   * `onClose` is used to close the dialog and is wired to the dialog's open state.
   *
   * @param isOpen - Whether the dialog is currently open.
   * @param onClose - Callback to close the dialog.
   * @param onCreateFolder - Callback invoked with the trimmed folder name when the form is submitted.
   * @returns A JSX element representing the "Create New Folder" modal dialog.
   */
  function NewFolderDialog({ isOpen, onClose, onCreateFolder }: NewFolderDialogProps) {
    const [folderName, setFolderName] = React.useState("")
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (folderName.trim()) {
        onCreateFolder(folderName.trim())
        setFolderName("")
      }
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Enter a name for the new folder.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="foldername" className="text-right">
                  Folder Name
                </Label>
                <Input
                  id="foldername"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="col-span-2"
                  autoFocus
                  placeholder="components"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!folderName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  export default NewFolderDialog;