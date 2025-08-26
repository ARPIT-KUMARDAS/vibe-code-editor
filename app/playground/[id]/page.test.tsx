/**
 * Tests for app/playground/[id]/page.tsx
 *
 * Testing library/framework: Jest + @testing-library/react + jest-environment-jsdom
 * If your project uses Vitest instead, replace jest.fn/expect with vi.fn/expect and update mocks accordingly.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// We import the page component under test
// The default export is the MainPlaygroundPage component in the same directory.
import MainPlaygroundPage from './page'

// Mock next/navigation to control route params (app router)
jest.mock('next/navigation', () => {
  return {
    // useParams returns the dynamic route params (e.g., { id: 'abc123' })
    useParams: jest.fn(),
  }
})

// Mock the playground hook to control data returned to the component
jest.mock('@/modules/playground/hooks/usePlayground', () => {
  return {
    usePlayground: jest.fn(),
  }
})

// Mock the TemplateFileTree to avoid deep rendering and to assert against props
const templateFileTreeMock = jest.fn((props: any) => {
  // Provide a stable element in the DOM that we can query and inspect via data attributes
  const {
    data,
    selectedFile,
    title,
  } = props || {}
  return React.createElement(
    'div',
    {
      'data-testid': 'template-file-tree',
      'data-selected-file': selectedFile,
      'data-title': title,
      'data-has-data': data ? 'true' : 'false',
    },
    null
  )
})
jest.mock('@/modules/playground/components/playground-explorer', () => ({
  TemplateFileTree: (props: any) => templateFileTreeMock(props),
}))

// Import the mocked symbols' types after mocks are declared
import { useParams } from 'next/navigation'
import { usePlayground } from '@/modules/playground/hooks/usePlayground'

// Type helpers for clearer expectations
type UsePlaygroundReturn = {
  playgroundData?: { title?: string } | null
  templateData?: unknown
  isLoading?: boolean
  error?: unknown
  saveTemplateData?: (...args: any[]) => any
}

const asMock = <T extends (...args: any[]) => any>(fn: any) => fn as jest.MockedFunction<T>

describe('MainPlaygroundPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function arrangeUseParams(id: string = 'abc123') {
    asMock(useParams).mockReturnValue({ id } as any)
  }

  function arrangeUsePlayground(state: UsePlaygroundReturn) {
    asMock(usePlayground).mockReturnValue({
      playgroundData: null,
      templateData: null,
      isLoading: false,
      error: null,
      saveTemplateData: jest.fn(),
      ...state,
    } as any)
  }

  test('renders provided playground title when available (happy path)', () => {
    arrangeUseParams('pg-001')
    arrangeUsePlayground({
      playgroundData: { title: 'My Awesome Playground' },
      templateData: { foo: 'bar' },
    })

    render(<MainPlaygroundPage />)

    // Title text is taken from playgroundData.title
    expect(screen.getByText('My Awesome Playground')).toBeInTheDocument()

    // TemplateFileTree is rendered with expected props
    const tree = screen.getByTestId('template-file-tree')
    expect(tree).toBeInTheDocument()
    expect(tree.getAttribute('data-selected-file')).toBe('sample.txt') // constant in the component
    expect(tree.getAttribute('data-title')).toBe('File Explorer')
    expect(tree.getAttribute('data-has-data')).toBe('true')

    // Ensure the mock component was called once with expected shape
    expect(templateFileTreeMock).toHaveBeenCalledTimes(1)
    const call = templateFileTreeMock.mock.calls[0][0]
    expect(call).toMatchObject({
      selectedFile: 'sample.txt',
      title: 'File Explorer',
    })
    // data is forwarded from hook's templateData
    expect(call.data).toEqual({ foo: 'bar' })

    // usePlayground should be called with id from useParams
    expect(asMock(usePlayground)).toHaveBeenCalledWith('pg-001')
  })

  test('falls back to default title "Code Playground" when no title is present', () => {
    arrangeUseParams('pg-002')
    arrangeUsePlayground({
      playgroundData: { title: undefined },
      templateData: {},
    })

    render(<MainPlaygroundPage />)

    expect(screen.getByText('Code Playground')).toBeInTheDocument()
    const tree = screen.getByTestId('template-file-tree')
    expect(tree.getAttribute('data-has-data')).toBe('true') // empty object still considered data
  })

  test('renders default title when playgroundData is null/undefined', () => {
    arrangeUseParams('pg-003')
    arrangeUsePlayground({
      playgroundData: null,
      templateData: { files: [] },
    })

    render(<MainPlaygroundPage />)

    expect(screen.getByText('Code Playground')).toBeInTheDocument()
    const tree = screen.getByTestId('template-file-tree')
    expect(tree.getAttribute('data-selected-file')).toBe('sample.txt')
  })

  test('does not crash when isLoading is true (loading state resilience)', () => {
    arrangeUseParams('pg-004')
    arrangeUsePlayground({
      isLoading: true,
      playgroundData: { title: 'Loading Title' },
      templateData: null,
    })

    render(<MainPlaygroundPage />)
    // Component currently does not branch on isLoading; verify stable render
    expect(screen.getByText('Loading Title')).toBeInTheDocument()
    const tree = screen.getByTestId('template-file-tree')
    expect(tree.getAttribute('data-has-data')).toBe('false') // null
  })

  test('does not crash when error is present (error state resilience)', () => {
    arrangeUseParams('pg-005')
    arrangeUsePlayground({
      error: new Error('Boom'),
      playgroundData: undefined,
      templateData: undefined,
    })

    render(<MainPlaygroundPage />)
    // Still should render default title
    expect(screen.getByText('Code Playground')).toBeInTheDocument()
    const tree = screen.getByTestId('template-file-tree')
    expect(tree.getAttribute('data-has-data')).toBe('false')
  })
})