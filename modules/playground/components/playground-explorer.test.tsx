/**
 * TemplateFileTree unit tests (modules/playground/components/playground-explorer.tsx)
 *
 * Testing stack note:
 * - Framework: React Testing Library (@testing-library/react) with fireEvent
 * - Runner: Jest (matching nearby tests in app/playground/[id]/page.test.tsx)
 *
 * Focused scenarios:
 * - Rendering of files/folders and default title
 * - Selection highlighting via isActive -> aria-pressed
 * - Root-level create actions (New File/New Folder) with parentPath ""
 * - No-op create when data is not a root folder
 * - Nested create actions computing correct parentPath (e.g., "FolderA", "FolderA/Sub")
 * - File actions: rename/delete with correct path and values
 * - Folder actions: rename/delete where parent path excludes the folder name itself
 */

import React from 'react'
import { render, screen, within, fireEvent } from '@testing-library/react'

// Mocks: use direct jest.mock calls (hoisted by Jest) before importing the component under test.
// Provide __esModule: true for default exports to preserve ESM interop.

// Icons -> inert stubs
jest.mock('lucide-react', () => {
  const Icon = (props: any) => React.createElement('svg', { 'aria-hidden': 'true', ...props })
  return {
    __esModule: true,
    ChevronRight: Icon,
    File: Icon,
    Folder: Icon,
    Plus: Icon,
    FilePlus: Icon,
    FolderPlus: Icon,
    MoreHorizontal: Icon,
    Trash2: Icon,
    Edit3: Icon,
  }
})

// UI primitives
jest.mock('@/components/ui/button', () => ({
  __esModule: true,
  Button: ({ children, onClick, ...rest }: any) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  __esModule: true,
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, ...rest }: any) => (
    <button type="button" onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr aria-hidden="true" />,
}))

jest.mock('@/components/ui/collapsible', () => {
  const Collapsible = ({ children, open = true }: any) => (
    <div data-testid="collapsible" data-open={open}>
      {open ? children : null}
    </div>
  )
  const CollapsibleTrigger = ({ children }: any) => <div>{children}</div>
  const CollapsibleContent = ({ children }: any) => <div>{children}</div>
  return { __esModule: true, Collapsible, CollapsibleTrigger, CollapsibleContent }
})

jest.mock('@/components/ui/sidebar', () => ({
  __esModule: true,
  Sidebar: ({ children }: any) => <aside>{children}</aside>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <section>{children}</section>,
  SidebarGroupAction: ({ children, ...rest }: any) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <h2>{children}</h2>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, isActive, onClick, ...rest }: any) => (
    <button type="button" aria-pressed={!!isActive} onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuSub: ({ children }: any) => <ul>{children}</ul>,
  SidebarRail: () => <div aria-hidden="true" />,
}))

// Dialogs (default/named)
jest.mock('./dialogs/new-file-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onCreateFile }: any) =>
    isOpen ? (
      <button type="button" onClick={() => onCreateFile('newfile', 'txt')}>
        mock-create-file
      </button>
    ) : null,
}))

jest.mock('./dialogs/new-folder-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onCreateFolder }: any) =>
    isOpen ? (
      <button type="button" onClick={() => onCreateFolder('NewFolder')}>
        mock-create-folder
      </button>
    ) : null,
}))

jest.mock('./dialogs/rename-file-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onRename }: any) =>
    isOpen ? (
      <button type="button" onClick={() => onRename('renamed', 'js')}>
        mock-rename-file
      </button>
    ) : null,
}))

jest.mock('./dialogs/rename-folder-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onRename }: any) =>
    isOpen ? (
      <button type="button" onClick={() => onRename('RenamedFolder')}>
        mock-rename-folder
      </button>
    ) : null,
}))

jest.mock('./dialogs/delete-dialog', () => ({
  __esModule: true,
  DeleteDialog: ({ isOpen, onConfirm }: any) =>
    isOpen ? (
      <button type="button" onClick={onConfirm}>
        mock-confirm-delete
      </button>
    ) : null,
}))

