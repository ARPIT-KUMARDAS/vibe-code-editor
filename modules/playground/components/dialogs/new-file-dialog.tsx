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

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (filename: string, extension: string) => void;
}

/**
 * Modal dialog for creating a new file by entering a filename and extension.
 *
 * Shows inputs for "Filename" and "Extension", validates that the filename is non-empty,
 * and calls `onCreateFile(filename, extension)` with trimmed values when the form is submitted.
 * After successful submit the inputs are reset (filename -> "" and extension -> "js").
 *
 * @param isOpen - Controls whether the dialog is visible.
 * @param onClose - Callback invoked to close the dialog (also passed to the dialog's open-change handler and cancel button).
 * @param onCreateFile - Callback invoked on successful creation with `(filename: string, extension: string)`.
 * @returns A JSX element rendering the new-file creation dialog.
 */
function NewFileDialog({ isOpen, onClose, onCreateFile }: NewFileDialogProps) {
  const [filename, setFilename] = React.useState("");
  const [extension, setExtension] = React.useState("js");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filename.trim()) {
      onCreateFile(filename.trim(), extension.trim() || "js");
      setFilename("");
      setExtension("js");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Enter a name for the new file and select its extension.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                Filename
              </Label>
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="col-span-2"
                autoFocus
                placeholder="main"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="extension" className="text-right">
                Extension
              </Label>
              <Input
                id="extension"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                className="col-span-2"
                placeholder="js"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!filename.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewFileDialog;   