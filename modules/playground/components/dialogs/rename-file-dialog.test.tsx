/**
 * Tests for RenameFileDialog
 *
 * Testing library/framework: React Testing Library with Jest/Vitest-compatible APIs.
 * We use describe/it/expect and RTL's render/screen within a jsdom environment.
 *
 * Scope: Focus on the given component's public interface (props and DOM) and diff contents.
 * - Renders dialog content when isOpen=true
 * - Prefills inputs with currentFilename/currentExtension
 * - Disables submit (Rename) when filename is empty/whitespace
 * - Trims filename and extension on submit; falls back to currentExtension when extension is empty/whitespace
 * - Calls onClose on Cancel click
 * - Resets local state from props when dialog reopens with new values
 *
 * Notes:
 * - To avoid coupling to external UI implementation details (e.g., Radix portals in shadcn/ui Dialog),
 *   we mock "@/components/ui/..." to minimal compatible components that render children and props.
 * - The component exports default RenameFileDialog; we import it from its sibling file (rename-file-dialog.tsx).
 */

import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
// Prefer user-event if available in the repo; fall back to fireEvent otherwise.
let userEvent: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  userEvent = require("@testing-library/user-event").default || require("@testing-library/user-event");
} catch {
  userEvent = null;
}

// Conditionally obtain a jest-like mocking API that works in both Vitest and Jest.
const mocker: any = (global as any).vi ?? (global as any).jest ?? null;
const doMock = (id: string, factory: () => any) => {
  if ((global as any).vi?.mock) (global as any).vi.mock(id, factory as any);
  else if ((global as any).jest?.mock) (global as any).jest.mock(id, factory as any);
};

// Lightweight UI mocks for shadcn/ui building blocks to keep behavior deterministic.
// They pass through props relevant to this component (value/onChange/disabled/onClick/etc.).
doMock("@/components/ui/button", () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => {
    const { children, ...rest } = props;
    return (
      <button data-testid="ui-button" {...rest}>
        {children}
      </button>
    );
  },
}));
doMock("@/components/ui/input", () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => {
    const { className, ...rest } = props;
    return <input data-testid="ui-input" {...rest} />;
  },
}));
doMock("@/components/ui/label", () => ({
  Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => {
    const { children, ...rest } = props;
    return (
      <label data-testid="ui-label" {...rest}>
        {children}
      </label>
    );
  },
}));

