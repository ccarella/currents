This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Git Workflow

This project follows a structured Git workflow to ensure code quality and maintain a clean history.

### Branch Strategy

- **main**: Production-ready code. Protected branch with restricted direct pushes.
- **feature/**: Feature branches for new functionality. Format: `feature/issue-{number}-short-description`
- **bugfix/**: Bug fix branches. Format: `bugfix/issue-{number}-short-description`
- **hotfix/**: Urgent fixes for production. Format: `hotfix/issue-{number}-short-description`

### Development Process

1. **Create an Issue**: Start by creating an issue using our templates
2. **Create a Branch**: Branch off from `main` using the naming convention above
3. **Make Changes**: Implement your changes with clear, atomic commits
4. **Run Tests**: Ensure all tests pass with `npm test && npm run test:e2e`
5. **Submit PR**: Create a pull request using our PR template
6. **Code Review**: Wait for review and address any feedback
7. **Merge**: Once approved, the PR will be merged to main

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only changes
- `style:` Code style changes (formatting, missing semicolons, etc)
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `perf:` Performance improvements
- `test:` Adding or updating tests
- `chore:` Changes to build process or auxiliary tools

Example: `feat: add user authentication flow`

### Branch Protection Rules

The `main` branch is protected with the following rules:

- Require pull request reviews before merging
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
