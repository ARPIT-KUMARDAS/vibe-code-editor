/**
 * Tests for NewFileDialog
 *
 * Framework: React Testing Library with Vitest/Jest-style APIs.
 * - If the project uses Vitest: keep the 'vitest' imports.
 * - If the project uses Jest: you may remove 'vitest' import and rely on Jest globals if configured.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewFileDialog from "./new-file-dialog"; // Adjust if component export path differs

// Prefer Vitest if available; Jest projects can ignore the import if globals are configured.
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("NewFileDialog", () => {
  let onClose: ReturnType<typeof vi.fn>;
  let onCreateFile: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onClose = vi.fn();
    onCreateFile = vi.fn();
  });

  const setup = async (isOpen = true) => {
    const user = userEvent.setup();
    render(
      <NewFileDialog isOpen={isOpen} onClose={onClose} onCreateFile={onCreateFile} />
    );
    return { user };
  };

  it("renders title, description, labels, placeholders when open", async () => {
    await setup(true);

    expect(screen.getByText("Create New File")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a name for the new file and select its extension.")
    ).toBeInTheDocument();

    const filenameLabel = screen.getByText("Filename");
    const extensionLabel = screen.getByText("Extension");
    expect(filenameLabel).toBeInTheDocument();
    expect(extensionLabel).toBeInTheDocument();

    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    const extensionInput = screen.getByPlaceholderText("js") as HTMLInputElement;
    expect(filenameInput).toBeInTheDocument();
    expect(extensionInput).toBeInTheDocument();

    // Default extension value should be "js"
    expect(extensionInput.value).toBe("js");

    // Buttons
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    const createBtn = screen.getByRole("button", { name: /create/i });
    expect(cancelBtn).toBeInTheDocument();
    expect(createBtn).toBeInTheDocument();
  });

  it("auto-focuses the filename input when dialog opens", async () => {
    await setup(true);
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    // JSDOM doesn't truly focus without tab, but React Testing Library tracks focus
    expect(filenameInput).toHaveFocus();
  });

  it("disables Create button when filename is empty or only whitespace", async () => {
    await setup(true);
    const createBtn = screen.getByRole("button", { name: /create/i });
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;

    // Initial: empty filename -> disabled
    expect(filenameInput.value).toBe("");
    expect(createBtn).toBeDisabled();

    // Whitespace-only -> still disabled
    await userEvent.type(filenameInput, "   ");
    expect(createBtn).toBeDisabled();
  });

  it("enables Create button when a non-whitespace filename is entered", async () => {
    await setup(true);
    const createBtn = screen.getByRole("button", { name: /create/i });
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;

    await userEvent.type(filenameInput, "index");
    expect(createBtn).not.toBeDisabled();
  });

  it("calls onCreateFile with trimmed filename and default extension when submitted", async () => {
    await setup(true);
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await userEvent.type(filenameInput, "   app  ");
    await userEvent.click(createBtn);

    expect(onCreateFile).toHaveBeenCalledTimes(1);
    expect(onCreateFile).toHaveBeenCalledWith("app", "js");
  });

  it("uses 'js' extension when extension input is whitespace", async () => {
    await setup(true);
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    const extensionInput = screen.getByPlaceholderText("js") as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await userEvent.clear(extensionInput);
    await userEvent.type(extensionInput, "   ");
    await userEvent.type(filenameInput, "util");
    await userEvent.click(createBtn);

    expect(onCreateFile).toHaveBeenCalledWith("util", "js");
  });

  it("passes custom extension when provided", async () => {
    await setup(true);
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    const extensionInput = screen.getByPlaceholderText("js") as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await userEvent.clear(extensionInput);
    await userEvent.type(extensionInput, "tsx");
    await userEvent.type(filenameInput, "Component");
    await userEvent.click(createBtn);

    expect(onCreateFile).toHaveBeenCalledWith("Component", "tsx");
  });

  it("does not call onCreateFile when filename is empty/whitespace", async () => {
    await setup(true);
    const createBtn = screen.getByRole("button", { name: /create/i });

    await userEvent.click(createBtn);
    expect(onCreateFile).not.toHaveBeenCalled();
  });

  it("resets inputs after successful creation", async () => {
    await setup(true);
    const filenameInput = screen.getByPlaceholderText("main") as HTMLInputElement;
    const extensionInput = screen.getByPlaceholderText("js") as HTMLInputElement;
    const createBtn = screen.getByRole("button", { name: /create/i });

    await userEvent.clear(extensionInput);
    await userEvent.type(extensionInput, "ts");
    await userEvent.type(filenameInput, "foo");
    await userEvent.click(createBtn);

    expect(onCreateFile).toHaveBeenCalledWith("foo", "ts");

    // After submission, component resets internal state
    expect(filenameInput.value).toBe("");
    expect(extensionInput.value).toBe("js");
  });

  it("invokes onClose when Cancel is clicked", async () => {
    await setup(true);
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render dialog content when isOpen is false", async () => {
    await setup(false);
    // Title shouldn't be present when closed
    expect(screen.queryByText("Create New File")).not.toBeInTheDocument();
  });
});