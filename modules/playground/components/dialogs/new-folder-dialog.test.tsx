/**
 * NewFolderDialog tests
 *
 * Testing stack: React Testing Library (+ @testing-library/jest-dom matchers)
 * Test runner: Jest or Vitest (API compatible). If using Vitest, ensure either:
 *   - global setup imports "@testing-library/jest-dom/vitest", or
 *   - keep the inline import below (adjust to '/vitest' if preferred).
 *
 * Focus: Validating the public interface and behaviors visible in the diff:
 *  - Controlled visibility via isOpen
 *  - Input labeling, placeholder, and autoFocus attribute
 *  - Create button enabled state depends on non-whitespace input
 *  - Submitting trims value, calls onCreateFolder(name), and resets input
 *  - No submission on empty/whitespace-only input
 *  - Cancel button triggers onClose; submit does NOT
 *  - Submit via Enter key works
 */

import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom"; // If using Vitest with a custom setup, you may switch to '@testing-library/jest-dom/vitest'.
import NewFolderDialog from "./new-folder-dialog";

// Use RTL recommended cleanup between tests
afterEach(() => {
  cleanup();
});

// Helper to get a mock function compatible with Jest or Vitest
const mocker = (globalThis as any).vi ?? (globalThis as any).jest;
function fnMock() {
  if (!mocker?.fn) {
    throw new Error("Expected a test runner (Jest or Vitest) providing a fn() mock API.");
  }
  return mocker.fn();
}

// Convenience render with common defaults
function renderDialog(overrides: Partial<React.ComponentProps<typeof NewFolderDialog>> = {}) {
  const props = {
    isOpen: true,
    onClose: fnMock(),
    onCreateFolder: fnMock(),
    ...overrides,
  } as React.ComponentProps<typeof NewFolderDialog>;
  render(<NewFolderDialog {...props} />);
  return props;
}

describe("NewFolderDialog", () => {
  it("renders dialog structure when open: title, description, labeled input, and action buttons", () => {
    renderDialog();

    // Title and description
    expect(
      screen.getByRole("heading", { name: /create new folder/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter a name for the new folder\./i)
    ).toBeInTheDocument();

    // Input is associated to label by htmlFor/id and has placeholder
    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "foldername");
    expect(input).toHaveAttribute("placeholder", "components");

    // Action buttons
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    const createBtn = screen.getByRole("button", { name: /create/i });
    expect(createBtn).toBeInTheDocument();
    // Initially disabled since input is empty
    expect(createBtn).toBeDisabled();
  });

  it("does not render dialog content when isOpen is false", () => {
    renderDialog({ isOpen: false });
    expect(
      screen.queryByRole("heading", { name: /create new folder/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/enter a name for the new folder\./i)
    ).not.toBeInTheDocument();
  });

  it("keeps Create disabled for empty or whitespace-only input; enables for non-whitespace", async () => {
    renderDialog();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    // Empty: disabled
    expect(createBtn).toBeDisabled();

    // Whitespace-only: still disabled
    await user.type(input, "   ");
    expect(createBtn).toBeDisabled();

    // Non-whitespace: enabled
    await user.clear(input);
    await user.type(input, "  components  ");
    expect(createBtn).toBeEnabled();
  });

  it("submits trimmed folder name on Create click, resets input, and does not call onClose", async () => {
    const { onCreateFolder, onClose } = renderDialog();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await user.type(input, "   my-folder   ");
    expect(createBtn).toBeEnabled();

    await user.click(createBtn);

    // Called once with trimmed value
    expect(onCreateFolder).toHaveBeenCalledTimes(1);
    expect(onCreateFolder).toHaveBeenCalledWith("my-folder");

    // Input cleared and button disabled again
    expect(input).toHaveValue("");
    expect(createBtn).toBeDisabled();

    // Submitting does not close the dialog (component does not call onClose on submit)
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not submit when value is empty/whitespace; Create remains disabled", async () => {
    const { onCreateFolder, onClose } = renderDialog();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    // Input whitespace and attempt submit via Enter
    await user.type(input, "    ");
    await user.keyboard("{Enter}");

    expect(onCreateFolder).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(createBtn).toBeDisabled();
  });

  it("Cancel button invokes onClose and does not invoke onCreateFolder", async () => {
    const { onCreateFolder, onClose } = renderDialog();
    const user = userEvent.setup();

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreateFolder).not.toHaveBeenCalled();
  });

  it("submits via Enter key when input has a valid name", async () => {
    const { onCreateFolder } = renderDialog();
    const user = userEvent.setup();

    const input = screen.getByLabelText(/folder name/i) as HTMLInputElement;
    await user.type(input, "docs");
    await user.keyboard("{Enter}");

    expect(onCreateFolder).toHaveBeenCalledTimes(1);
    expect(onCreateFolder).toHaveBeenCalledWith("docs");
  });

  it("label association works: querying by label returns the input element", () => {
    renderDialog();

    const inputByLabel = screen.getByLabelText(/folder name/i);
    const byId = document.getElementById("foldername");
    expect(inputByLabel).toBe(byId);
  });

  // Optional: we avoid asserting actual focus due to potential environment differences.
  // We at least verify the presence of the autoFocus attribute on the input.
  it("input advertises autoFocus (attribute present)", () => {
    renderDialog();

    const input = screen.getByLabelText(/folder name/i);
    // In the DOM it appears as 'autofocus'
    expect(input).toHaveAttribute("autofocus");
  });
});