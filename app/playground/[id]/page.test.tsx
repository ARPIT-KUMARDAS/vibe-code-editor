/* eslint-disable import/no-unresolved */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRoot } from "react-dom/client";
import MainPlaygroundPage from "./page";

/**
 * Mocks for external dependencies.
 * We use virtual mocks for local alias paths to avoid resolution issues.
 */
const mockUseParams = vi.fn(() => ({ id: "default-id" }));
const mockUsePlayground = vi.fn((id: string) => ({
  playgroundData: undefined,
  templateData: { name: "root", type: "folder", children: [] },
  isLoading: false,
  error: null,
  saveTemplateData: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: mockUseParams,
}));

vi.mock("@/modules/playground/hooks/usePlayground", () => ({
  usePlayground: mockUsePlayground,
}), { virtual: true });

vi.mock("@/modules/playground/components/playground-explorer", () => {
  const React = require("react");
  const TemplateFileTree = ({ selectedFile, title }: any) =>
    React.createElement("div", { "data-testid": "template-file-tree", "data-selected-file": selectedFile, "data-title": title });
  return { TemplateFileTree };
}, { virtual: true });

vi.mock("@/components/ui/separator", () => {
  const React = require("react");
  return { Separator: (props: any) => React.createElement("div", { "data-testid": "separator", ...props }) };
}, { virtual: true });

vi.mock("@/components/ui/sidebar", () => {
  const React = require("react");
  return {
    SidebarInset: ({ children, ...rest }: any) => React.createElement("section", { "data-testid": "sidebar-inset", ...rest }, children),
    SidebarTrigger: (props: any) => React.createElement("button", { "data-testid": "sidebar-trigger", ...props }),
  };
}, { virtual: true });

vi.mock("@radix-ui/react-tooltip", () => {
  const React = require("react");
  return { TooltipProvider: ({ children }: any) => React.createElement("div", { "data-testid": "tooltip-provider" }, children) };
});

vi.mock("lucide-react", () => {
  const React = require("react");
  return { Sidebar: (props: any) => React.createElement("svg", { "data-testid": "icon-sidebar", ...props }) };
});

/**
 * Minimal test renderer (fallback when @testing-library/react is not present).
 * We do not introduce new dependencies; this is sufficient for DOM-based assertions.
 */
let container: HTMLElement;
let root: any;

const screen = {
  getByText: (txt: string | RegExp) => {
    const nodes = container.querySelectorAll("*");
    for (const n of Array.from(nodes)) {
      const text = (n.textContent || "").trim();
      if (typeof txt === "string" ? text === txt || text.includes(txt) : txt.test(text)) return n as Element;
    }
    throw new Error("Text not found: " + txt.toString());
  },
  queryByTestId: (id: string) => container.querySelector(`[data-testid="${id}"]`),
};

function render(node: React.ReactElement) {
  if (!container.isConnected) document.body.appendChild(container);
  root.render(node);
  return { container };
}

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.innerHTML = "";
  document.body.appendChild(container);
  root = createRoot(container);

  mockUseParams.mockReturnValue({ id: "abc123" });
  mockUsePlayground.mockImplementation((id: string) => ({
    playgroundData: undefined,
    templateData: { name: "root", type: "folder", children: [] },
    isLoading: false,
    error: null,
    saveTemplateData: vi.fn(),
  }));
});

describe("MainPlaygroundPage (unit)", () => {
  it("renders fallback title when playgroundData.title is absent", () => {
    render(<MainPlaygroundPage />);
    const title = screen.getByText("Code Playground");
    expect(title).toBeTruthy();
    // sanity: key structural stubs are present
    expect(screen.queryByTestId("sidebar-inset")).toBeTruthy();
    expect(screen.queryByTestId("sidebar-trigger")).toBeTruthy();
    expect(screen.queryByTestId("separator")).toBeTruthy();
    expect(screen.queryByTestId("template-file-tree")).toBeTruthy();
  });

  it("renders the provided title from usePlayground", () => {
    mockUsePlayground.mockImplementation((id: string) => ({
      playgroundData: { title: "My Awesome Playground" },
      templateData: { name: "root", type: "folder", children: [] },
      isLoading: false,
      error: null,
      saveTemplateData: vi.fn(),
    }));
    render(<MainPlaygroundPage />);
    expect(screen.getByText("My Awesome Playground")).toBeTruthy();
  });

  it("passes selectedFile='sample.txt' and title to TemplateFileTree", () => {
    render(<MainPlaygroundPage />);
    const tree = screen.queryByTestId("template-file-tree") as HTMLElement | null;
    expect(tree).toBeTruthy();
    if (tree) {
      expect(tree.getAttribute("data-selected-file")).toBe("sample.txt");
      expect(tree.getAttribute("data-title")).toBe("File Explorer");
    }
  });

  it("invokes usePlayground with the id from useParams", () => {
    mockUseParams.mockReturnValue({ id: "xyz789" });
    render(<MainPlaygroundPage />);
    expect(mockUsePlayground).toHaveBeenCalledWith("xyz789");
  });

  it("does not crash when templateData is an empty object", () => {
    mockUsePlayground.mockImplementation((id: string) => ({
      playgroundData: { title: "Edge Case" },
      templateData: {}, // still truthy for non-null assertion in component
      isLoading: false,
      error: null,
      saveTemplateData: vi.fn(),
    }));
    render(<MainPlaygroundPage />);
    expect(screen.getByText("Edge Case")).toBeTruthy();
  });

  it("renders at least one heading (h1) for structural sanity", () => {
    const { container } = render(<MainPlaygroundPage />);
    expect(container.querySelectorAll("h1").length).toBeGreaterThanOrEqual(1);
  });
});