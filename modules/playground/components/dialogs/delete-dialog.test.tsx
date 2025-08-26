/**
 * DeleteDialog unit tests
 *
 * Test stack assumption:
 * - React Testing Library for rendering and interactions
 * - jest-dom matchers available globally via setup (works with both Jest and Vitest)
 * - Test runner: Jest or Vitest (globals: describe/test/it/expect/afterEach)
 *
 * These tests focus on the public interface and the diffed behaviors:
 * - Default titles/labels/destructive action styling
 * - Description interpolation when "{item}" placeholder is present
 * - Edge cases for interpolation (missing placeholder, missing itemName)
 * - Action and Cancel button behaviors (onConfirm, onOpenChange via setIsOpen)
 */

import * as React from "react"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
// If the project sets up jest-dom globally this import can be omitted;
// keeping it here is harmless in most setups.
import "@testing-library/jest-dom"

import { DeleteDialog } from "./delete-dialog"

afterEach(() => {
  cleanup()
})

function renderDialog(overrides: Partial<React.ComponentProps<typeof DeleteDialog>> = {}) {
  const props: React.ComponentProps<typeof DeleteDialog> = {
    isOpen: true,
    setIsOpen: () => {},
    onConfirm: () => {},
    ...overrides,
  }
  return render(<DeleteDialog {...props} />)
}

describe("DeleteDialog", () => {
  test("renders with default title, description, and button labels when no overrides provided", () => {
    renderDialog()

    expect(screen.getByText("Delete Item")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ).toBeInTheDocument()

    // Buttons
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    const confirmBtn = screen.getByRole("button", { name: "Delete" })
    expect(confirmBtn).toBeInTheDocument()

    // Destructive styling on confirm button
    expect(confirmBtn).toHaveClass("bg-destructive")
    expect(confirmBtn).toHaveClass("text-destructive-foreground")
    expect(confirmBtn).toHaveClass("hover:bg-destructive/90")
  })

  test("renders custom title and labels", () => {
    renderDialog({
      title: "Remove File",
      confirmLabel: "Remove",
      cancelLabel: "Abort",
    })

    expect(screen.getByText("Remove File")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Abort" })).toBeInTheDocument()
  })

  test('interpolates itemName into description when "{item}" placeholder is present', () => {
    renderDialog({
      description: 'Are you sure you want to delete {item}? This cannot be undone.',
      itemName: "Report.pdf",
    })

    expect(
      screen.getByText('Are you sure you want to delete "Report.pdf"? This cannot be undone.')
    ).toBeInTheDocument()
  })

  test("does not interpolate when placeholder is missing, even if itemName is provided", () => {
    renderDialog({
      description: "Delete requested item.",
      itemName: "Ignored.docx",
    })

    // The literal item name with quotes should NOT appear because there's no {item} placeholder
    expect(screen.queryByText(/"Ignored\.docx"/)).not.toBeInTheDocument()
    expect(screen.getByText("Delete requested item.")).toBeInTheDocument()
  })

  test('edge case: if description contains "{item}" but itemName is undefined, shows "undefined" in quotes', () => {
    renderDialog({
      description: "Delete {item}?",
      // itemName omitted, so undefined
    })

    // Current implementation behavior interpolates "undefined"
    expect(screen.getByText('Delete "undefined"?')).toBeInTheDocument()
  })

  test("invokes onConfirm exactly once when clicking the confirm action", async () => {
    const user = userEvent.setup()
    let called = 0
    const onConfirm = () => {
      called += 1
    }

    renderDialog({ onConfirm })

    await user.click(screen.getByRole("button", { name: /delete/i }))
    expect(called).toBe(1)
  })

  test("clicking Cancel triggers setIsOpen with false (via onOpenChange)", async () => {
    const user = userEvent.setup()
    const openChanges: boolean[] = []
    const setIsOpen = (open: boolean) => {
      openChanges.push(open)
    }

    renderDialog({ setIsOpen })

    await user.click(screen.getByRole("button", { name: /cancel/i }))

    // Expect at least one call that sets open to false
    expect(openChanges.length).toBeGreaterThan(0)
    expect(openChanges).toContain(false)
  })

  test("when isOpen is false, dialog content is not rendered", () => {
    renderDialog({ isOpen: false })

    // Title should not be in the document if the dialog is closed
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument()
  })
})