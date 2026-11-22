# Raycast UI 보강 완료 기록 — 2026-10-02

## 적용 상태

- 작업 기준: `raycast-store-submission-work`, HEAD `96bcbd0a2dfe480b46d830af9721e1ebe3d4fd74`.
- 앱 상세 정리, 선택한 Homebrew 후보 필터, 요청 상태 필터, Raycast API 2.6.1 갱신 완료.
- 현재 Mac의 `/Users/hjm/.config/raycast/extensions/vesslo`에 최종 빌드 적용 완료.
- 공개 Store 배포, 새 PR 제출, Vesslo 본체 변경은 이번 작업에 포함하지 않았다.
- **워킹 디렉토리에만 수정, 커밋 안 함.**
- 2026-11-22: 원본 저장소 `vesslo-raycast`의 `raycast/ui-enhancements-20261002` 브랜치에 커밋으로 보존했다(`0649be3`). Store에는 아직 올리지 않았다. [이관 기록](HANDOFF_2026-11-22.ko.md)

## 사용자에게 보이는 변화

| 화면 | 변경 |
| --- | --- |
| 앱 상세 | 설치/목표 버전, 소스, cask, Bundle ID, 경로, 개발자를 Raycast 기본 정보 표로 표시한다. 경고와 검토 사유는 본문에 유지한다. |
| 앱의 Actions | `View App Details`로 별도 상세 화면을 열 수 있다. 기존 기본 액션과 복사 기능을 유지한다. |
| Bulk Homebrew Update | `All Candidates / Selected Only`를 제공한다. 선택한 앱만 모아 확인하거나 해제할 수 있다. 전체·선택·표시 개수를 함께 표시한다. |
| Selected Only | 진입 시 검색어만 비워 숨겨진 선택을 모두 보여 준다. 선택은 유지한다. 이후 검색도 선택을 변경하지 않는다. 선택이 없으면 안내와 전체 목록 복귀 액션을 표시한다. |
| Homebrew Requests | 전체, 검토 대기, 실행 중, 검증 대기, 실패, 완료, 거절, 취소로 기록을 좁힌다. 검색과 상태 필터를 함께 적용하며 초기화 액션을 제공한다. |
| 과거 요청 표시 | 이전 세션의 완료 기록을 현재 확인 결과로 표시하지 않는다. 이전 세션·미확인 세션·만료·캐시 기록의 경고를 유지한다. |
| 개발 기반 | `@raycast/api`를 2.5.1에서 2.6.1로 갱신했다. 잠금 파일에서 API 패키지만 변경됐다. |

요청 상태 필터는 요청 전체에 기록된 상태를 기준으로 한다. 일부 대상만 성공한 실패 요청을 Completed로 분류하지 않는다. 선택 후 전송 시 대상 재검증, 최대 16개 제한, Vesslo의 실행 확인과 검증 계약은 유지한다.

## 검증 결과

### 자동 검증

- 전체 테스트 345개 중 최초 실행 344개 통과. 나머지 1개는 테스트가 홈 디렉터리에 만드는 격리 임시 폴더에 대한 실행 환경의 `EPERM`으로 실패했다.
- 해당 테스트만 필요한 파일 접근 범위로 다시 실행하여 1/1 통과했다. 따라서 345개 테스트를 모두 확인했으며, 단일 전체 실행이 345/345였다고 기록하지 않는다.
- 실제 화면 확인 후 상세 본문 간소화: 관련 테스트 15/15 통과.
- 실제 화면 확인 후 Bulk 하단 제목 간소화: 관련 테스트 5/5 통과.
- 공식 Raycast lint(메타데이터, 아이콘, ESLint, Prettier 포함) 통과. 마지막 UI 수정 후 소스 lint와 변경 TypeScript 파일의 Prettier 검사도 통과.
- 최종 7개 명령 TypeScript 검사·빌드 성공. `build:check`와 로컬 설치 빌드 모두 성공.
- 최종 산출물과 설치본의 실행 JavaScript 7개, package.json, plugin.json, 아이콘 등 10개 파일 해시가 모두 일치한다. 소스맵은 출력 위치에 따른 source 경로 차이가 있어 실행 파일 비교 대상에서 제외했다.

증거는 `.agent/ui-enhancements-2026-10-02/`에 보관한다. 이 디렉터리는 공개 배포 자료가 아니다.

