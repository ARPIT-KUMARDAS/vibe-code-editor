/**
 * Tests for RenameFolderDialog
 *
 * Testing library and framework: We use React Testing Library with the project's configured runner
 * (Jest or Vitest) and @testing-library/user-event. We also rely on @testing-library/jest-dom
 * matchers if available in setupTests.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest"; // Vitest globals will be tree-shaken/ignored under Jest via transform or use injected globals.
// Fallback to Jest globals if running under Jest (ts-ignore to appease TS when jest types not present).
// @ts-ignore
const jestVi = (typeof vi !== "undefined" ? vi : (globalThis.vi || globalThis.jest));

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import the component under test
import RenameFolderDialog from "./rename-folder-dialog"; // The component should be colocated as rename-folder-dialog.tsx in same dir.

// Helper to render with props
const setup = (props?: Partial<React.ComponentProps<typeof RenameFolderDialog>>) => {
  const defaultProps = {
    isOpen: true,
    onClose: jestVi.fn(),
    onRename: jestVi.fn(),
    currentFolderName: "My Folder",
  };
  const all = { ...defaultProps, ...props };
  render(<RenameFolderDialog {...all} />);
  return all;
};

describe("RenameFolderDialog", () => {
  it("does not render content when closed", () => {
    setup({ isOpen: false });
    // Title should not be in the document when closed
    expect(screen.queryByRole("heading", { name: /rename folder/i })).not.toBeInTheDocument();
  });

  it("renders when open with title, description, label and input seeded with current name", () => {
    setup({ isOpen: true, currentFolderName: "Project Alpha" });

    // Dialog title
    expect(screen.getByRole("heading", { name: /rename folder/i })).toBeInTheDocument();
    // Description
    expect(screen.getByText(/enter a new name for the folder/i)).toBeInTheDocument();
    // Label connected to input
    const label = screen.getByText(/folder name/i);
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(input.id).toBe("rename-foldername");
    // Seeded value
    expect(input.value).toBe("Project Alpha");
  });

  it("disables the Rename button when input is empty or whitespace, enables when non-empty", async () => {
    const user = userEvent.setup();
    setup({ currentFolderName: "" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const renameBtn = screen.getByRole("button", { name: /rename/i });

    // Initially empty -> disabled
    expect(input.value).toBe("");
    expect(renameBtn).toBeDisabled();

    // Type only spaces -> still disabled
    await user.type(input, "   ");
    expect(renameBtn).toBeDisabled();

    // Type real text -> enabled
    await user.clear(input);
    await user.type(input, "New Name");
    expect(renameBtn).toBeEnabled();

    // Clear again -> disabled
    await user.clear(input);
    expect(renameBtn).toBeDisabled();
  });

  it("calls onRename with trimmed value on submit via button click", async () => {
    const user = userEvent.setup();
    const props = setup({ currentFolderName: "Initial" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const renameBtn = screen.getByRole("button", { name: /rename/i });

    await user.clear(input);
    await user.type(input, "   New Name   ");
    await user.click(renameBtn);

    expect(props.onRename).toHaveBeenCalledTimes(1);
    expect(props.onRename).toHaveBeenCalledWith("New Name");
    // Component does not auto-close on submit; ensure onClose not called implicitly
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not call onRename when submitting with empty/whitespace-only name", async () => {
    const user = userEvent.setup();
    const props = setup({ currentFolderName: "Initial" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const form = input.closest("form")!;
    // Submit with spaces
    await user.clear(input);
    await user.type(input, "    ");
    await user.keyboard("{Enter}");

    // Because button is disabled, form submit handler shouldn't trigger onRename
    expect(props.onRename).not.toHaveBeenCalled();

    // Additionally, try submitting the form directly
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(props.onRename).not.toHaveBeenCalled();
  });

  it("submits via Enter key (keyboard) when valid", async () => {
    const user = userEvent.setup();
    const props = setup({ currentFolderName: "Initial" });
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "Feature X");
    await user.keyboard("{Enter}");

    expect(props.onRename).toHaveBeenCalledTimes(1);
    expect(props.onRename).toHaveBeenCalledWith("Feature X");
  });

  it("Cancel button calls onClose", async () => {
    const user = userEvent.setup();
    const props = setup();
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("resets input to currentFolderName whenever dialog opens", async () => {
    const user = userEvent.setup();
    // Start closed with an initial name
    const props = setup({ isOpen: false, currentFolderName: "Version A" });
    // Opening should seed "Version A"
    render(<RenameFolderDialog {...props} isOpen={true} />);
    let input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(input.value).toBe("Version A");

    // User changes it
    await user.clear(input);
    await user.type(input, "User Edit");

    // Close dialog (content should disappear)
    render(<RenameFolderDialog {...props} isOpen={false} />);
    expect(screen.queryByRole("heading", { name: /rename folder/i })).not.toBeInTheDocument();

    // Reopen with a different currentFolderName; effect should reset value
    render(<RenameFolderDialog {...props} isOpen={true} currentFolderName="Version B" />);
    input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(input.value).toBe("Version B");
  });

  it("updates input if currentFolderName changes while open (synchronizes with prop)", async () => {
    const { rerender } = (await import("@testing-library/react"));
    const props = {
      isOpen: true,
      onClose: jestVi.fn(),
      onRename: jestVi.fn(),
      currentFolderName: "First",
    };
    const { default: Cmp } = await import("./rename-folder-dialog");
    const { render: rtlRender, screen: scr } = await import("@testing-library/react");
    const utils = rtlRender(<Cmp {...props} />);
    const input = scr.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(input.value).toBe("First");

    // Change prop while open
    utils.rerender(<Cmp {...props} currentFolderName="Second" />);
    expect((scr.getByLabelText(/folder name/i) as HTMLInputElement).value).toBe("Second");
  });
});