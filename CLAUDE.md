# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

Build and run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run production server:

```bash
npm run start
```

### Code Quality

Lint code:

```bash
npm run lint          # Check for linting issues
npm run lint:fix      # Auto-fix linting issues
```

Format code:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting without changing files
```

Type checking:

```bash
npm run type-check       # Run TypeScript type checking
npm run type-check:watch # Run type checking in watch mode
```

### Testing

Run tests:

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run all tests once
npm run test:watch    # Run tests in watch mode (alias for npm test)
npm run test:coverage # Run tests with coverage report
npm run test:e2e      # Run end-to-end tests
```

### Database Management (Supabase)

Local database:

```bash
npm run db:start      # Start local Supabase instance
npm run db:stop       # Stop local Supabase instance
npm run db:status     # Check Supabase status
npm run db:reset      # Reset database to initial state
```

Migrations:

```bash
npm run db:migrate         # Create a new migration
npm run db:migrate:up      # Apply pending migrations
npm run db:migrate:list    # List all migrations
npm run db:push            # Push local database changes to remote
npm run db:pull            # Pull remote database schema
```

Type generation:

```bash
npm run db:types          # Generate TypeScript types from local database
npm run db:types:remote   # Generate types from remote database (requires SUPABASE_PROJECT_ID)
```

Supabase functions:

```bash
npm run supabase:link             # Link to remote Supabase project
npm run supabase:functions:serve  # Run Edge Functions locally
npm run supabase:functions:deploy # Deploy Edge Functions
```

### Utility Commands

```bash
npm run clean      # Remove build artifacts and node_modules
npm run reinstall  # Clean and reinstall dependencies
```

## Architecture Overview

This is a Next.js 15.3.4 application using the App Router pattern with TypeScript and Tailwind CSS v4.

### Technology Stack

- **Framework**: Next.js 15.3.4 with Turbopack
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: Supabase Auth
- **Font**: Geist font family
- **Testing**: Vitest for unit and integration tests
- **Code Quality**: ESLint with custom rules, Prettier for formatting
- **Pre-commit Hooks**: Husky and lint-staged

### Project Structure

- `/src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with HTML structure and metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and Tailwind directives
- `/public/` - Static assets (SVG icons, images)
- Configuration files in root directory

### Key Architectural Patterns

- **App Router**: Pages are defined in the `/src/app` directory using file-based routing
- **Server Components**: Components are server-rendered by default unless marked with "use client"
- **CSS Architecture**: Tailwind CSS with utility-first approach, configured via PostCSS

### Development Notes

- The development server uses Turbopack for faster builds (`--turbopack` flag)
- Vitest is configured for testing with React Testing Library
- ESLint is configured with:
  - Next.js recommended rules
  - TypeScript strict typing (no-explicit-any enforced)
  - Accessibility rules (jsx-a11y)
  - Security and performance rules
  - Prettier integration for consistent formatting
- Pre-commit hooks automatically run linting and formatting via husky
- TypeScript strict mode is enabled in tsconfig.json
