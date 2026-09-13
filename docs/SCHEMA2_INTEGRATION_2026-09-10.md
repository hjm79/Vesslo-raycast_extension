# Vesslo schema 2 확장 통합 결과 — 2026-09-10

## 결론과 기준

앱 담당이 반환한 A–C 계약에 맞춰 Raycast 확장의 **schema 2 소비자 → 정확한 Homebrew 대상 요청 → authoritative receipt 조회**를 구현하고 자동 검증을 완료했다. 이전 작업에서 앱 의존으로 남았던 선택형 Homebrew 요청과 결과 조회가 이제 확장 코드에 연결돼 있다.

- 확장 수정 위치: `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`
- 확장 기준: `af13e51fb64eaaa181af89395000bbd6a9b88f2e`와 앞선 미커밋 변경분.
- 앱 계약 위치: `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastIntegration.md`
- 앱 기준: `codex/vesslo-main-continuation` / `cad24187733387f545dd1b9793deacc02cfe8c8a`와 반환된 미커밋 구현.
- 앱 Swift·앱 프로젝트·공용 문서·보호 파일·원본/nested 저장소는 수정하지 않았다. 이전 확장 패치를 이번 신규 작업으로 계산하지 않는다.

## 원인과 수정

앞선 확장은 명시적 schema를 거부했고 generic Bundle ID 링크만 사용할 수 있었다. 앱에서 schema 2, scoped review v1, receipt v1을 확정함에 따라 새 생산자 데이터와 수신 인터페이스를 연결했다.

| 영역 | 이번 구현 |
| --- | --- |
| schema 2 | producer/session·safe integer revision·phase·완료 검사 시각·capability·row/count 검증. legacy는 조회만 허용하고 unknown 명시 schema는 거부. |
| 완료 검사 현재성 | ready, 완료 검사/check revision, checked inventory/current inventory가 일치해야 요청 가능. export 시각과 실제 검사 완료 시각을 분리하고 24시간 freshness 및 미래 시각 검증. JSON이 그대로여도 검사 시각 만료 시 화면 갱신. |
| 파일 읽기 | 기존 stat-first/강제 읽기/동시성 경계 유지. 같은 mtime/exportedAt의 revision 100→101 변경 감지, no-follow·bounded descriptor 읽기·UTF-8 검증. |
| Homebrew 단건·선택형 일괄 | 동일한 검토 화면을 사용. 1–16개 명시 대상과 선택 당시 snapshot 보존, 필터 변경으로 선택이 달라지지 않음. 제출 직전 강제 읽기로 session/inventory/check·UUID/Bundle ID/path/cask/installed/target/source/action 재검증. |
| 요청 transport | schema 1 JSON을 unpadded base64url로 인코딩해 `vesslo://review-homebrew/v1?payload=…`만 사용. 24 KiB payload/32 KiB URL/120초 수명과 중복·미래 시각 검사. URL open은 접수·완료가 아님. |
| receipt | 고정 private 파일의 schema 1 aggregate를 읽음. 원래 request와 ordered target identity, revision, phase/부분 결과, 만료·세션 이력 검증. accepted/running/verificationPending/completed/failed/rejected/cancelled를 구분. |
| Homebrew Requests | 일곱 번째 명령. 현재/이전 세션 요청, 대상별 결과, 만료 기록, 읽기 실패의 캐시를 구분하는 읽기 전용 조회. 실제 receipt 파일 쓰기·재시도·삭제·업데이트 액션 없음. |
| 추가 회귀 차단 | Brew-owned manual installer가 generic update로 빠지는 경로 차단. route와 source 불일치 차단, 비동기 읽기 뒤 source 집합 변경 검사. |

주요 수정 파일:

- 데이터: `src/types.ts`, `src/utils/data.ts`, `data-state.ts`, `data-reader.ts`.
- 요청: `src/utils/handoff-contract.ts`, `handoff-execution.ts`, `actions.ts`, `action-policy.ts`, `action-execution.ts`.
- UI: `src/components/HomebrewRequestReview.tsx`, `AppActions.tsx`, `SharedAppListItem.tsx`, `DataStateNotice.tsx`, `src/bulk-homebrew-update.tsx`, `src/updates.tsx`.
- receipt: `src/utils/receipt-contract.ts`, `receipt-reader.ts`, `useHandoffReceipts.ts`, `src/components/HandoffRequestStatus.tsx`, `src/handoff-requests.tsx`.
- 명령/검증/설명: `package.json`, generated `raycast-env.d.ts`, `tests`, `scripts/ui-fixture`, `README.md`, `CHANGELOG.md`, 인터페이스·fixture 문서.

## 검증 결과

Node **22.22.2**에서 최종 소스로 실행했다.

