export default function TypographyTestPage() {
  const sectionStyle = { marginBottom: '3rem' };
  
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <section style={sectionStyle}>
        <h1 className="mb-8">Typography Test Page</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>
          This page demonstrates the Tailwind CSS v4 design system with custom fonts, colors, and typography scale.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>Font Families</h2>
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

      <section style={sectionStyle}>
        <h2>Typography Scale</h2>
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

      <section style={sectionStyle}>
        <h2>Color Palette</h2>
        <div className="space-y-6">
          <div>
            <h3>Primary Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center">
                  <div 
                    className="h-16 rounded" 
                    style={{ backgroundColor: `var(--color-primary-${shade})` }}
                  />
                  <p className="text-xs mt-1">{shade}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Gray Colors</h3>
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center">
                  <div 
                    className="h-16 rounded" 
                    style={{ backgroundColor: `var(--color-gray-${shade})` }}
                  />
                  <p className="text-xs mt-1">{shade}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Theme Colors</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="h-16 rounded" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }} />
                <p className="text-xs mt-1">Background</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded" style={{ backgroundColor: 'var(--foreground)' }} />
                <p className="text-xs mt-1">Foreground</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded" style={{ backgroundColor: 'var(--muted)' }} />
                <p className="text-xs mt-1">Muted</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded" style={{ backgroundColor: 'var(--accent)' }} />
                <p className="text-xs mt-1">Accent</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded" style={{ border: '2px solid var(--border)' }} />
                <p className="text-xs mt-1">Border</p>
              </div>
              <div className="text-center">
                <div className="h-16 rounded" style={{ boxShadow: `0 0 0 2px var(--ring)` }} />
                <p className="text-xs mt-1">Ring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Line Heights</h2>
        <div className="space-y-4">
          <div>
            <h3>Tight (1.25)</h3>
            <p className="leading-tight" style={{ borderLeft: '4px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Snug (1.375)</h3>
            <p className="leading-snug" style={{ borderLeft: '4px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Normal (1.5)</h3>
            <p className="leading-normal" style={{ borderLeft: '4px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Relaxed (1.625)</h3>
            <p className="leading-relaxed" style={{ borderLeft: '4px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <h3>Loose (1.75)</h3>
            <p className="leading-loose" style={{ borderLeft: '4px solid var(--color-primary-500)', paddingLeft: '1rem' }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Content Width Constraint</h2>
        <div style={{ backgroundColor: 'var(--muted)', padding: '1.5rem', borderRadius: '0.375rem' }}>
          <p>
            This content is contained within the max-width constraint of 650px. The container class ensures that content doesn&apos;t stretch too wide on larger screens, maintaining optimal readability.
          </p>
          <p className="mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2>Code Blocks</h2>
        <pre style={{ backgroundColor: 'var(--muted)', padding: '1rem', borderRadius: '0.375rem', overflowX: 'auto' }}>
          <code className="font-mono text-sm">{`// Example code block with JetBrains Mono font
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("World");
console.log(message); // Output: Hello, World!`}</code>
        </pre>
      </section>

      <section style={sectionStyle}>
        <h2>Responsive Design</h2>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Resize your browser window to test the responsive behavior of the design system.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: '1rem', borderRadius: '0.375rem' }}>
            <h3 className="font-sans">Column 1</h3>
            <p>This layout responds to different screen sizes.</p>
          </div>
          <div style={{ backgroundColor: 'var(--color-primary-100)', padding: '1rem', borderRadius: '0.375rem' }}>
            <h3 className="font-sans">Column 2</h3>
            <p>On mobile, these columns stack vertically.</p>
          </div>
        </div>
      </section>
    </div>
  );
}