// Import the component under test AFTER mocks
import { TemplateFileTree } from './playground-explorer'

// Helpers
const file = (name: string, ext: string) => ({ filename: name, fileExtension: ext, content: '' })
const folder = (name: string, items: any[] = []) => ({ folderName: name, items })

describe('TemplateFileTree - rendering & selection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders default title and displays nested files/folders', () => {
    const data = folder('root', [file('readme', 'md'), folder('FolderA', [file('a', 'md')])])

    render(<TemplateFileTree data={data as any} />)

    expect(screen.getByRole('heading', { name: /files explorer/i })).toBeInTheDocument()
    expect(screen.getByText('readme.md')).toBeInTheDocument()
    expect(screen.getByText('FolderA')).toBeInTheDocument()
    expect(screen.getByText('a.md')).toBeInTheDocument()
  })

  it('highlights selected file using aria-pressed', () => {
    const f = file('readme', 'md')
    const data = folder('root', [f])

    render(<TemplateFileTree data={data as any} selectedFile={f as any} />)

    expect(screen.getByRole('button', { name: /readme\.md/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('invokes onFileSelect when clicking a file', () => {
    const onFileSelect = jest.fn()
    const f = file('readme', 'md')
    const data = folder('root', [f])

    render(<TemplateFileTree data={data as any} onFileSelect={onFileSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /readme\.md/i }))
    expect(onFileSelect).toHaveBeenCalledTimes(1)
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining(f))
  })
})

describe('TemplateFileTree - root-level create actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a new file at root with empty parentPath', () => {
    const onAddFile = jest.fn()
    const data = folder('root', [])

    render(<TemplateFileTree data={data as any} onAddFile={onAddFile} />)

    fireEvent.click(screen.getByRole('button', { name: /new file/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-create-file/i }))

    expect(onAddFile).toHaveBeenCalledTimes(1)
    const [created, parentPath] = onAddFile.mock.calls[0]
    expect(created).toEqual({ filename: 'newfile', fileExtension: 'txt', content: '' })
    expect(parentPath).toBe('')
  })

  it('creates a new folder at root with empty parentPath', () => {
    const onAddFolder = jest.fn()
    const data = folder('root', [])

    render(<TemplateFileTree data={data as any} onAddFolder={onAddFolder} />)

    fireEvent.click(screen.getByRole('button', { name: /new folder/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-create-folder/i }))

    expect(onAddFolder).toHaveBeenCalledTimes(1)
    const [created, parentPath] = onAddFolder.mock.calls[0]
    expect(created).toEqual({ folderName: 'NewFolder', items: [] })
    expect(parentPath).toBe('')
  })

  it('does not call onAddFile when data is not a root folder', () => {
    const onAddFile = jest.fn()
    const data = file('single', 'txt') // non-root

    render(<TemplateFileTree data={data as any} onAddFile={onAddFile} />)

    fireEvent.click(screen.getByRole('button', { name: /new file/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-create-file/i }))

    expect(onAddFile).not.toHaveBeenCalled()
  })
})

describe('TemplateFileTree - nested create actions compute correct parentPath', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('adds a file within first-level folder -> parentPath "FolderA"', () => {
    const onAddFile = jest.fn()
    const data = folder('root', [folder('FolderA', [])])

    render(<TemplateFileTree data={data as any} onAddFile={onAddFile} />)

    const folderItem = screen.getByText('FolderA').closest('li')!
    fireEvent.click(within(folderItem).getByRole('button', { name: /new file/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-create-file/i }))

    expect(onAddFile).toHaveBeenCalledTimes(1)
    const [created, parentPath] = onAddFile.mock.calls[0]
    expect(created).toEqual({ filename: 'newfile', fileExtension: 'txt', content: '' })
    expect(parentPath).toBe('FolderA')
  })

  it('adds a folder within second-level folder -> parentPath "FolderA/Sub"', () => {
    const onAddFolder = jest.fn()
    const data = folder('root', [folder('FolderA', [folder('Sub', [])])])

    render(<TemplateFileTree data={data as any} onAddFolder={onAddFolder} />)

    const subItem = screen.getByText('Sub').closest('li')!
    fireEvent.click(within(subItem).getByRole('button', { name: /new folder/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-create-folder/i }))

    expect(onAddFolder).toHaveBeenCalledTimes(1)
    const [created, parentPath] = onAddFolder.mock.calls[0]
    expect(created).toEqual({ folderName: 'NewFolder', items: [] })
    expect(parentPath).toBe('FolderA/Sub')
  })
})

