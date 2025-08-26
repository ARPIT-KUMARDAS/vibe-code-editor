"use client";

import * as React from "react";
import {
  ChevronRight,
  File,
  Folder,
  Plus,
  FilePlus,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import RenameFolderDialog from "./dialogs/rename-folder-dialog";
import NewFolderDialog from "./dialogs/new-folder-dialog";
import NewFileDialog from "./dialogs/new-file-dialog";
import RenameFileDialog from "./dialogs/rename-file-dialog";
import { DeleteDialog } from "./dialogs/delete-dialog";
import { TemplateFile, TemplateFolder, TemplateItem } from "../lib/path-to-json";

interface TemplateFileTreeProps {
  data: TemplateItem;
  onFileSelect?: (file: TemplateFile) => void;
  selectedFile?: TemplateFile;
  title?: string;
  onAddFile?: (file: TemplateFile, parentPath: string) => void;
  onAddFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onDeleteFile?: (file: TemplateFile, parentPath: string) => void;
  onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onRenameFile?: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string
  ) => void;
  onRenameFolder?: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string
  ) => void;
}

/**
 * Render a sidebar file/folder tree for a template, with UI for creating, renaming, deleting, and selecting items.
 *
 * Renders either a root folder (its items) or a single file and recursively displays nested folders. Opens dialogs for
 * New File, New Folder, Rename, and Delete actions and forwards changes upward via the provided callbacks. Parent paths
 * are passed as an empty string for root-level operations and as "parentPath/folderName" for nested items.
 *
 * @param data - Root TemplateItem to render (TemplateFolder or TemplateFile).
 * @param onFileSelect - Invoked with a TemplateFile when the user selects a file.
 * @param selectedFile - Currently selected TemplateFile (used to mark the active file in the UI).
 * @param title - Title shown in the sidebar group header. Defaults to "Files Explorer".
 * @param onAddFile - Called as (file, parentPath) when a new file is created.
 * @param onAddFolder - Called as (folder, parentPath) when a new folder is created.
 * @param onDeleteFile - Called as (file, parentPath) after a file is confirmed deleted.
 * @param onDeleteFolder - Called as (folder, parentPath) after a folder is confirmed deleted.
 * @param onRenameFile - Called as (file, newFilename, newExtension, parentPath) when a file is renamed.
 * @param onRenameFolder - Called as (folder, newFolderName, parentPath) when a folder is renamed.
 */
