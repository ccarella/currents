'use client'

import { useMemo } from 'react'

// Memoized color swatch component for performance
const ColorSwatch = ({ shade, type }: { shade: number; type: 'primary' | 'gray' }) => {
  const textColor = shade >= 500 ? 'text-white' : 'text-gray-900'
  
  return (
    <div className="text-center">
      <div 
        className={`h-16 rounded ${textColor} flex items-center justify-center`}
        style={{ backgroundColor: `var(--color-${type}-${shade})` }}
        role="img"
        aria-label={`${type} color shade ${shade}`}
      >
        <span className="font-medium">{shade}</span>
      </div>
    </div>
  )
}

export default function TypographyTestPage() {
  // Optimize color rendering with useMemo
  const primaryColors = useMemo(() => [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], [])
  const grayColors = useMemo(() => [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], [])

  return (
    <main className="container py-8 space-y-12">
      <header>
        <h1 className="mb-8">Typography Test Page</h1>
        <p className="text-muted-foreground">
          This page demonstrates the Tailwind CSS v4 design system with custom fonts, colors, and typography scale.
        </p>
      </header>

      <section className="space-y-6" aria-labelledby="font-families">
        <h2 id="font-families">Font Families</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-sans">Inter (Headlines)</h3>
            <p className="font-sans">This is Inter font - used for headlines and UI elements. The quick brown fox jumps over the lazy dog.</p>
          </div>
          <div>
            <h3 className="font-serif">Spectral (Body Text)</h3>
            <p className="font-serif">This is Spectral font - used for body text. The quick brown fox jumps over the lazy dog.</p>
          </div>
          <div>
            <h3 className="font-mono">JetBrains Mono (Code)</h3>
            <p className="font-mono">This is JetBrains Mono - used for code. const message = &quot;Hello, World!&quot;;</p>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="typography-scale">
        <h2 id="typography-scale">Typography Scale</h2>
        <div className="space-y-4">
          <h1>Heading 1 - 3rem</h1>
          <h2>Heading 2 - 2.25rem</h2>
          <h3>Heading 3 - 1.875rem</h3>
          <h4>Heading 4 - 1.5rem</h4>
          <h5>Heading 5 - 1.25rem</h5>
          <h6>Heading 6 - 1.125rem</h6>
          <p className="text-4xl">Text 4XL - 3rem</p>
          <p className="text-3xl">Text 3XL - 2.25rem</p>
          <p className="text-2xl">Text 2XL - 1.875rem</p>
          <p className="text-xl">Text XL - 1.5rem</p>
          <p className="text-lg">Text LG - 1.25rem</p>
          <p className="text-base">Text Base - 1.125rem (18px)</p>
          <p className="text-sm">Text SM - 0.875rem</p>
          <p className="text-xs">Text XS - 0.75rem</p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="color-palette">
        <h2 id="color-palette">Color Palette</h2>
        <div className="space-y-6">
          <div>
            <h3>Primary Colors</h3>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Primary color swatches">
              {primaryColors.map((shade) => (
                <ColorSwatch key={shade} shade={shade} type="primary" />
              ))}
            </div>
          </div>
          <div>
            <h3>Gray Colors</h3>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Gray color swatches">
              {grayColors.map((shade) => (
                <ColorSwatch key={shade} shade={shade} type="gray" />
              ))}
            </div>
          </div>
          <div>
            <h3>Theme Colors</h3>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Theme color swatches">
              <div className="text-center">
                <div className="h-16 rounded bg-background border border-border" role="img" aria-label="Background color" />
                <p className="text-xs mt-1">Background</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded bg-foreground" role="img" aria-label="Foreground color" />
                <p className="text-xs mt-1">Foreground</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded bg-muted" role="img" aria-label="Muted color" />
                <p className="text-xs mt-1">Muted</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded bg-accent" role="img" aria-label="Accent color" />
                <p className="text-xs mt-1">Accent</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded border-2 border-border" role="img" aria-label="Border color example" />
                <p className="text-xs mt-1">Border</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded ring-ring" role="img" aria-label="Ring color example" />
                <p className="text-xs mt-1">Ring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="line-heights">
        <h2 id="line-heights">Line Heights</h2>
        <div className="space-y-4">
          <div>
            <h3>Tight (1.25)</h3>
            <p className="leading-tight border-l-4 border-primary-500 pl-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Snug (1.375)</h3>
            <p className="leading-snug border-l-4 border-primary-500 pl-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Normal (1.5)</h3>
            <p className="leading-normal border-l-4 border-primary-500 pl-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Relaxed (1.625)</h3>
            <p className="leading-relaxed border-l-4 border-primary-500 pl-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Loose (1.75)</h3>
            <p className="leading-loose border-l-4 border-primary-500 pl-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="content-width">
        <h2 id="content-width">Content Width Constraint</h2>
        <div className="bg-muted p-6 rounded-md">
          <p>
            This content is contained within the max-width constraint of 650px. The container class ensures that content doesn&apos;t stretch too wide on larger screens, maintaining optimal readability.
          </p>
          <p className="mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </section>

      <section className="space-y-6" aria-labelledby="code-blocks">
        <h2 id="code-blocks">Code Blocks</h2>
        <pre className="bg-muted p-4 rounded overflow-x-auto" aria-label="Example code block">
          <code className="font-mono text-sm">{`// Example code block with JetBrains Mono font
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message); // Output: Hello, World!`}</code>
        </pre>
      </section>

      <section className="space-y-6" aria-labelledby="responsive-design">
        <h2 id="responsive-design">Responsive Design</h2>
        <p className="text-sm text-muted-foreground">
          Resize your browser window to test the responsive behavior of the design system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded">
            <h3 className="font-sans">Column 1</h3>
            <p>This layout responds to different screen sizes.</p>
          </div>
          <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded">
            <h3 className="font-sans">Column 2</h3>
            <p>On mobile, these columns stack vertically.</p>
          </div>
        </div>
      </section>
    </main>
  );
}