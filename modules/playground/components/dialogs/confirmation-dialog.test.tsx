import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Under test: ConfirmationDialog
// We import from the same file if the component lives alongside this test.
// If the component resides elsewhere (e.g., confirmation-dialog.tsx), feel free to adjust the import path accordingly.
import { ConfirmationDialog, type ConfirmationDialogProps } from "./confirmation-dialog"

// Mock the UI primitives to keep tests focused on this component's behavior.
// The project's "@/components/ui/dialog" might wrap Radix UI; to avoid portal/focus complexities in unit tests,
// we provide simple stand-ins that render children and honor the "open" prop visibility semantics.
jest.mock("@/components/ui/dialog", () => {
  const Dialog = ({ open, onOpenChange, children }: any) => (
    <div data-testid="dialog-root" data-open={open} data-onopenchange={!!onOpenChange}>
      {open ? children : null}
    </div>
  )
  const DialogContent = ({ children }: any) => <div data-testid="dialog-content">{children}</div>
  const DialogHeader = ({ children }: any) => <div data-testid="dialog-header">{children}</div>
  const DialogTitle = ({ children }: any) => <h2>{children}</h2>
  const DialogDescription = ({ children }: any) => <p>{children}</p>
  const DialogFooter = ({ children }: any) => <div role="group">{children}</div>
  return { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }
})

// Mock the Button primitive so clicks are simple and accessible.
jest.mock("@/components/ui/button", () => {
  const Button = ({ children, onClick, variant }: any) => (
    <button type="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  )
  return { Button }
})

function setup(props?: Partial<ConfirmationDialogProps>) {
  const defaultProps: ConfirmationDialogProps = {
    isOpen: true,
    title: "Delete item",
    description: "This action cannot be undone.",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    setIsOpen: jest.fn(),
  }
  const all = { ...defaultProps, ...props }
  const user = userEvent.setup()
  render(<ConfirmationDialog {...all} />)
  return { user, props: all }
}

describe("ConfirmationDialog", () => {
  it("renders title and description when open", () => {
    setup()
    expect(screen.getByRole("heading", { level: 2, name: "Delete item" })).toBeInTheDocument()
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument()
    // Footer and buttons present
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("does not render content when closed (isOpen=false)", () => {
    setup({ isOpen: false })
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument()
    expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument()
    // Buttons should not be in the DOM if closed
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument()
  })

  it("omits description when none is provided", () => {
    setup({ description: undefined })
    expect(screen.getByRole("heading", { level: 2, name: "Delete item" })).toBeInTheDocument()
    expect(screen.queryByText("This action cannot be undone.")).not.toBeInTheDocument()
  })

  it("uses default button labels when not provided", () => {
    setup({ confirmLabel: undefined, cancelLabel: undefined })
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("uses custom button labels when provided", () => {
    setup({ confirmLabel: "Yes, delete", cancelLabel: "No, keep" })
    expect(screen.getByRole("button", { name: "No, keep" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument()
  })

  it("invokes onCancel when Cancel is clicked", async () => {
    const { user, props } = setup()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(props.onCancel).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).not.toHaveBeenCalled()
  })

  it("invokes onConfirm when Confirm is clicked", async () => {
    const { user, props } = setup()
    await user.click(screen.getByRole("button", { name: "Confirm" }))
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
    expect(props.onCancel).not.toHaveBeenCalled()
  })

  it("passes setIsOpen as onOpenChange to Dialog (smoke: prop wired)", () => {
    const { props } = setup()
    // Our Dialog mock exposes a flag indicating onOpenChange was provided.
    const root = screen.getByTestId("dialog-root")
    expect(root).toHaveAttribute("data-onopenchange", "true")
    // We cannot trigger Radix internals here, but we assert the handler is present (wiring verification).
    expect(typeof props.setIsOpen).toBe("function")
  })

  it("is resilient to empty strings and unusual labels", async () => {
    // Edge labels like empty string, long strings, unicode
    const weirdConfirm = "✅ Proceed — 你好世界 — 🚀"
    const weirdCancel = ""
    const { user, props } = setup({ confirmLabel: weirdConfirm, cancelLabel: weirdCancel })
    // Buttons should still render (empty cancel text produces a button with no name - query by role index)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent("")        // cancel button
    expect(buttons[1]).toHaveTextContent(weirdConfirm)

    // Click both to ensure handlers still fire
    await user.click(buttons[0])
    await user.click(buttons[1])
    expect(props.onCancel).toHaveBeenCalledTimes(1)
    expect(props.onConfirm).toHaveBeenCalledTimes(1)
  })

  it("renders long title strings without truncation side-effects (basic presence)", () => {
    const longTitle = "Confirm ".repeat(50).trim()
    setup({ title: longTitle })
    expect(screen.getByRole("heading", { level: 2, name: longTitle })).toBeInTheDocument()
  })
})