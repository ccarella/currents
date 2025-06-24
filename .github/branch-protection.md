# Branch Protection Configuration

This document outlines the branch protection rules that should be configured on GitHub for the main branch.

## Configuration Steps

1. Go to Settings > Branches in your GitHub repository
2. Add a branch protection rule for `main`
3. Configure the following settings:

### Required Settings

- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from CODEOWNERS (if applicable)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Add these status checks (when CI/CD is configured):
    - `test`
    - `lint`
    - `type-check`
    - `build`

- ✅ **Require conversation resolution before merging**

- ✅ **Include administrators**
  - This ensures even repository admins follow the same workflow

### Optional Settings (Recommended)

- ✅ **Require linear history**
  - Prevents merge commits in favor of rebase/squash

- ✅ **Require deployments to succeed before merging** (when deployments are configured)

- ✅ **Lock branch**
  - Only enable for archived or deprecated branches

- ✅ **Allow force pushes**
  - ❌ Should remain disabled for main branch

## Enforcement

These rules ensure:

1. All code is reviewed before merging
2. Tests and checks pass before code reaches main
3. The main branch remains stable and deployable
4. Clear audit trail of all changes

## Exceptions

In emergency situations, administrators can temporarily disable protection rules. This should be:

- Documented in the PR description
- Re-enabled immediately after the emergency fix
- Reviewed in the next team meeting
