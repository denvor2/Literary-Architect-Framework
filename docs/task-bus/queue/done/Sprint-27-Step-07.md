# Sprint-27-Step-07: Full validation

id: Sprint-27-Step-07
name: Full validation
type: validation

scope:
  allowed_paths:
    - apps/studio/src/**
    - apps/studio/prisma/**
    - docs/project/**
    - scripts/**
    - nginx/**
    - .env.example
    - .gitignore
  forbidden_paths:
    - .git/**

objective: Run final validation suite on all changes from Steps 01-06 to confirm TypeScript, ESLint, Prettier, and production build pass without errors or warnings.

inputs:
  - All ARP outputs from Sprint-27-Step-01 through Sprint-27-Step-06
  - Completed implementations of all 6 prior steps

outputs:
  - Validation summary report in ARP file

validation:
  - npx tsc --noEmit (TypeScript type checking with no errors)
  - npx eslint src/ (linting with no errors or warnings)
  - npx prettier --check . (code formatting verification)
  - npm run build (production build succeeds)

done_when:
  - All 4 validation commands pass with zero errors
  - ARP file created in docs/task-bus/queue/active/ documenting each validation step and its output
  - ready for architect-reviewer and tester gates
