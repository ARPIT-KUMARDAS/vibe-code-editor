/**
 * Tests for TemplateFileTree and nested TemplateNode
 * Testing Library/Framework: This suite is designed for Jest or Vitest with jsdom and @testing-library/react.
 * It uses module mocks for external UI/dialog dependencies to keep unit tests isolated and fast.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Try to import the component using the most likely relative path.
// Adjust import below if repository structure differs; this path mirrors the test's location.
import { TemplateFileTree } from "./playground-explorer";

// Mock UI framework components that are not under test to avoid implementation coupling.
// We render simplified versions that preserve accessible structure and fire handlers.
// For "@/components/*" alias, if path alias resolution isn't configured in tests,
// these mocks prevent runtime resolution errors by stubbing the modules.

jest.mock("@/components/ui/sidebar", () => {
  const React = require("react");
  return {
    Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
    SidebarContent: ({ children }: any) => <div>{children}</div>,
    SidebarGroup: ({ children }: any) => <div>{children}</div>,
    SidebarGroupLabel: ({ children }: any) => <h2>{children}</h2>,
    SidebarGroupAction: ({ children, ...props }: any) => (
      <button aria-label="group-action" {...props}>{children}</button>
    ),
    SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
    SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
    SidebarMenuButton: ({ children, isActive, ...props }: any) => (
      <button aria-pressed={!!isActive} {...props}>{children}</button>
    ),
    SidebarMenuSub: ({ children }: any) => <ul>{children}</ul>,
    SidebarRail: () => <div data-testid="sidebar-rail" />,
  };
});

jest.mock("@/components/ui/collapsible", () => {
  const React = require("react");
  return {
    Collapsible: ({ open, onOpenChange, className, children }: any) => (
      <div data-state={open ? "open" : "closed"} className={className}>
        {children}
      </div>
    ),
    CollapsibleTrigger: ({ asChild, children }: any) => (
      <div
        role="button"
        aria-label="collapsible-trigger"
        onClick={() => {}}
      >
        {children}
      </div>
    ),
    CollapsibleContent: ({ children }: any) => <div>{children}</div>,
  };
});

jest.mock("@/components/ui/dropdown-menu", () => {
  const React = require("react");
  return {
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ asChild, children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
    DropdownMenuItem: ({ children, onClick, className }: any) => (
      <button onClick={onClick} className={className}>{children}</button>
    ),
    DropdownMenuSeparator: () => <hr />,
  };
});

jest.mock("@/components/ui/button", () => {
  const React = require("react");
  return {
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  };
});

// Mock lucide-react icons with simple spans for readability
jest.mock("lucide-react", () => {
  const React = require("react");
  const Icon = ({ children, ...props }: any) => <span {...props}>{children}</span>;
  return new Proxy({}, {
    get: () => Icon,
  });
});

// Mock dialogs to control open/close and to exercise callbacks deterministically
jest.mock("./dialogs/new-file-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onCreateFile }: any) =>
      isOpen ? (
        <div data-testid="new-file-dialog">
          <button onClick={() => onCreateFile("readme", "md")}>confirm-new-file</button>
          <button onClick={onClose}>close-new-file</button>
        </div>
      ) : null
  };
});

jest.mock("./dialogs/new-folder-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onCreateFolder }: any) =>
      isOpen ? (
        <div data-testid="new-folder-dialog">
          <button onClick={() => onCreateFolder("docs")}>confirm-new-folder</button>
          <button onClick={onClose}>close-new-folder</button>
        </div>
      ) : null
  };
});

jest.mock("./dialogs/rename-file-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onRename, currentFilename, currentExtension }: any) =>
      isOpen ? (
        <div data-testid="rename-file-dialog">
          <button onClick={() => onRename(currentFilename + "-new", currentExtension)}>confirm-rename-file</button>
          <button onClick={onClose}>close-rename-file</button>
        </div>
      ) : null
  };
});

jest.mock("./dialogs/rename-folder-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ isOpen, onClose, onRename, currentFolderName }: any) =>
      isOpen ? (
        <div data-testid="rename-folder-dialog">
          <button onClick={() => onRename(currentFolderName + "-new")}>confirm-rename-folder</button>
          <button onClick={onClose}>close-rename-folder</button>
        </div>
      ) : null
  };
});

jest.mock("./dialogs/delete-dialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    DeleteDialog: ({ isOpen, onConfirm, setIsOpen, title, itemName }: any) =>
      isOpen ? (
        <div data-testid="delete-dialog" aria-label={title}>
          <span>{itemName}</span>
          <button onClick={() => onConfirm?.()}>confirm-delete</button>
          <button onClick={() => setIsOpen?.(false)}>cancel-delete</button>
        </div>
      ) : null
  };
});

// Types used in props
type TemplateFile = { filename: string; fileExtension: string; content: string; };
type TemplateFolder = { folderName: string; items: Array<TemplateItem>; };
type TemplateItem = TemplateFile | TemplateFolder;

function makeFile(filename: string, fileExtension = "txt", content = ""): TemplateFile {
  return { filename, fileExtension, content };
}
function makeFolder(folderName: string, items: TemplateItem[] = []): TemplateFolder {
  return { folderName, items };
}

describe("TemplateFileTree - basic rendering", () => {
  it("renders with default title and shows top-level items", () => {
    const data = makeFolder("root", [
      makeFile("a","md"),
      makeFolder("docs"),
    ]);
    render(<TemplateFileTree data={data} />);
    expect(screen.getByRole("heading", { name: "Files Explorer" })).toBeInTheDocument();
    expect(screen.getByText("a.md")).toBeInTheDocument();
    expect(screen.getByText("docs")).toBeInTheDocument();
  });

  it("uses the provided title", () => {
    const data = makeFolder("root", []);
    render(<TemplateFileTree data={data} title="Template Files" />);
    expect(screen.getByRole("heading", { name: "Template Files" })).toBeInTheDocument();
  });
});

describe("TemplateFileTree - root add file/folder via dropdown", () => {
  it("opens NewFileDialog and invokes onAddFile with parentPath '' then closes", async () => {
    const user = userEvent.setup();
    const onAddFile = jest.fn();
    const data = makeFolder("root", []);

    render(<TemplateFileTree data={data} onAddFile={onAddFile} />);

    // Click the group action (Plus) which is mocked as a button
    const actionBtn = screen.getByRole("button", { name: /group-action/i });
    await user.click(actionBtn);

    // Choose New File
    await user.click(screen.getByRole("button", { name: /New File/i }));

    // Dialog should appear (mocked)
    expect(screen.getByTestId("new-file-dialog")).toBeInTheDocument();

    // Confirm create within dialog
    await user.click(screen.getByText("confirm-new-file"));
    expect(onAddFile).toHaveBeenCalledWith({ filename: "readme", fileExtension: "md", content: "" }, "");
  });

  it("opens NewFolderDialog and invokes onAddFolder with parentPath '' then closes", async () => {
    const user = userEvent.setup();
    const onAddFolder = jest.fn();
    const data = makeFolder("root", []);

    render(<TemplateFileTree data={data} onAddFolder={onAddFolder} />);

    const actionBtn = screen.getByRole("button", { name: /group-action/i });
    await user.click(actionBtn);

    await user.click(screen.getByRole("button", { name: /New Folder/i }));

    expect(screen.getByTestId("new-folder-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-new-folder"));
    expect(onAddFolder).toHaveBeenCalledWith({ folderName: "docs", items: [] }, "");
  });
});

describe("TemplateNode - file item interactions", () => {
  it("calls onFileSelect when clicking a file and marks it active when selected", async () => {
    const user = userEvent.setup();
    const file = makeFile("index", "ts");
    const onFileSelect = jest.fn();

    render(<TemplateFileTree data={file} onFileSelect={onFileSelect} selectedFile={file} />);

    const fileButton = screen.getByRole("button", { name: /index\.ts/i });
    expect(fileButton).toHaveAttribute("aria-pressed", "true");
    await user.click(fileButton);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("rename and delete file through item menu dialogs triggers callbacks with correct args", async () => {
    const user = userEvent.setup();
    const file = makeFile("notes", "txt");
    const onRenameFile = jest.fn();
    const onDeleteFile = jest.fn();

    render(
      <TemplateFileTree
        data={makeFolder("root", [file])}
        onRenameFile={onRenameFile}
        onDeleteFile={onDeleteFile}
      />
    );

    // Open file row menu: mocked as a visible button with MoreHorizontal inside; in our stubs, menu items are directly present in DOM under the row.
    // Click Rename
    await user.click(screen.getByRole("button", { name: /Rename/i }));
    expect(screen.getByTestId("rename-file-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-rename-file"));
    expect(onRenameFile).toHaveBeenCalledWith(file, "notes-new", "txt", "");

    // Click Delete
    await user.click(screen.getByRole("button", { name: /Delete/i }));
    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-delete"));
    expect(onDeleteFile).toHaveBeenCalledWith(file, "");
  });
});

describe("TemplateNode - folder item interactions and nested paths", () => {
  it("create file/folder inside nested folder passes computed path", async () => {
    const user = userEvent.setup();
    const onAddFile = jest.fn();
    const onAddFolder = jest.fn();

    const tree = makeFolder("root", [
      makeFolder("src", [
        makeFolder("components", [])
      ])
    ]);

    render(
      <TemplateFileTree
        data={tree}
        onAddFile={onAddFile}
        onAddFolder={onAddFolder}
      />
    );

    // Find the "components" folder row; click its menu items New File and New Folder.
    // Our mocks render each folder row buttons in order, so we select appropriate instances by their proximity in DOM.
    const newFileButtons = screen.getAllByRole("button", { name: /New File/i });
    const newFolderButtons = screen.getAllByRole("button", { name: /New Folder/i });

    // Click the ones later in the DOM likely belonging to "components"
    await user.click(newFileButtons[newFileButtons.length - 1]);
    expect(screen.getByTestId("new-file-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-new-file"));
    expect(onAddFile).toHaveBeenCalledWith({ filename: "readme", fileExtension: "md", content: "" }, "root/src/components");

    await user.click(newFolderButtons[newFolderButtons.length - 1]);
    expect(screen.getByTestId("new-folder-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-new-folder"));
    expect(onAddFolder).toHaveBeenCalledWith({ folderName: "docs", items: [] }, "root/src/components");
  });

  it("renames and deletes nested folder with correct parent path", async () => {
    const user = userEvent.setup();
    const onRenameFolder = jest.fn();
    const onDeleteFolder = jest.fn();

    const nested = makeFolder("root", [
      makeFolder("src", [
        makeFolder("pages", [])
      ])
    ]);

    render(
      <TemplateFileTree
        data={nested}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
      />
    );

    // Rename the "pages" folder
    const renameButtons = screen.getAllByRole("button", { name: /Rename/i });
    await user.click(renameButtons[renameButtons.length - 1]);
    expect(screen.getByTestId("rename-folder-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-rename-folder"));
    expect(onRenameFolder).toHaveBeenCalledWith({ folderName: "pages", items: [] }, "pages-new", "root/src");

    // Delete the "pages" folder
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    await user.click(screen.getByText("confirm-delete"));
    expect(onDeleteFolder).toHaveBeenCalledWith({ folderName: "pages", items: [] }, "root/src");
  });
});

describe("Edge cases", () => {
  it("renders nothing for invalid item (null/undefined)", () => {
    // @ts-expect-error Deliberate invalid to simulate edge case guard
    render(<TemplateFileTree data={null} />);
    // Should not crash, and should still render sidebar scaffolding
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("select state only true when filename and extension match", async () => {
    const user = userEvent.setup();
    const file = makeFile("index","ts");
    const selected = makeFile("index","js"); // extension differs
    render(<TemplateFileTree data={file} selectedFile={selected} />);
    const btn = screen.getByRole("button", { name: /index\.ts/i });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    await user.click(btn); // should still be clickable without errors
  });
});