export function TemplateFileTree({
  data,
  onFileSelect,
  selectedFile,
  title = "Files Explorer",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: TemplateFileTreeProps) {
  const isRootFolder = data && typeof data === "object" && "folderName" in data;
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = React.useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] =
    React.useState(false);

  const handleAddRootFile = () => {
    setIsNewFileDialogOpen(true);
  };

  const handleAddRootFolder = () => {
    setIsNewFolderDialogOpen(true);
  };

  const handleCreateFile = (filename: string, extension: string) => {
    if (onAddFile && isRootFolder) {
      const newFile: TemplateFile = {
        filename,
        fileExtension: extension,
        content: "",
      };
      onAddFile(newFile, "");
    }
    setIsNewFileDialogOpen(false);
  };

  const handleCreateFolder = (folderName: string) => {
    if (onAddFolder && isRootFolder) {
      const newFolder: TemplateFolder = {
        folderName,
        items: [],
      };
      onAddFolder(newFolder, "");
    }
    setIsNewFolderDialogOpen(false);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{title}</SidebarGroupLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarGroupAction>
                <Plus className="h-4 w-4" />
              </SidebarGroupAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddRootFile}>
                <FilePlus className="h-4 w-4 mr-2" />
                New File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddRootFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SidebarGroupContent>
            <SidebarMenu>
              {isRootFolder ? (
                (data as TemplateFolder).items.map((child, index) => (
                  <TemplateNode
                    key={index}
                    item={child}
                    onFileSelect={onFileSelect}
                    selectedFile={selectedFile}
                    level={0}
                    path=""
                    onAddFile={onAddFile}
                    onAddFolder={onAddFolder}
                    onDeleteFile={onDeleteFile}
                    onDeleteFolder={onDeleteFolder}
                    onRenameFile={onRenameFile}
                    onRenameFolder={onRenameFolder}
                  />
                ))
              ) : (
                <TemplateNode
                  item={data}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={0}
                  path=""
                  onAddFile={onAddFile}
                  onAddFolder={onAddFolder}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFile={onRenameFile}
                  onRenameFolder={onRenameFolder}
                />
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />

      <NewFileDialog
        isOpen={isNewFileDialogOpen}
        onClose={() => setIsNewFileDialogOpen(false)}
        onCreateFile={handleCreateFile}
      />

      <NewFolderDialog
        isOpen={isNewFolderDialogOpen}
        onClose={() => setIsNewFolderDialogOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </Sidebar>
  );
}

interface TemplateNodeProps {
  item: TemplateItem;
  onFileSelect?: (file: TemplateFile) => void;
  selectedFile?: TemplateFile;
  level: number;
  path?: string;
  onAddFile?: (file: TemplateFile, parentPath: string) => void;
  onAddFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onDeleteFile?: (file: TemplateFile, parentPath: string) => void;
  onDeleteFolder?: (folder: TemplateFolder, parentPath: string) => void;
  onRenameFile?: (
    file: TemplateFile,
    newFilename: string,
    newExtension: string,
    parentPath: string
  ) => void;
  onRenameFolder?: (
    folder: TemplateFolder,
    newFolderName: string,
    parentPath: string
  ) => void;
}

/**
 * Renders a single node in the template file/folder tree (file or folder) and manages its local UI state.
 *
 * This component:
 * - Renders a file item with select, rename, and delete actions.
 * - Renders a folder item as a collapsible container with actions to add files/folders, rename, and delete; children are rendered recursively.
 * - Manages dialog state (new file/folder, rename, delete) and invokes the provided callbacks with the appropriate parent path context.
 *
 * Notes on parameters and callback shapes:
 * - item: either a TemplateFile or TemplateFolder. If the value is falsy or not an object, the node renders nothing.
 * - level: numeric depth in the tree; folders initialize their collapsed state open when level < 2.
 * - path: the parent path for this node (empty string for root). For nested folders, the component computes currentPath as `path ? `${path}/${folderName}` : folderName` and passes that path to callbacks invoked for items inside this node.
 * - onFileSelect(file): called when a file is selected.
 * - onAddFile(newFile, parentPath): called when creating a file inside this folder (or at root); parentPath is the folder path where the file should be added.
 * - onAddFolder(newFolder, parentPath): called when creating a subfolder; parentPath is the folder path where the folder should be added.
 * - onDeleteFile(file, parentPath): called after confirming deletion of a file; parentPath is the path that contained the file.
 * - onDeleteFolder(folder, parentPath): called after confirming deletion of a folder; parentPath is the path that contained the folder (not including the folder being deleted).
 * - onRenameFile(file, newFilename, newExtension, parentPath): called when a file is renamed.
 * - onRenameFolder(folder, newFolderName, parentPath): called when a folder is renamed.
 */
function TemplateNode({
  item,
  onFileSelect,
  selectedFile,
  level,
  path = "",
  onAddFile,
  onAddFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
}: TemplateNodeProps) {
  const isValidItem = item && typeof item === "object";
  const isFolder = isValidItem && "folderName" in item;
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = React.useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] =
    React.useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(level < 2);

  if (!isValidItem) return null;

  if (!isFolder) {
    const file = item as TemplateFile;
    const fileName = `${file.filename}.${file.fileExtension}`;

    const isSelected =
      selectedFile &&
      selectedFile.filename === file.filename &&
      selectedFile.fileExtension === file.fileExtension;

    const handleRename = () => {
      setIsRenameDialogOpen(true);
    };

    const handleDelete = () => {
      setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
      onDeleteFile?.(file, path);
      setIsDeleteDialogOpen(false);
    };

    const handleRenameSubmit = (newFilename: string, newExtension: string) => {
      onRenameFile?.(file, newFilename, newExtension, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <SidebarMenuItem>
        <div className="flex items-center group">
          <SidebarMenuButton
            isActive={isSelected}
            onClick={() => onFileSelect?.(file)}
            className="flex-1"
          >
            <File className="h-4 w-4 mr-2 shrink-0" />
            <span>{fileName}</span>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRename}>
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <RenameFileDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onRename={handleRenameSubmit}
          currentFilename={file.filename}
          currentExtension={file.fileExtension}
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete File"
          description={'Are you sure you want to delete "{fileName}"? This action cannot be undone.'}
          itemName={fileName}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      </SidebarMenuItem>
    );
  } else {
    const folder = item as TemplateFolder;
    const folderName = folder.folderName;
    const currentPath = path ? `${path}/${folderName}` : folderName;

    const handleAddFile = () => {
      setIsNewFileDialogOpen(true);
    };

    const handleAddFolder = () => {
      setIsNewFolderDialogOpen(true);
    };

    const handleRename = () => {
      setIsRenameDialogOpen(true);
    };

    const handleDelete = () => {
      setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
      onDeleteFolder?.(folder, path);
      setIsDeleteDialogOpen(false);
    };

    const handleCreateFile = (filename: string, extension: string) => {
      if (onAddFile) {
        const newFile: TemplateFile = {
          filename,
          fileExtension: extension,
          content: "",
        };
        onAddFile(newFile, currentPath);
      }
      setIsNewFileDialogOpen(false);
    };

    const handleCreateFolder = (folderName: string) => {
      if (onAddFolder) {
        const newFolder: TemplateFolder = {
          folderName,
          items: [],
        };
        onAddFolder(newFolder, currentPath);
      }
      setIsNewFolderDialogOpen(false);
    };

    const handleRenameSubmit = (newFolderName: string) => {
      onRenameFolder?.(folder, newFolderName, path);
      setIsRenameDialogOpen(false);
    };

    return (
      <SidebarMenuItem>
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="group/collapsible [&[data-state=open]>div>button>svg:first-child]:rotate-90"
        >
          <div className="flex items-center group">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="flex-1">
                <ChevronRight className="transition-transform" />
                <Folder className="h-4 w-4 mr-2 shrink-0" />
                <span>{folderName}</span>
              </SidebarMenuButton>
            </CollapsibleTrigger>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAddFile}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddFolder}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleRename}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CollapsibleContent>
            <SidebarMenuSub>
              {folder.items.map((childItem, index) => (
                <TemplateNode
                  key={index}
                  item={childItem}
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  level={level + 1}
                  path={currentPath}
                  onAddFile={onAddFile}
                  onAddFolder={onAddFolder}
                  onDeleteFile={onDeleteFile}
                  onDeleteFolder={onDeleteFolder}
                  onRenameFile={onRenameFile}
                  onRenameFolder={onRenameFolder}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>

        <NewFileDialog
          isOpen={isNewFileDialogOpen}
          onClose={() => setIsNewFileDialogOpen(false)}
          onCreateFile={handleCreateFile}
        />

        <NewFolderDialog
          isOpen={isNewFolderDialogOpen}
          onClose={() => setIsNewFolderDialogOpen(false)}
          onCreateFolder={handleCreateFolder}
        />

        <RenameFolderDialog
          isOpen={isRenameDialogOpen}
          onClose={() => setIsRenameDialogOpen(false)}
          onRename={handleRenameSubmit}
          currentFolderName={folderName}
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          setIsOpen={setIsDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Delete Folder"
          description={'Are you sure you want to delete "{folderName}" and all its contents? This action cannot be undone.'}
          itemName={folderName}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      </SidebarMenuItem>
    );
  }
}
