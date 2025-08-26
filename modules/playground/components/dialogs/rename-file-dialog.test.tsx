/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unit tests for RenameFileDialog
 * Test library: @testing-library/react
 * Test runner: Works with both Jest and Vitest (auto-detected at runtime)
 *
 * We mock shadcn/ui dialog/button/input/label to avoid Radix portals and keep tests pure and deterministic.
 * Tests cover:
 *  - Rendering when open/closed
 *  - Initial values
 *  - Button enable/disable based on trimmed filename
 *  - Trimming behavior on submit
 *  - Fallback to currentExtension when extension left blank
 *  - No submit when filename is blank/whitespace
 *  - Cancel button invokes onClose
 *  - State reset on reopen with new props
 */

const mocker: any = (globalThis as any).vi ?? (globalThis as any).jest;
if (mocker?.mock) {
  // Mock UI primitives with simple HTML equivalents.
  mocker.mock("@/components/ui/button", () => {
    const React = require("react");
    return {
      Button: (props: any) => React.createElement("button", props, props.children),
    };
  });

  mocker.mock("@/components/ui/input", () => {
    const React = require("react");
    return {
      Input: (props: any) => React.createElement("input", props),
    };
  });

  mocker.mock("@/components/ui/label", () => {
    const React = require("react");
    return {
      Label: (props: any) => React.createElement("label", props, props.children),
    };
  });

  mocker.mock("@/components/ui/dialog", () => {
    const React = require("react");
    const Dialog = ({ open, onOpenChange, children }: any) =>
      React.createElement("div", { "data-testid": "dialog", "data-open": open, onOpenChange }, open ? children : null);
    const DialogContent = ({ children }: any) =>
      React.createElement("div", { "data-testid": "dialog-content" }, children);
    const DialogHeader = ({ children }: any) => React.createElement("div", null, children);
    const DialogTitle = ({ children }: any) => React.createElement("h2", null, children);
    const DialogDescription = ({ children }: any) => React.createElement("p", null, children);
    const DialogFooter = ({ children }: any) => React.createElement("div", null, children);
    return { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
  });
}

import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
// Import after mocks so the component uses our stubs.
import RenameFileDialog from "./rename-file-dialog";

// Utility: create a spy compatible with Jest or Vitest; falls back to a minimal stub if neither is present.
const createSpy = (): any => {
  const g: any = globalThis as any;
  if (g.vi?.fn) return g.vi.fn();
  if (g.jest?.fn) return g.jest.fn();
  // Minimal fallback (keeps track of calls)
  const fn: any = (...args: any[]) => { (fn.calls ||= []).push(args); };
  fn.calls = [] as any[];
  fn.mock = { calls: fn.calls };
  fn.mockClear = () => { fn.calls.length = 0; };
  return fn;
};

const clearAllSpies = () => {
  const g: any = globalThis as any;
  if (g.vi?.clearAllMocks) g.vi.clearAllMocks();
  if (g.jest?.clearAllMocks) g.jest.clearAllMocks();
};

afterEach(() => {
  cleanup();
  clearAllSpies();
});

describe("RenameFileDialog", () => {
  const baseProps = {
    isOpen: true,
    currentFilename: "example",
    currentExtension: "txt",
  };

  test("renders dialog contents when open and shows initial values", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen={baseProps.isOpen}
        onClose={onClose}
        onRename={onRename}
        currentFilename={baseProps.currentFilename}
        currentExtension={baseProps.currentExtension}
      />
    );

    // Title and description
    expect(screen.getByText("Rename File")).toBeTruthy();
    expect(screen.getByText("Enter a new name for the file.")).toBeTruthy();

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extensionInput = screen.getByLabelText(/extension/i) as HTMLInputElement;
    expect(filenameInput.value).toBe("example");
    expect(extensionInput.value).toBe("txt");

    const renameBtn = screen.getByRole("button", { name: /rename/i }) as HTMLButtonElement;
    expect(renameBtn.disabled).toBe(false);
  });

  test("does not render contents when closed", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen={false}
        onClose={onClose}
        onRename={onRename}
        currentFilename={baseProps.currentFilename}
        currentExtension={baseProps.currentExtension}
      />
    );

    // Our mocked Dialog hides children when open=false
    expect(screen.queryByTestId("dialog-content")).toBeNull();
    expect(screen.queryByText("Rename File")).toBeNull();
  });

  test("disables Rename button when filename is whitespace-only; re-enables when valid", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="file"
        currentExtension="js"
      />
    );

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const renameBtn = screen.getByRole("button", { name: /rename/i }) as HTMLButtonElement;

    expect(renameBtn.disabled).toBe(false);

    fireEvent.change(filenameInput, { target: { value: "   " } });
    expect(renameBtn.disabled).toBe(true);

    fireEvent.change(filenameInput, { target: { value: " new-name " } });
    expect(renameBtn.disabled).toBe(false);
  });

  test("calls onRename with trimmed values for filename and extension", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="old"
        currentExtension="js"
      />
    );

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extensionInput = screen.getByLabelText(/extension/i) as HTMLInputElement;
    const renameBtn = screen.getByRole("button", { name: /rename/i });

    fireEvent.change(filenameInput, { target: { value: "  demo  " } });
    fireEvent.change(extensionInput, { target: { value: " ts " } });
    fireEvent.click(renameBtn);

    const calls = (onRename as any).mock?.calls ?? (onRename as any).calls;
    expect(calls?.length ?? 0).toBe(1);
    expect(calls[0][0]).toBe("demo");
    expect(calls[0][1]).toBe("ts");
  });

  test("falls back to currentExtension when extension is blank/whitespace", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="old"
        currentExtension="jsx"
      />
    );

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extensionInput = screen.getByLabelText(/extension/i) as HTMLInputElement;
    const renameBtn = screen.getByRole("button", { name: /rename/i });

    fireEvent.change(filenameInput, { target: { value: " newName " } });
    fireEvent.change(extensionInput, { target: { value: "   " } }); // will trim to "" and fall back
    fireEvent.click(renameBtn);

    const calls = (onRename as any).mock?.calls ?? (onRename as any).calls;
    expect(calls?.length ?? 0).toBe(1);
    expect(calls[0][0]).toBe("newName");
    expect(calls[0][1]).toBe("jsx");
  });

  test("does not call onRename when filename is blank or whitespace-only (even if form submitted)", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    const { container } = render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="willBeCleared"
        currentExtension="md"
      />
    );

    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: "   " } });

    // Button will be disabled; submit the form programmatically to ensure guard works
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
    if (form) {
      fireEvent.submit(form);
    }

    const calls = (onRename as any).mock?.calls ?? (onRename as any).calls;
    expect(calls?.length ?? 0).toBe(0);
  });

  test("clicking Cancel calls onClose", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="keep"
        currentExtension="txt"
      />
    );

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    const calls = (onClose as any).mock?.calls ?? (onClose as any).calls;
    expect(calls?.length ?? 0).toBe(1);
  });

  test("resets inputs to latest props when reopened", () => {
    const onClose = createSpy();
    const onRename = createSpy();

    const { rerender } = render(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="first"
        currentExtension="one"
      />
    );

    // Mutate the fields away from props
    const filenameInput = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extensionInput = screen.getByLabelText(/extension/i) as HTMLInputElement;
    fireEvent.change(filenameInput, { target: { value: "mutated" } });
    fireEvent.change(extensionInput, { target: { value: "mut" } });

    // Close the dialog
    rerender(
      <RenameFileDialog
        isOpen={false}
        onClose={onClose}
        onRename={onRename}
        currentFilename="first"
        currentExtension="one"
      />
    );
    // Reopen with new props
    rerender(
      <RenameFileDialog
        isOpen
        onClose={onClose}
        onRename={onRename}
        currentFilename="second"
        currentExtension="two"
      />
    );

    // On open, effect should reset to the latest props
    const filenameAfter = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extensionAfter = screen.getByLabelText(/extension/i) as HTMLInputElement;
    expect(filenameAfter.value).toBe("second");
    expect(extensionAfter.value).toBe("two");
  });
});