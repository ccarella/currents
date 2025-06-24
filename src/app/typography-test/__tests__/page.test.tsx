import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TypographyTestPage from '../page'

describe('TypographyTestPage', () => {
  it('should render the typography test page', () => {
    render(<TypographyTestPage />)
    expect(screen.getByText('Typography Test Page')).toBeInTheDocument()
  })

  it('should display all font family sections', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Inter (Headlines)')).toBeInTheDocument()
    expect(screen.getByText('Spectral (Body Text)')).toBeInTheDocument()
    expect(screen.getByText('JetBrains Mono (Code)')).toBeInTheDocument()
  })

  it('should display typography scale examples', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Heading 1 - 3rem')).toBeInTheDocument()
    expect(screen.getByText('Heading 2 - 2.25rem')).toBeInTheDocument()
    expect(screen.getByText('Heading 3 - 1.875rem')).toBeInTheDocument()
    expect(screen.getByText('Text Base - 1.125rem (18px)')).toBeInTheDocument()
  })

  it('should display color palette sections', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Primary Colors')).toBeInTheDocument()
    expect(screen.getByText('Gray Colors')).toBeInTheDocument()
    expect(screen.getByText('Theme Colors')).toBeInTheDocument()
  })

  it('should display line height examples', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Tight (1.25)')).toBeInTheDocument()
    expect(screen.getByText('Normal (1.5)')).toBeInTheDocument()
    expect(screen.getByText('Relaxed (1.625)')).toBeInTheDocument()
  })

  it('should display content width constraint section', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Content Width Constraint')).toBeInTheDocument()
    expect(screen.getByText(/max-width constraint of 650px/)).toBeInTheDocument()
  })

  it('should display code block example', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Code Blocks')).toBeInTheDocument()
    expect(screen.getByText(/Example code block with JetBrains Mono font/)).toBeInTheDocument()
  })

  it('should display responsive design section', () => {
    render(<TypographyTestPage />)
    
    expect(screen.getByText('Responsive Design')).toBeInTheDocument()
    expect(screen.getByText('Column 1')).toBeInTheDocument()
    expect(screen.getByText('Column 2')).toBeInTheDocument()
  })

  it('should apply container class to main wrapper', () => {
    const { container } = render(<TypographyTestPage />)
    const mainContainer = container.querySelector('.container')
    
    expect(mainContainer).toBeInTheDocument()
    expect(mainContainer).toHaveStyle({
      paddingTop: '2rem',
      paddingBottom: '2rem'
    })
  })

  it('should have proper section spacing', () => {
    const { container } = render(<TypographyTestPage />)
    const sections = container.querySelectorAll('section')
    
    sections.forEach(section => {
      expect(section).toHaveStyle({ marginBottom: '3rem' })
    })
  })
})