describe('TemplateFileTree - file actions (rename/delete) with correct path', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renames a file inside FolderA with new values and path "FolderA"', () => {
    const onRenameFile = jest.fn()
    const f = file('a', 'md')
    const data = folder('root', [folder('FolderA', [f])])

    render(<TemplateFileTree data={data as any} onRenameFile={onRenameFile} />)

    const fileItem = screen.getByText('a.md').closest('li')!
    fireEvent.click(within(fileItem).getByRole('button', { name: /rename/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-rename-file/i }))

    expect(onRenameFile).toHaveBeenCalledTimes(1)
    const [orig, newName, newExt, parentPath] = onRenameFile.mock.calls[0]
    expect(orig).toEqual(expect.objectContaining(f))
    expect(newName).toBe('renamed')
    expect(newExt).toBe('js')
    expect(parentPath).toBe('FolderA')
  })

  it('deletes a file inside FolderA with path "FolderA"', () => {
    const onDeleteFile = jest.fn()
    const f = file('a', 'md')
    const data = folder('root', [folder('FolderA', [f])])

    render(<TemplateFileTree data={data as any} onDeleteFile={onDeleteFile} />)

    const fileItem = screen.getByText('a.md').closest('li')!
    fireEvent.click(within(fileItem).getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-confirm-delete/i }))

    expect(onDeleteFile).toHaveBeenCalledTimes(1)
    const [orig, parentPath] = onDeleteFile.mock.calls[0]
    expect(orig).toEqual(expect.objectContaining(f))
    expect(parentPath).toBe('FolderA')
  })
})

describe('TemplateFileTree - folder actions (rename/delete)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renames a nested "Sub" folder and passes parent path "FolderA"', () => {
    const onRenameFolder = jest.fn()
    const sub = folder('Sub', [])
    const data = folder('root', [folder('FolderA', [sub])])

    render(<TemplateFileTree data={data as any} onRenameFolder={onRenameFolder} />)

    const subItem = screen.getByText('Sub').closest('li')!
    fireEvent.click(within(subItem).getByRole('button', { name: /rename/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-rename-folder/i }))

    expect(onRenameFolder).toHaveBeenCalledTimes(1)
    const [fld, newName, parentPath] = onRenameFolder.mock.calls[0]
    expect(fld).toEqual(expect.objectContaining({ folderName: 'Sub' }))
    expect(newName).toBe('RenamedFolder')
    expect(parentPath).toBe('FolderA')
  })

  it('deletes a nested "Sub" folder and passes parent path "FolderA"', () => {
    const onDeleteFolder = jest.fn()
    const sub = folder('Sub', [])
    const data = folder('root', [folder('FolderA', [sub])])

    render(<TemplateFileTree data={data as any} onDeleteFolder={onDeleteFolder} />)

    const subItem = screen.getByText('Sub').closest('li')!
    fireEvent.click(within(subItem).getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /mock-confirm-delete/i }))

    expect(onDeleteFolder).toHaveBeenCalledTimes(1)
    const [fld, parentPath] = onDeleteFolder.mock.calls[0]
    expect(fld).toEqual(expect.objectContaining({ folderName: 'Sub' }))
    expect(parentPath).toBe('FolderA')
  })
})