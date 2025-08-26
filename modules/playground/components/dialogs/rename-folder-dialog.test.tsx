/* 
  Tests for modules/playground/components/dialogs/rename-folder-dialog.tsx

  Testing stack:
  - React Testing Library (@testing-library/react, @testing-library/user-event)
  - Runner: prefers Vitest if available (vi.* APIs), otherwise Jest (jest.* APIs)
  - Expect matchers: @testing-library/jest-dom assumed to be loaded via setup files

  Covered scenarios:
  - Renders dialog contents when isOpen=true
  - Cancel button calls onClose
  - Rename button disabled when input is empty/whitespace
  - Submitting trims whitespace and calls onRename with trimmed value
  - Does NOT call onRename when input is empty/whitespace
  - Input auto-focuses when opened
  - Resets input value to currentFolderName when:
      a) currentFolderName changes while open
      b) dialog is reopened after being closed
*/

import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Detect test runner (Vitest vs Jest) for mocking UI modules and timers if needed
const isVitest = typeof vi !== "undefined";
const mockFn = isVitest ? vi.fn : jest.fn;

// Provide virtual mocks for aliased UI components to avoid path alias/resolution issues.
// We only emulate minimal behavior/structure needed by tests.
const makeUIMocks = () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ ...props }, ref) => <input ref={ref} {...props} />
  ),
  Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
  // Dialog primitives: render children when open is true. Wire onOpenChange to consumers but do not implement overlays/portals.
  Dialog: ({ open, onOpenChange, children }: any) => (
    <div data-testid="dialog-root" data-open={!!open} onClick={() => onOpenChange?.(false)}>
      {open ? children : null}
    </div>
  ),
  DialogContent: ({ children }: any) => (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
});

// Register virtual mocks using the active runner API
if (isVitest) {
  vi.mock("@/components/ui/button", () => ({ default: undefined, ...makeUIMocks() }), { virtual: true });
  vi.mock("@/components/ui/input", () => ({ default: undefined, ...makeUIMocks() }), { virtual: true });
  vi.mock("@/components/ui/label", () => ({ default: undefined, ...makeUIMocks() }), { virtual: true });
  vi.mock("@/components/ui/dialog", () => ({ default: undefined, ...makeUIMocks() }), { virtual: true });
} else {
  // Jest - use virtual mocks to bypass path resolution for "@/..."
  jest.mock("@/components/ui/button", () => ({ __esModule: true, ...makeUIMocks() }), { virtual: true } as any);
  jest.mock("@/components/ui/input", () => ({ __esModule: true, ...makeUIMocks() }), { virtual: true } as any);
  jest.mock("@/components/ui/label", () => ({ __esModule: true, ...makeUIMocks() }), { virtual: true } as any);
  jest.mock("@/components/ui/dialog", () => ({ __esModule: true, ...makeUIMocks() }), { virtual: true } as any);
}

// Import the component under test (assumed sibling file)
import RenameFolderDialog from "./rename-folder-dialog";

function setup(props?: Partial<React.ComponentProps<typeof RenameFolderDialog>>) {
  const defaultProps = {
    isOpen: true,
    onClose: mockFn(),
    onRename: mockFn(),
    currentFolderName: "My Folder",
  };
  const allProps = { ...defaultProps, ...props };
  const user = userEvent.setup();
  const view = render(<RenameFolderDialog {...allProps} />);
  return { user, ...allProps, ...view };
}

describe("RenameFolderDialog", () => {
  test("renders dialog title and description when open", () => {
    setup({ isOpen: true });
    expect(screen.getByRole("heading", { name: /rename folder/i })).toBeInTheDocument();
    expect(screen.getByText(/enter a new name for the folder\./i)).toBeInTheDocument();
    // Input prefilled with currentFolderName
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(input).toHaveValue("My Folder");
  });

  test("cancel button calls onClose", async () => {
    const onClose = mockFn();
    const { user } = setup({ onClose });
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("rename button disabled when input is empty or whitespace", async () => {
    const { user } = setup({ currentFolderName: "" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    // Initially empty -> disabled
    const renameBtn = screen.getByRole("button", { name: /rename/i });
    expect(renameBtn).toBeDisabled();

    await user.type(input, "   ");
    expect(renameBtn).toBeDisabled();

    // Now valid
    await user.clear(input);
    await user.type(input, "Valid Name");
    expect(renameBtn).toBeEnabled();
  });

  test("submitting trims value and calls onRename with trimmed name", async () => {
    const onRename = mockFn();
    const { user } = setup({ onRename, currentFolderName: "Old" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    await user.clear(input);
    await user.type(input, "   New Name   ");
    await user.click(screen.getByRole("button", { name: /rename/i }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith("New Name");
  });

  test("does not call onRename when value is only whitespace", async () => {
    const onRename = mockFn();
    const { user } = setup({ onRename, currentFolderName: "" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    await user.type(input, "   ");
    await user.click(screen.getByRole("button", { name: /rename/i }));
    expect(onRename).not.toHaveBeenCalled();
  });

  test("input receives autofocus on open", () => {
    setup({ isOpen: true });
    const input = screen.getByLabelText(/folder name/i);
    expect(input).toHaveFocus();
  });

  test("resets input when currentFolderName changes while open", async () => {
    const { rerender, user } = setup({ isOpen: true, currentFolderName: "First Name" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    // Change locally
    await user.clear(input);
    await user.type(input, "Local Change");
    expect(input).toHaveValue("Local Change");

    // Prop change while open should reset to new name
    rerender(
      <RenameFolderDialog
        isOpen={true}
        onClose={mockFn()}
        onRename={mockFn()}
        currentFolderName="Second Name"
      />
    );
    expect(input).toHaveValue("Second Name");
  });

  test("reopening dialog restores input to currentFolderName", async () => {
    const onClose = mockFn();
    const onRename = mockFn();
    const { rerender, user } = setup({
      isOpen: true,
      onClose,
      onRename,
      currentFolderName: "Original",
    });

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    await user.type(input, " Edited");
    expect(input).toHaveValue("Original Edited");

    // Close the dialog (controlled from parent)
    rerender(
      <RenameFolderDialog
        isOpen={false}
        onClose={onClose}
        onRename={onRename}
        currentFolderName="Original"
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Reopen - should reset input to currentFolderName
    rerender(
      <RenameFolderDialog
        isOpen={true}
        onClose={onClose}
        onRename={onRename}
        currentFolderName="Original"
      />
    );
    const reopenedInput = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(reopenedInput).toHaveValue("Original");
  });
});