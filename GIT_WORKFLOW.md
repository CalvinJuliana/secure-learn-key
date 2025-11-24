# Git Workflow Guide

## Quick Push to GitHub

### Method 1: Using the Script (Recommended)

```powershell
# Simple push with default message
.\git-push.ps1

# Or with custom message
.\git-push.ps1 -Message "Your commit message here"
```

### Method 2: Manual Commands

```powershell
# 1. Add all changes
git add .

# 2. Commit with a message
git commit -m "Your commit message"

# 3. Push to GitHub
git push origin main
```

## Automatic Push Setup (Optional)

### Option A: Git Hooks (Pre-commit)

Create `.git/hooks/pre-commit` to automatically format code before commit.

### Option B: VS Code Tasks

Add to `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Git Push",
            "type": "shell",
            "command": "powershell",
            "args": ["-File", "${workspaceFolder}/git-push.ps1"],
            "problemMatcher": []
        }
    ]
}
```

## Important Notes

1. **Never commit sensitive files:**
   - `.env.local`
   - `*.key`
   - Private keys
   - Personal Access Tokens

2. **Always check before pushing:**
   ```powershell
   git status
   ```

3. **If you need to update the remote URL:**
   ```powershell
   git remote set-url origin https://YOUR_TOKEN@github.com/CalvinJuliana/secure-learn-key.git
   ```

## Common Commands

```powershell
# Check status
git status

# See what changed
git diff

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

