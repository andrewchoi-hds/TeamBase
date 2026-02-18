# /init - Project Initialization

Analyze the current project and set up session context.

## Instructions

You are the **Explorer Agent**. Perform a comprehensive project analysis.

### Step 0: Detect Workspace Type

먼저 워크스페이스 유형을 감지합니다:

**모노레포 감지**:
- `pnpm-workspace.yaml` → pnpm workspaces
- `lerna.json` → Lerna monorepo
- `nx.json` → Nx monorepo
- `turbo.json` → Turborepo
- `package.json`의 `workspaces` 필드 → npm/yarn workspaces
- `packages/`, `apps/`, `libs/` 디렉토리 패턴

**멀티 프로젝트 감지**:
- 루트에 여러 `package.json` (중첩)
- 여러 `pyproject.toml` (중첩)
- `docker-compose.yml`에 여러 서비스

**감지 결과에 따른 분기**:
- 모노레포 → 각 패키지를 개별 분석 + 루트 설정 분석
- 멀티 프로젝트 → 각 프로젝트를 개별 분석
- 단일 프로젝트 → 기존 Step 1부터 진행

**모노레포 출력 형식**:
```
## Workspace Analysis Complete

**Type**: Monorepo ([tool name])
**Root**: [workspace root]

### Packages

| Package | Path | Type | Framework |
|---------|------|------|-----------|
| @app/web | apps/web | Frontend | Next.js |
| @app/api | apps/api | Backend | Express |
| @lib/ui | packages/ui | Library | React |
| @lib/utils | packages/utils | Library | TypeScript |

### Shared Configuration
- **Root tsconfig**: extends to all packages
- **Shared dependencies**: [list]
- **Build tool**: [turbo/nx/lerna]

### Commands
- **Build all**: `turbo build`
- **Test all**: `turbo test`
- **Dev (specific)**: `turbo dev --filter=@app/web`
```

### Step 1: Detect Project Root Files

Search for these files in the current directory:

**Package Managers & Build Tools:**
- `package.json` (Node.js/JavaScript/TypeScript)
- `pyproject.toml`, `setup.py`, `requirements.txt` (Python)
- `Cargo.toml` (Rust)
- `go.mod` (Go)
- `pom.xml`, `build.gradle` (Java/Kotlin)
- `Gemfile` (Ruby)
- `composer.json` (PHP)

**Configuration Files:**
- `tsconfig.json`, `jsconfig.json`
- `.eslintrc.*`, `.prettierrc.*`
- `vite.config.*`, `webpack.config.*`, `next.config.*`, `nuxt.config.*`
- `tailwind.config.*`
- `docker-compose.yml`, `Dockerfile`
- `.github/workflows/`

**Documentation:**
- `README.md`, `CLAUDE.md`
- `.env.example`

### Step 2: Analyze Dependencies

If `package.json` exists, check dependencies for:
- **Frontend**: react, vue, svelte, angular, next, nuxt, solid
- **Mobile**: react-native, expo
- **Backend**: express, fastify, nestjs, hono, koa
- **Testing**: jest, vitest, mocha, playwright, cypress
- **Styling**: tailwindcss, styled-components, emotion

If `pyproject.toml` or `requirements.txt` exists, check for:
- **Backend**: fastapi, django, flask, starlette
- **Data/ML**: pandas, numpy, torch, tensorflow, scikit-learn
- **Testing**: pytest

### Step 3: Detect Directory Structure

Check for presence of:
- `src/`, `app/`, `pages/`, `components/` → Frontend patterns
- `routes/`, `controllers/`, `services/`, `models/` → Backend patterns
- `ios/`, `android/` → Mobile patterns
- `.storybook/`, `design-tokens/`, `theme/` → Design system
- `notebooks/`, `models/`, `data/` → Data/ML patterns
- `k8s/`, `terraform/`, `ansible/` → DevOps/Infra
- `.github/ISSUE_TEMPLATE/`, `CHANGELOG.md` → PM patterns

### Step 4: Determine Domain

Based on analysis, assign:
- **Primary Domain**: The main focus of the project
- **Secondary Domain(s)**: Supporting aspects

### Step 5: Extract Commands

From package.json scripts or detected tools:
- Test command
- Build command
- Lint command
- Dev/Start command

### Step 6: Output Format

Present the results in this exact format:

```
## Project Analysis Complete

**Project**: [project name from package.json or directory name]
**Path**: [current working directory]

### Tech Stack
- **Language**: [primary language]
- **Framework**: [main framework]
- **Runtime**: [Node.js version, Python version, etc. if detectable]

### Domain Classification
- **Primary**: [Frontend | Backend | Mobile | Data/ML | DevOps | Design]
- **Secondary**: [list or "None"]

### Commands
- **Test**: `[test command]`
- **Build**: `[build command]`
- **Lint**: `[lint command]`
- **Dev**: `[dev command]`

### Key Files
- **Entry Point**: [main file path]
- **Config**: [list key config files]

### Directory Structure (depth 2)
[brief tree structure of main directories]
```

## Options

- `--deep`: Perform deeper analysis including dependency tree and file counts

## Error Handling

If no recognizable project files found:
```
## Error: UNSUPPORTED

Could not detect project type.

### Cause
No recognized package manager or build tool configuration found.

### Solution
1. Ensure you're in the project root directory
2. Create a package.json, pyproject.toml, or other config file
3. Manually specify the project type

### Alternative
Run `/map` to see the directory structure and identify project files manually.
```

## Step 7: Save Session Context

분석 결과를 `session-context.json`에 저장하여 다른 커맨드/에이전트와 공유합니다.

**저장 경로**: `.claude/state/session-context.json` (프로젝트) 또는 `~/.claude/state/session-context.json` (글로벌)

**저장 형식**:
```json
{
  "version": "2.0",
  "lastUpdated": "2025-01-15T10:00:00Z",
  "project": {
    "name": "detected-project-name",
    "path": "/current/working/directory",
    "language": "detected-language",
    "framework": "detected-framework",
    "runtime": "detected-runtime"
  },
  "domains": {
    "primary": "detected-primary-domain",
    "secondary": ["detected-secondary-domains"]
  },
  "commands": {
    "test": "detected-test-command",
    "build": "detected-build-command",
    "lint": "detected-lint-command",
    "dev": "detected-dev-command"
  },
  "structure": {
    "entryPoint": "detected-entry-point",
    "configFiles": ["list-of-config-files"],
    "srcDir": "detected-src-directory",
    "testDir": "detected-test-directory"
  },
  "session": {
    "startedAt": "current-timestamp",
    "commandsRun": ["/init"],
    "filesModified": [],
    "agentsUsed": ["explorer"]
  },
  "metrics": {
    "commandCount": 1,
    "filesAnalyzed": 0,
    "issuesFound": 0,
    "testsRun": 0
  }
}
```

## Notes

- This analysis sets the context for all subsequent commands
- Domain detection affects which specialized advice is given
- Detected commands are used by /test, /build, etc.
- Session context is shared with all agents via session-context.json
- Other commands read this context to avoid re-detecting project info
