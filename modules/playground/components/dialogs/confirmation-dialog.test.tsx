import * as React from "react"
import { vi, describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"

// Under test
import { ConfirmationDialog } from "./confirmation-dialog"

// Mock the shadcn/ui dialog primitives to avoid portal/ARIA complexity
vi.mock("@/components/ui/dialog", () => {
  // Each primitive renders a simple wrapper so queries still work
  const Dialog = ({ open, onOpenChange, children }: any) => (
    <div data-testid="dialog-root" data-open={open} onClick={() => onOpenChange?.(!open)}>
      {children}
    </div>
  )
  const DialogContent = ({ children }: any) => <div data-testid="dialog-content">{children}</div>
  const DialogHeader = ({ children }: any) => <div data-testid="dialog-header">{children}</div>
  const DialogTitle = ({ children }: any) => <h2>{children}</h2>
  const DialogDescription = ({ children }: any) => <p>{children}</p>
  const DialogFooter = ({ children }: any) => <div data-testid="dialog-footer">{children}</div>

  return {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  }
})

// Mock the Button to a simple button that forwards props/children
vi.mock("@/components/ui/button", () => {
  const Button = ({ children, ...rest }: any) => (
    <button {...rest}>{children}</button>
  )
  return { Button }
})

describe("ConfirmationDialog", () => {
  const title = "Delete item"
  const description = "This action cannot be undone."
  let onConfirm: ReturnType<typeof vi.fn>
  let onCancel: ReturnType<typeof vi.fn>
  let setIsOpen: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onConfirm = vi.fn()
    onCancel = vi.fn()
    setIsOpen = vi.fn()
  })

  it("renders the title", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument()
  })

  it("renders the description only when provided", () => {
    const { rerender, queryByText } = render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(queryByText(description)).toBeNull()

    rerender(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        description={description}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it("uses default button labels when not provided", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("uses custom button labels when provided", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByRole("button", { name: "No, keep" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Yes, delete" })).toBeInTheDocument()
  })

  it("calls onConfirm when Confirm button is clicked", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it("calls onCancel when Cancel button is clicked", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("delegates onOpenChange to setIsOpen", () => {
    // Our mocked Dialog toggles open state when the root is clicked and calls onOpenChange
    render(
      <ConfirmationDialog
        isOpen={false}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    const root = screen.getByTestId("dialog-root")
    expect(root).toHaveAttribute("data-open", "false")

    // Click to trigger onOpenChange(true)
    fireEvent.click(root)
    expect(setIsOpen).toHaveBeenCalledTimes(1)
    expect(setIsOpen).toHaveBeenCalledWith(true)
  })

  it("reflects isOpen prop on the Dialog root (via mocked data attribute)", () => {
    const { rerender } = render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByTestId("dialog-root")).toHaveAttribute("data-open", "true")
    rerender(
      <ConfirmationDialog
        isOpen={false}
        title={title}
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    expect(screen.getByTestId("dialog-root")).toHaveAttribute("data-open", "false")
  })

  it("is resilient when empty strings are provided as labels", () => {
    render(
      <ConfirmationDialog
        isOpen={true}
        title={title}
        confirmLabel=""
        cancelLabel=""
        onConfirm={onConfirm}
        onCancel={onCancel}
        setIsOpen={setIsOpen}
      />
    )
    // Buttons should still render and be clickable even with empty labels
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})