| 증거 | 파일 |
| --- | --- |
| 전체 테스트 | `tests.log` |
| 파일 접근 제한에 걸린 단일 테스트 재확인 | `receipt-reader-recheck.log` |
| 공식 lint | `lint.log` |
| 최종 검증 빌드 | `build-final.log` |
| 최종 로컬 설치 빌드 | `install-build-final.log` |
| 설치본 최종 해시 비교 | `installed-runtime-final.json` |
| 설치 전 전체 17개 런타임 파일 보존 | `installed-runtime-before/`, `installed-runtime-before.json` |

### 실제 Raycast 화면

1. 실제 Vesslo 데이터로 목록 상세와 `View App Details` 별도 화면의 정보 표, 경고 표시, 뒤로가기 동작을 확인했다. Bulk 하단 제목은 `Bulk Homebrew Update`로 짧게 유지한다.
2. 실제 Homebrew Requests의 과거 기록 4개에서 Completed 필터로 1개만 표시됨을 확인했다. 만료 기록의 경고가 유지됐다. 결과 없는 검색에서 `Clear Request Filters`를 실행하면 검색어와 상태가 함께 초기화되고 4개 기록으로 돌아왔다.
3. 실행 액션이 없는 합성 데이터의 실제 Raycast 화면에서 후보 5개 중 2개 선택 → 검색으로 1개 표시 → Selected Only 진입 시 검색 초기화 및 2개 표시 → 개별 해제로 0개 → 전체 후보 5개 복귀를 확인했다. 검색 중 선택 보존과 빈 화면 복구를 확인한 것이다.
4. 마지막 제목 변경은 표시 문자열만 바꿨으며 선택 시나리오 전체를 반복하지 않았다. 최종 로컬 빌드에서 짧은 제목과 상세 화면을 다시 확인했다.
5. 임시 확장 `[FIXTURE] Vesslo schema3-ready muqxstrk`의 개발 프로세스를 종료하고 Raycast에서 제거했다. 검색 결과와 설치 디렉터리에서 제거를 확인했다. 재생성 가능한 검증 원본은 작업 디렉터리에 보관했다.

## 변경 파일

- 사용자 UI: `src/components/AppDetail.tsx`(신규), `AppActions.tsx`, `SharedAppListItem.tsx`, `src/utils/audit-warning.ts`, `src/bulk-homebrew-update.tsx`, `src/handoff-requests.tsx`, `src/utils/receipt-filter.ts`(신규).
- 의존성: `package.json`, `package-lock.json`.
- 회귀 검증: `tests/app-detail.test.cjs`, `tests/bulk-selection-filter.test.cjs`, `tests/receipt-filter.test.cjs`(신규), `tests/command-actions.test.cjs`, `tests/receipt-ui.test.cjs`, `tests/ui-fixture.test.cjs`.
- 격리 화면 검증 지원: `scripts/ui-fixture/api.tsx`, `common.cjs`, `runtime.cjs`. Native Metadata를 허용하고 기존 비실행 액션 경계를 유지한다. Metadata.Link는 계속 허용하지 않는다.
- 문서: `README.md`, `CHANGELOG.md`, 이 문서. 기존 변경 이력은 보존하고 이전 공개 버전의 확정 날짜를 반영했다.

## 검증 범위와 후속 단계

현재 요청한 UI 보강과 로컬 적용에는 미완료 항목이 없다. 이번 작업은 화면·검색·선택·표시 개선이며, 실제 앱 설치/업데이트 또는 새로운 Vesslo 요청 전송은 실행하지 않았다.

실제 로컬 export는 24시간이 지난 상태였다. 확장은 이를 정확히 표시하고 새 실행을 제한한다. 이 안내는 UI 오류가 아니며, 실행 가능한 최신 목록이 필요하면 Vesslo에서 데이터를 갱신해야 한다. 이를 위해 기존에 완료된 앱 실행 검증 전체를 다시 수행하지 않았다.

공개 반영을 진행할 때는 이번 변경의 커밋 정리와 별도 업데이트 PR 제출이 후속 단계다. 공개 심사·Store 배포 완료로 해석하지 않는다. 사용자가 촬영한 기존 Store 스크린샷은 변경하지 않았으며, 이번 자동 조작 화면을 공개 자료로 올리지 않았다.