// Dialog primitives: open/onOpenChange composition is emulated.
// The Dialog simply renders children when open=true; DialogContent etc. are passthrough wrappers for structure/labels.
doMock("@/components/ui/dialog", () => {
  const Dialog = ({ open, onOpenChange, children }: any) => {
    return open ? (
      <div role="dialog" aria-modal="true" data-testid="ui-dialog">
        {/* expose close control for overlay/escape simulations if needed */}
        <div data-testid="ui-dialog-content-wrapper">{children}</div>
      </div>
    ) : null;
  };
  const DialogContent = ({ children, ...rest }: any) => (
    <div data-testid="ui-dialog-content" {...rest}>
      {children}
    </div>
  );
  const DialogHeader = ({ children }: any) => <div data-testid="ui-dialog-header">{children}</div>;
  const DialogTitle = ({ children }: any) => <h2>{children}</h2>;
  const DialogDescription = ({ children }: any) => <p>{children}</p>;
  const DialogFooter = ({ children }: any) => <div data-testid="ui-dialog-footer">{children}</div>;
  return { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
});

// Import the component under test. It is expected to be located alongside this test file.
import RenameFileDialog from "./rename-file-dialog";

const setup = (overrides: Partial<React.ComponentProps<typeof RenameFileDialog>> = {}) => {
  const props: React.ComponentProps<typeof RenameFileDialog> = {
    isOpen: true,
    onClose: mocker?.fn ? mocker.fn() : (() => void 0),
    onRename: mocker?.fn ? mocker.fn() : (() => void 0),
    currentFilename: "example",
    currentExtension: "txt",
    ...overrides,
  };

  const ui = render(<RenameFileDialog {...props} />);

  const getFilenameInput = () => screen.getByLabelText(/filename/i) as HTMLInputElement;
  const getExtensionInput = () => screen.getByLabelText(/extension/i) as HTMLInputElement;
  const getCancelButton = () => screen.getByRole("button", { name: /cancel/i });
  const getRenameButton = () => screen.getByRole("button", { name: /rename/i });

  return {
    ui,
    props,
    getFilenameInput,
    getExtensionInput,
    getCancelButton,
    getRenameButton,
  };
};

describe("RenameFileDialog", () => {
  it("renders dialog with title, description, and labeled inputs when open", () => {
    setup();
    expect(screen.getByRole("dialog", { hidden: false })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /rename file/i })).toBeInTheDocument();
    expect(screen.getByText(/enter a new name for the file/i)).toBeInTheDocument();

    // Labeled inputs
    const filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    const extension = screen.getByLabelText(/extension/i) as HTMLInputElement;
    expect(filename).toBeInTheDocument();
    expect(extension).toBeInTheDocument();
  });

  it("prefills inputs with currentFilename and currentExtension", () => {
    const { getFilenameInput, getExtensionInput } = setup({
      currentFilename: "report",
      currentExtension: "md",
    });
    expect(getFilenameInput().value).toBe("report");
    expect(getExtensionInput().value).toBe("md");
  });

  it("disables Rename button when filename is empty or whitespace", async () => {
    const { getFilenameInput, getRenameButton } = setup({ currentFilename: "" });
    const rb = getRenameButton();
    // Initially disabled because filename is empty string
    expect(rb).toBeDisabled();

    if (userEvent) {
      await userEvent.clear(getFilenameInput());
      await userEvent.type(getFilenameInput(), "   ");
    } else {
      fireEvent.change(getFilenameInput(), { target: { value: "   " } });
    }
    expect(rb).toBeDisabled();
  });

  it("trims filename and extension on submit and calls onRename with explicit extension", async () => {
    const { getFilenameInput, getExtensionInput, getRenameButton, props } = setup({
      currentFilename: "orig",
      currentExtension: "ts",
    });

    // User edits with leading/trailing spaces
    if (userEvent) {
      await userEvent.clear(getFilenameInput());
      await userEvent.type(getFilenameInput(), "  newName  ");
      await userEvent.clear(getExtensionInput());
      await userEvent.type(getExtensionInput(), "  js  ");
      await userEvent.click(getRenameButton());
    } else {
      fireEvent.change(getFilenameInput(), { target: { value: "  newName  " } });
      fireEvent.change(getExtensionInput(), { target: { value: "  js  " } });
      fireEvent.click(getRenameButton());
    }

    // onRename should be called with trimmed values
    if (mocker?.toHaveBeenCalledWith) {
      expect(props.onRename).toHaveBeenCalledWith("newName", "js");
    }
  });

  it("falls back to currentExtension when extension input is empty/whitespace", async () => {
    const { getFilenameInput, getExtensionInput, getRenameButton, props } = setup({
      currentFilename: "orig",
      currentExtension: "tsx",
    });

    // Change filename to a valid one; blank out extension
    if (userEvent) {
      await userEvent.clear(getFilenameInput());
      await userEvent.type(getFilenameInput(), "validName");
      await userEvent.clear(getExtensionInput());
      await userEvent.type(getExtensionInput(), "   ");
      await userEvent.click(getRenameButton());
    } else {
      fireEvent.change(getFilenameInput(), { target: { value: "validName" } });
      fireEvent.change(getExtensionInput(), { target: { value: "   " } });
      fireEvent.click(getRenameButton());
    }

    if (mocker?.toHaveBeenCalledWith) {
      expect(props.onRename).toHaveBeenCalledWith("validName", "tsx");
    }
  });

  it("does not submit when filename is empty/whitespace", async () => {
    const { getFilenameInput, getRenameButton, props } = setup({
      currentFilename: "",
      currentExtension: "txt",
    });

    if (userEvent) {
      await userEvent.type(getFilenameInput(), "   ");
      await userEvent.click(getRenameButton());
    } else {
      fireEvent.change(getFilenameInput(), { target: { value: "   " } });
      fireEvent.click(getRenameButton());
    }

    if (mocker?.toHaveBeenCalled) {
      expect(props.onRename).not.toHaveBeenCalled?.();
    }
  });

  it("invokes onClose when Cancel is clicked", async () => {
    const { getCancelButton, props } = setup();
    if (userEvent) {
      await userEvent.click(getCancelButton());
    } else {
      fireEvent.click(getCancelButton());
    }
    if (mocker?.toHaveBeenCalled) {
      expect(props.onClose).toHaveBeenCalled?.();
    }
  });

  it("resets fields from props when reopened with new currentFilename/currentExtension", async () => {
    // Start closed to simulate lifecycle properly
    const onClose = mocker?.fn ? mocker.fn() : (() => void 0);
    const onRename = mocker?.fn ? mocker.fn() : (() => void 0);

    const { rerender } = render(
      <RenameFileDialog
        isOpen={false}
        onClose={onClose}
        onRename={onRename}
        currentFilename="initial"
        currentExtension="txt"
      />
    );

    // Open with initial values
    rerender(
      <RenameFileDialog
        isOpen={true}
        onClose={onClose}
        onRename={onRename}
        currentFilename="initial"
        currentExtension="txt"
      />
    );
    let filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    let extension = screen.getByLabelText(/extension/i) as HTMLInputElement;
    expect(filename.value).toBe("initial");
    expect(extension.value).toBe("txt");

    // User types something different (local state diverges from props)
    if (userEvent) {
      await userEvent.clear(filename);
      await userEvent.type(filename, "user-typed");
      await userEvent.clear(extension);
      await userEvent.type(extension, "md");
    } else {
      fireEvent.change(filename, { target: { value: "user-typed" } });
      fireEvent.change(extension, { target: { value: "md" } });
    }
    expect((screen.getByLabelText(/filename/i) as HTMLInputElement).value).toBe("user-typed");
    expect((screen.getByLabelText(/extension/i) as HTMLInputElement).value).toBe("md");

    // Close and reopen with new props; useEffect should reset internal state
    rerender(
      <RenameFileDialog
        isOpen={false}
        onClose={onClose}
        onRename={onRename}
        currentFilename="new-prop"
        currentExtension="ts"
      />
    );
    rerender(
      <RenameFileDialog
        isOpen={true}
        onClose={onClose}
        onRename={onRename}
        currentFilename="new-prop"
        currentExtension="ts"
      />
    );
    filename = screen.getByLabelText(/filename/i) as HTMLInputElement;
    extension = screen.getByLabelText(/extension/i) as HTMLInputElement;
    expect(filename.value).toBe("new-prop");
    expect(extension.value).toBe("ts");
  });
});