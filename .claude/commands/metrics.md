# /metrics - Agent Performance Metrics

에이전트 사용 통계 및 세션 메트릭을 수집하고 리포트합니다.

## Instructions

You are the **Metrics Agent**. 에이전트 활용 데이터를 분석하여 인사이트를 제공합니다.

### Usage

```
/metrics [action] [--period=PERIOD]
```

### Actions

| Action | Description |
|--------|-------------|
| (none) | 현재 세션 메트릭 요약 |
| `report` | 누적 메트릭 리포트 |
| `reset` | 메트릭 데이터 초기화 |

### Options

- `--period`: 기간 필터 (`today`, `week`, `month`, `all`)

---

## Step 1: Collect Session Metrics

현재 세션의 활동을 분석합니다:

**수집 데이터**:
```bash
# Git 기반 세션 활동
git log --oneline --since="today"        # 오늘 커밋
git diff --stat HEAD                      # 변경된 파일
git log --format="%H" --since="today" | wc -l  # 커밋 수
```

**세션 메트릭 항목**:

| 메트릭 | 설명 | 수집 방법 |
|--------|------|----------|
| `commands_run` | 실행된 커맨드 수 | session-context.json |
| `files_modified` | 수정된 파일 수 | git diff --stat |
| `lines_added` | 추가된 라인 | git diff --stat |
| `lines_removed` | 삭제된 라인 | git diff --stat |
| `commits_made` | 커밋 횟수 | git log |
| `agents_used` | 사용된 에이전트 | session-context.json |
| `issues_found` | 발견된 이슈 | session-context.json |
| `tests_run` | 실행된 테스트 | session-context.json |

---

## Step 2: Read Cumulative Metrics

`~/.claude/state/metrics.json` 또는 `.claude/state/metrics.json`에서 누적 데이터를 읽습니다.

### Metrics Storage Schema

```json
{
  "version": "1.0",
  "sessions": [
    {
      "date": "2025-01-15",
      "project": "project-name",
      "duration": "estimated",
      "commands": {
        "/init": 1,
        "/test": 3,
        "/review": 2,
        "/wrap": 1
      },
      "agents": {
        "explorer": 2,
        "tester": 3,
        "reviewer": 2
      },
      "files": {
        "modified": 12,
        "created": 3,
        "deleted": 1
      },
      "lines": {
        "added": 450,
        "removed": 120
      },
      "quality": {
        "issues_found": 5,
        "issues_fixed": 4,
        "tests_run": 45,
        "tests_passed": 43
      }
    }
  ],
  "totals": {
    "sessions": 0,
    "commands": 0,
    "files_modified": 0,
    "lines_added": 0,
    "lines_removed": 0,
    "issues_found": 0,
    "tests_run": 0
  }
}
```

---

## Step 3: Generate Report

### Default Output (현재 세션)

```
## 세션 메트릭

**프로젝트**: [name]
**날짜**: [date]

### 활동 요약

| 항목 | 수치 |
|------|------|
| 실행 커맨드 | N회 |
| 사용 에이전트 | N개 |
| 수정 파일 | N개 |
| 추가 라인 | +N |
| 삭제 라인 | -N |
| 커밋 | N회 |

### 커맨드 사용 빈도

| 커맨드 | 횟수 | ██████████ |
|--------|------|-----------|
| /test | 5 | ██████████ |
| /review | 3 | ██████ |
| /init | 1 | ██ |

### 에이전트 활용

| 에이전트 | 횟수 | 역할 |
|---------|------|------|
| Tester | 5 | 테스트 실행/생성 |
| Reviewer | 3 | 코드 리뷰 |
| Explorer | 2 | 탐색/분석 |
```

### Report Output (누적 리포트)

```
## 누적 메트릭 리포트

**기간**: [period]
**총 세션**: N회

### 전체 통계

| 항목 | 합계 | 세션 평균 |
|------|------|----------|
| 커맨드 실행 | N | N/session |
| 파일 수정 | N | N/session |
| 라인 변경 | +N/-N | +N/-N/session |
| 이슈 발견 | N | N/session |
| 테스트 실행 | N | N/session |

### 커맨드 사용 트렌드

| 커맨드 | 총 사용 | 가장 많이 쓴 날 |
|--------|--------|----------------|
| /test | N | [date] |
| /review | N | [date] |

### 에이전트 활용 분석

| 에이전트 | 사용 비율 | 추천 |
|---------|----------|------|
| Tester | 40% | 가장 많이 활용 |
| Reviewer | 25% | - |
| Explorer | 15% | - |
| (미사용) | - | 활용 검토 권장 |

### 생산성 지표

- **코드 변경 효율**: +N/-N (순 추가 N라인)
- **이슈 해결률**: N/N (N%)
- **테스트 통과율**: N/N (N%)

### 활용 제안

- [가장 자주 쓰는 패턴에 대한 자동화 제안]
- [미사용 에이전트 활용 권장]
- [워크플로우 개선 제안]
```

---

## Step 4: Save Metrics

현재 세션 메트릭을 저장합니다:

1. `session-context.json`에서 세션 데이터 읽기
2. `metrics.json`에 세션 기록 추가
3. `totals` 업데이트

---

## Examples

**현재 세션 메트릭 보기**:
```
/metrics
```

**누적 리포트 (이번 주)**:
```
/metrics report --period=week
```

**전체 리포트**:
```
/metrics report --period=all
```

**메트릭 초기화**:
```
/metrics reset
```

## Notes

- 메트릭은 `~/.claude/state/metrics.json`에 저장
- `/wrap` 실행 시 자동으로 세션 메트릭 기록
- `/init` 실행 시 세션 시작 시간 기록
- 민감한 정보(코드 내용, 파일 경로 등)는 저장하지 않음
- `--period` 미지정 시 현재 세션만 표시
