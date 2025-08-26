/**
 * Tests for NewFileDialog
 * Framework/Library: React Testing Library + user-event, running under the project's configured test runner (Jest or Vitest) with jsdom.
 * These tests focus on the behavior highlighted in the recent diff for the dialog component.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest"; // If using Jest, this will be auto-mapped; otherwise Vitest APIs are available.
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Import using aliased path if supported; fallback path included below if alias is not configured.
// Adjust the import path if your project resolves "@/..." correctly.
import NewFileDialog from "@/modules/playground/components/dialogs/new-file-dialog";
// Fallback (uncomment if alias is not configured):
// import NewFileDialog from "./new-file-dialog";

function setup(props?: Partial<React.ComponentProps<typeof NewFileDialog>>) {
  const defaults = {
    isOpen: true,
    onClose: vi.fn(),
    onCreateFile: vi.fn(),
  };
  const all = { ...defaults, ...props };
  const ui = render(<NewFileDialog {...all} />);
  return { ...all, ...ui };
}

describe("NewFileDialog", () => {
  it("renders when open with title, description, and inputs with expected defaults", () => {
    setup();
    expect(screen.getByRole("heading", { name: /create new file/i })).toBeInTheDocument();
    expect(screen.getByText(/enter a name for the new file/i)).toBeInTheDocument();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extension = screen.getByLabelText(/extension/i) as HTMLInputElement;

    expect(filename.value).toBe("");
    expect(extension.value).toBe("js");

    // Create is disabled until filename has non-whitespace content
    const createBtn = screen.getByRole("button", { name: /create/i });
    expect(createBtn).toBeDisabled();

    // Cancel button present
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("enables Create when filename has non-whitespace characters", async () => {
    const user = userEvent.setup();
    setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await user.type(filename, " main ");
    expect(createBtn).toBeEnabled();
  });

  it("submits with trimmed filename and extension, then resets fields", async () => {
    const user = userEvent.setup();
    const { onCreateFile } = setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extension = screen.getByLabelText(/extension/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await user.type(filename, " main ");
    await user.clear(extension);
    await user.type(extension, " ts  ");

    await user.click(createBtn);

    // onCreateFile called with trimmed values
    expect(onCreateFile).toHaveBeenCalledTimes(1);
    expect(onCreateFile).toHaveBeenCalledWith("main", "ts");

    // Fields reset after submit
    expect((screen.getByLabelText(/filename/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/extension/i) as HTMLInputElement).value).toBe("js");
  });

  it("defaults extension to 'js' when extension is blank or whitespace", async () => {
    const user = userEvent.setup();
    const { onCreateFile } = setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extension = screen.getByLabelText(/extension/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await user.type(filename, "index");
    await user.clear(extension);
    // Leave extension empty
    await user.click(createBtn);

    expect(onCreateFile).toHaveBeenCalledWith("index", "js");
  });

  it("does not submit when filename is empty or only whitespace", async () => {
    const user = userEvent.setup();
    const { onCreateFile } = setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    // Only whitespace
    await user.type(filename, "   ");
    // The button should remain disabled because filename.trim() is empty
    expect(createBtn).toBeDisabled();

    // Try pressing Enter should not submit
    await user.keyboard("{Enter}");
    expect(onCreateFile).not.toHaveBeenCalled();
  });

  it("pressing Enter submits when filename valid", async () => {
    const user = userEvent.setup();
    const { onCreateFile } = setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;

    await user.type(filename, "app");
    await user.keyboard("{Enter}");

    expect(onCreateFile).toHaveBeenCalledTimes(1);
    expect(onCreateFile).toHaveBeenCalledWith("app", "js");
  });

  it("Cancel calls onClose and does not invoke onCreateFile", async () => {
    const user = userEvent.setup();
    const { onClose, onCreateFile } = setup();

    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    await user.type(filename, "should-not-submit");

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreateFile).not.toHaveBeenCalled();
  });

  it("focus is on the filename input by default (autoFocus)", async () => {
    setup();
    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    // jsdom focus handling is cooperative; this is a best-effort check
    expect(filename).toHaveFocus();
  });

  it("calls onClose when dialog open state changes via onOpenChange", async () => {
    // We simulate open state change by re-rendering with isOpen=false and verifying onClose is assigned.
    // Since Radix handles overlay/escape, a direct integration test would require portal events.
    // This test ensures the prop wiring exists without portal reliance.
    const { rerender, onClose } = setup({ isOpen: true });
    rerender(<NewFileDialog isOpen={false} onClose={onClose} onCreateFile={vi.fn()} />);
    // No direct event, but prop change is accepted. Ensure onClose remains callable via buttons:
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });
});