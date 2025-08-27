import { TemplateFile, TemplateFolder } from "./path-to-json";

/**
 * Recursively searches a TemplateFolder tree for a TemplateFile and returns its relative path.
 *
 * Traverses folder.items, descending into subfolders (items with `folderName`) and comparing files by `filename` and `fileExtension`. When found, returns the path formed by joining encountered folder names and the matched file name (including extension if present) with `/`. If not found, returns `null`.
 *
 * @param file - The TemplateFile to locate (matched by `filename` and `fileExtension`).
 * @param folder - The TemplateFolder to search within.
 * @param pathSoFar - Accumulator of folder names along the current search path (defaults to an empty array); used to build the returned relative path.
 * @returns The file path relative to the provided `folder` (no leading slash), or `null` if the file is not found.
 */
export function findFilePath(
  file: TemplateFile,
  folder: TemplateFolder,
  pathSoFar: string[] = []
): string | null {
  for (const item of folder.items) {
    if ("folderName" in item) {
      const res = findFilePath(file, item, [...pathSoFar, item.folderName]);
      if (res) return res;
    } else {
      if (
        item.filename === file.filename &&
        item.fileExtension === file.fileExtension
      ) {
        return [
          ...pathSoFar,
          item.filename + (item.fileExtension ? "." + item.fileExtension : ""),
        ].join("/");
      }
    }
  }
  return null;
}



/**
 * Generates a unique file ID based on file location in folder structure
 * @param file The template file
 * @param rootFolder The root template folder containing all files
 * @returns A unique file identifier including full path
 */
export const generateFileId = (file: TemplateFile, rootFolder: TemplateFolder): string => {
  // Find the file's path in the folder structure
  const path = findFilePath(file, rootFolder)?.replace(/^\/+/, '') || '';
  
  // Handle empty/undefined file extension
  const extension = file.fileExtension?.trim();
  const extensionSuffix = extension ? `.${extension}` : '';

  // Combine path and filename
  return path
    ? `${path}/${file.filename}${extensionSuffix}`
    : `${file.filename}${extensionSuffix}`;
}