| 검사 | 결과 | 증거 |
| --- | --- | --- |
| 전체 회귀 테스트 | **207 passed / 0 failed / 0 skipped** | [tests.log](schema2-validation/tests.log) |
| dependency 포함 strict TypeScript | 통과 | [typecheck.log](schema2-validation/typecheck.log) |
| 전체 Raycast lint | package/icon/metadata/ESLint/Prettier 모두 통과 | [lint.log](schema2-validation/lint.log) |
| distribution build | **7개 명령 성공** | [build.log](schema2-validation/build.log) |
| 자동 UI fixture | 실제 command/component 코드, **7개 명령 × 16개 시나리오**, 외부 효과 무효화 | 위 전체 테스트 로그 |
| fixture provenance | 앱의 29 fixture/scenario + manifest, 총 30개 파일의 원본/복사본 SHA-256 일치 | `tests/fixtures/app-integration/provenance.json` |
| 소스 증거 | 코드·테스트·스크립트·설정 104개 hash와 참조한 앱 계약 hash | [manifest.json](schema2-validation/manifest.json) |
| diff | `git diff --check` 통과 | 현재 작업 사본 |

검사에는 제공된 export fixture 13개, old-skip/new-target, unknown action, 중복 Bundle ID/다른 경로, checking/failed/unverified, 동일 mtime의 revision 변경, malformed/permission, count 불일치가 포함된다. sender는 1–16/중복·크기·만료·원래 선택의 비동기 보존과 새 파일 대조를 검사한다. receipt는 정상 진행 sequence와 별도 실패/거부/취소/재시작 snapshot, identity·property 순서·UUID case·날짜 정규화, revision rollback, terminal 변경, 부분 실패, expiry, hook unmount를 검사한다.

Node 파일 I/O 검사는 private 임시 파일에서 regular-file 읽기와 symlink/hardlink 거부를 확인하고 정리했다. 실제 앱 TCC 허용/거부를 실행한 것으로 확대하지 않는다. GitHub hosted CI 실행과 Swift 빌드/테스트 재실행도 이번 결과에 포함하지 않는다. 사용자가 전달한 앱 테스트 결과는 별도 앱 작업의 증거다.

## 실제 화면 및 설치본 경계

새 통합 화면의 Raycast 실기 확인은 시도했으나 **Mac이 잠겨 CUA가 접근하지 못했다**. 따라서 이번 통합의 native UI 확인은 미실행이다. 검증 fixture는 준비/자동 실행만 했으며 Raycast에 등록하지 않았다. 사용하지 않은 native staging 사본은 정리했고 검증 artifact는 보존했다.

앞선 작업의 native screenshots는 이전 기능의 증거이며 이번 schema 2/receipt 화면 통과 근거로 재사용하지 않는다. 실제 앱의 요청 접수/확인/실행/검증, UI/TCC/Terminal/Installer/재시작도 이번 세션에서 수행하지 않았다.

실제 `raycast_data.json`은 작업 전후 SHA-256 `f1b14ca310eaf26eb85ecced23bf910ceaddc898acf6cde8009b58e00365c651`로 같았다. 실제 `raycast_receipts.json`은 전후 모두 없었다. 앱/확장 설치본을 교체하거나 실제 앱 업데이트를 실행하지 않았다.

## 남은 제한과 적용 순서

1. 현재 sender는 `runBrew / executableUpdate.homebrew / Brew`만 선택한다. Brew-owned manual installer는 Vesslo에서 검토하도록 남겨두고 generic update 경로로 우회하지 않는다.
2. Homebrew 이외의 기존 generic update route는 sender 상태/source 검사 후 유지되지만, 그 경로가 source 고정이나 새 receipt를 보장한다는 뜻은 아니다.
3. ready는 전체 검사 loop 완료이며 모든 원격 source 성공 보증이 아니다. 기존 row source-health 상태도 확인해야 한다.
4. 일반 Verification Activity, 삭제 시각/사유/복구, 실제 앱 재검사 API, 파일 확장자/UTI는 여전히 공개 계약이 없다. `⌘R`은 파일 재읽기다.
5. 지원하지 않는 request schema/source를 가진 다른 sender의 rejection receipt가 aggregate에 포함되면 전체 파일을 명시적 malformed로 처리한다. 성공으로 재분류하거나 캐시로 확인을 대체하지 않는다.
6. 앱과 확장의 compatible working copies를 실제로 반영한 뒤 native UI/TCC/실행·재시작 검증이 필요하다. Store 이미지 갱신·root/nested Git 소유권 정리·hosted CI·publication은 별도 배포 단계다.

앱 A–C 계약을 다시 구현하라고 넘길 단계는 끝났다. 다음 적용 단계는 양쪽 변경의 반영과 실기 검증이다. 현재 앱 작업에 추가 소스 수정을 요청해야 할 확정 blocker는 이번 통합에서 발견되지 않았다.

**워킹 디렉토리에만 수정, 커밋 안 함.** commit/push/publish/release 및 설치본 교체는 수행하지 않았다.
