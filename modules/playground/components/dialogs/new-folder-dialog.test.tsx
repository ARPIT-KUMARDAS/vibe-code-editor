import React from "react"

// Prefer the project's existing testing setup
import { render, screen, fireEvent } from "@testing-library/react"
import userEventLib from "@testing-library/user-event"

// Try both vi (Vitest) and jest (Jest) without importing either explicitly
const fn = (globalThis as any).vi?.fn ?? (globalThis as any).jest?.fn ?? (() => { throw new Error("No test spy function available (vi/jest)"); })

// Detect whether userEvent is available; fall back to fireEvent-based helpers
const userEvent = userEventLib ?? null

// IMPORTANT: Adjust this import path if the component lives elsewhere in the repo.
// We assume the component file is sibling-named new-folder-dialog.tsx
import NewFolderDialog from "./new-folder-dialog"

describe("NewFolderDialog", () => {
  function setup(props?: Partial<React.ComponentProps<typeof NewFolderDialog>>) {
    const onClose = fn()
    const onCreateFolder = fn()
    const defaultProps = {
      isOpen: true,
      onClose,
      onCreateFolder,
    }
    const allProps = { ...defaultProps, ...props }
    const utils = render(<NewFolderDialog {...allProps} />)
    const getInput = () => screen.getByLabelText("Folder Name") as HTMLInputElement
    const getCreateBtn = () => screen.getByRole("button", { name: /create/i })
    const getCancelBtn = () => screen.getByRole("button", { name: /cancel/i })
    return { ...utils, onClose, onCreateFolder, getInput, getCreateBtn, getCancelBtn }
  }

  test("does not render content when dialog is closed", () => {
    setup({ isOpen: false })
    expect(screen.queryByText(/create new folder/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/enter a name for the new folder/i)).not.toBeInTheDocument()
  })

  test("renders title, description, labeled input and buttons when open", () => {
    setup({ isOpen: true })
    expect(screen.getByText(/create new folder/i)).toBeInTheDocument()
    expect(screen.getByText(/enter a name for the new folder/i)).toBeInTheDocument()
    // Label associated to input via htmlFor/id
    const input = screen.getByLabelText("Folder Name")
    expect(input).toBeInTheDocument()
    // Placeholder propagated
    expect(input).toHaveAttribute("placeholder", "components")
    // Buttons
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    const createBtn = screen.getByRole("button", { name: /create/i })
    expect(createBtn).toBeInTheDocument()
    // Initially disabled because input is empty
    expect(createBtn).toBeDisabled()
  })

  test("keeps Create disabled for blank or whitespace-only input", async () => {
    const { getInput, getCreateBtn } = setup()
    const input = getInput()
    const createBtn = getCreateBtn()

    // With blank input
    expect(input.value).toBe("")
    expect(createBtn).toBeDisabled()

    // With whitespace-only input
    if (userEvent) {
      await userEvent.type(input, "   ")
    } else {
      fireEvent.change(input, { target: { value: "   " } })
    }
    expect(input.value).toBe("   ")
    // Button remains disabled due to trim()
    expect(createBtn).toBeDisabled()
  })

  test("enables Create for non-whitespace input and submits trimmed value", async () => {
    const { getInput, getCreateBtn, onCreateFolder } = setup()
    const input = getInput()
    const createBtn = getCreateBtn()

    // Type with surrounding spaces
    const raw = "   components   "
    const trimmed = "components"
    if (userEvent) {
      await userEvent.clear(input)
      await userEvent.type(input, raw)
    } else {
      fireEvent.change(input, { target: { value: raw } })
    }

    expect(input.value).toBe(raw)
    expect(createBtn).not.toBeDisabled()

    // Submit via click
    if (userEvent) {
      await userEvent.click(createBtn)
    } else {
      fireEvent.click(createBtn)
    }

    // onCreateFolder called with trimmed name
    expect(onCreateFolder).toHaveBeenCalledTimes(1)
    expect(onCreateFolder).toHaveBeenCalledWith(trimmed)

    // Input is cleared after successful submit; button becomes disabled again
    expect(input.value).toBe("")
    expect(createBtn).toBeDisabled()
  })

  test("submits via Enter key (form submit) and resets input", async () => {
    const { getInput, onCreateFolder, getCreateBtn } = setup()
    const input = getInput()
    const createBtn = getCreateBtn()

    const name = "my-folder"
    if (userEvent) {
      await userEvent.type(input, name)
      // Press Enter in the input to submit the form
      await userEvent.keyboard("{Enter}")
    } else {
      fireEvent.change(input, { target: { value: name } })
      // Fire a submit event on the form by clicking the enabled submit button
      fireEvent.click(createBtn)
    }

    expect(onCreateFolder).toHaveBeenCalledTimes(1)
    expect(onCreateFolder).toHaveBeenCalledWith("my-folder")

    // After submission, input should be cleared and button disabled again
    expect((screen.getByLabelText("Folder Name") as HTMLInputElement).value).toBe("")
    expect(screen.getByRole("button", { name: /create/i })).toBeDisabled()
  })

  test("does not submit when value is only spaces (no onCreateFolder call)", async () => {
    const { getInput, getCreateBtn, onCreateFolder } = setup()
    const input = getInput()
    const createBtn = getCreateBtn()

    if (userEvent) {
      await userEvent.type(input, "    ")
      await userEvent.click(createBtn)
    } else {
      fireEvent.change(input, { target: { value: "    " } })
      fireEvent.click(createBtn)
    }

    expect(onCreateFolder).not.toHaveBeenCalled()
    // Input not cleared because submit path was not taken
    expect(input.value).toBe("    ")
  })

  test("clicking Cancel calls onClose and does not trigger create", async () => {
    const { getInput, getCreateBtn, getCancelBtn, onClose, onCreateFolder } = setup()
    const input = getInput()
    const cancelBtn = getCancelBtn()
    const createBtn = getCreateBtn()

    // Enter a valid value but then cancel
    if (userEvent) {
      await userEvent.type(input, "abc")
      await userEvent.click(cancelBtn)
    } else {
      fireEvent.change(input, { target: { value: "abc" } })
      fireEvent.click(cancelBtn)
    }

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreateFolder).not.toHaveBeenCalled()
    // Input remains as user typed (component doesn't clear on cancel)
    expect(input.value).toBe("abc")
    // Create remains enabled since input has non-whitespace
    expect(createBtn).not.toBeDisabled()
  })
})