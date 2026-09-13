# Raycast 보강 작업 결과 — 2026-09-10

## 작업 경계

실제 수정 위치는 `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`이다. 최초 확장 기준 `af13e51fb64eaaa181af89395000bbd6a9b88f2e`와 앞선 미커밋 수정분 위에 이번 보강을 적용했다. 앞선 표시/skip·파일 reader·공통 액션 정책·Review/Search 최초 구현은 이번 신규 성과로 계산하지 않는다.

Vesslo 원본은 읽기 전용으로 확인했다. 앱 Swift·프로젝트·공용 문서, 보호된 `UpdateCheckService.swift`, 이전 중단 앱 사본은 수정하지 않았다. 원본 nested 확장이나 사용자 설치본에도 반영하지 않았다.

## 이번에 보강한 동작

| 영역 | 이번 변경 |
|---|---|
| 데이터 계약 | 현재 Swift 공식과 updateCount/row visibility 비교, deleted/ignored/current-target-skip 모순 감지, contractMismatch 상태와 실행 제한. 없는 count를 0으로 만들지 않고 unverifiable로 표시. 알려진 action/eligibility enum을 정규화하고 unknown 원문은 별도로 보존. |
| 공통 표시 | 검증된 설치 앱 경로에 native fileIcon 사용, Base64 아이콘 렌더링 제거. source 이름·단복수·UTC 날짜 통일. 제어/bidi 문자와 표시 길이·이유 개수 제한. 감사 없는 앱도 업데이트/식별 메타데이터 표시. |
| 검색·태그 | 모든 검색 범위에 명시적인 일치 사유 텍스트. 정확한 태그의 native push, 뒤로 가기 시 부모 검색 범위·문구 유지. Work와 Work Extra가 섞이지 않음. |
| Review | 카테고리와 독립적인 전체/업데이트 대상 전환. 실제 감사 사유를 메타데이터보다 먼저 표시. 조회 전용 기본 액션 유지. |
| Updates | source/Needs Review 필터, 정렬 메뉴, 검색, 표시 수/visible 수/producer 선언 수 구분. 완료 검사 시각이 없다는 안내. |
| Bulk | 후보 검색, 현재 보이는 검토 목록 복사, 상세보기. 기존 개별 Update in Vesslo/Open/Finder 유지. 선택형 일괄 제출은 앱 API가 없어 제공하지 않음. |
| Deleted Apps | 여섯 번째 명령. 현재 export의 삭제 기록 검색·상세·Bundle ID/기록 경로 복사만 제공. 실제 앱 열기/Finder/update/delete/restore 액션 없음. 삭제 시각·사유는 미제공이라고 명시. |
| 데이터 다시 읽기 | 여섯 명령에 ⌘R. export 파일 재읽기이며 Vesslo 업데이트 검사 요청이 아님. |
| 개발 도구 | 필요한 동일 major 타입 패키지 갱신, skipLibCheck=false, macOS/Node 22.22.2 CI, 버전 변화에 대응하는 fixture provenance와 여섯 명령·12개 시나리오 검증. |

## 검증

최종 소스 기준 회귀 테스트 **138/138 통과**, dependency 포함 strict typecheck 및 여섯 명령의 distribution build가 통과했다. 과거 보고의 테스트 수를 이번 결과로 재사용하지 않았다.

### 자동 검증

- 실제 local clone에서 Node 22.22.2의 fresh `npm ci`와 lockfile 불변을 먼저 확인했다. 이후 최종 소스를 다시 덮어 검증할 때는 동일한 lockfile의 설치를 재사용했다.
- `npm run typecheck`, `npm run lint:source`, `npm test`(138/138), `npm run build:check`(6개 명령)가 모두 exit 0이다. 코드·실행·툴링 파일 57개의 SHA-256이 현재 작업 소스와 일치했다. [검증 manifest](../.agent/tooling-final-manifest.json), [전체 검증 로그](../.agent/tooling-final-validation.log).
- 작업 사본의 전체 `npm run lint`도 package.json·아이콘·metadata·ESLint·Prettier 검사를 통과했다. [전체 lint 로그](completion-lint.log).
- GitHub hosted CI 실행은 하지 않았다. workflow 파일과 로컬 동등 검증을 구분한다.
- fixture는 실제 command/component/hook 코드를 사용하면서 file reader와 외부 app/URL/Finder/Clipboard 액션을 무효화한다. 240-app polling, missing/malformed/stale/permission, count mismatch/unverifiable, exact tags와 literal text를 포함한다.

### 실제 Raycast

- 기존 두 Vesslo 등록과 구별되는 `[FIXTURE]` 등록만 사용했다. 각 runtime JS와 manifest를 검증된 fixture artifact와 SHA-256 대조한 뒤 확인했다.
- Search의 Bundle ID 일치 문구, 태그 push와 뒤로 가기 후 검색어 유지, Browse의 삭제 제외 집계, Bulk 안내와 기존 개별 업데이트 액션을 확인했다.
- Updates의 Sparkle 필터가 8개 export 중 1개만 표시하며 원래 export count는 8로 유지됨을 확인했다. ⌘I 상세와 ⌘R 재읽기를 확인했다.
- Review 전체/업데이트 대상 전환과 조회 전용 액션, 감사 사유 우선순위를 확인했다. Work 태그 결과가 Work Extra 전용 앱을 제외함을 실제 화면에서 확인했다.
- Deleted Apps의 실제 메뉴는 Copy Bundle ID, Copy Recorded Path, Reload Vesslo Data만 제공했다.
- count 9/visible 8 fixture에서 COUNT MISMATCH가 표시되고 개별 행은 Review in Vesslo로 제한됐으며 Update/Open/Finder 액션은 노출되지 않았다.
- Review 문자열은 실제 renderer에서 두 차례 보완했다. backslash escaping은 표시를 훼손했고 HTML entity 방식은 URL 자동 링크를 막지 못했다. 최종 구현은 내부 backtick보다 긴 delimiter를 쓰는 단일 code span이다. `[literal](https://example.invalid)`가 원문 텍스트로 표시되고 native accessibility tree에 link가 생성되지 않는 것을 확인했다. [최종 화면](completion-review-safe-text.png), [해당 runtime artifact hash](completion-native-code-hashes.json). 이전 display/literal hash 파일은 중간 재현 기록이며 최종 안전 표시의 증거로 쓰지 않는다.
- 실제 사용자 export를 사용하는 업데이트 실행은 하지 않았다. 앱 receipt·실제 설치 버전 변경·권한 허용/거부·실제 배포의 증거로 확대하지 않는다.
- 검증에 사용한 fixture 등록 5개는 Raycast 설정에서 `Uninstall but Keep Settings`로 모두 제거했다. 설정의 기존 Vesslo 등록 2개는 남아 있으며, 메인 검색에 fixture 명령이 남지 않은 것을 확인했다. 임시 develop 프로세스도 종료했다.
- 실제 사용자 `raycast_data.json` SHA-256은 검증 전후 `f1b14ca310eaf26eb85ecced23bf910ceaddc898acf6cde8009b58e00365c651`로 같았다. fixture 작업이 실제 export 내용을 바꾸지 않았다.

화면 증거는 `completion-*.png`, 설치 artifact 대조는 `completion-native-*-hashes.json`에 있다. 이 이미지는 실제 native fixture 검증 자료이며 Store 제출용 이미지로 취급하지 않는다.

## 이전 감사와 미완료 원인

사용자가 첨부한 감사의 직접 Homebrew/mas 실행 우회와 과거 skip이 새 target을 숨기는 문제는 앞선 확장 패치가 다룬 핵심 문제와 같다. 다만 해당 감사에는 count 계약, typed action, native 아이콘·탐색, 검색 일치 사유, 상태 필터, Deleted, strict typing·CI 등 추가 범위가 있었다. 앞선 완료 보고가 그 범위까지 끝난 것으로 읽히게 한 것은 부정확했다.

앱 사본의 중단은 앱 코드 소유권을 별도 담당으로 분리하는 지시 이후 Swift 구현을 멈춘 데서 생겼다. 그 사본의 미검증 변경 4개를 완료된 결과로 취급하지 않는다. 앱 계약을 기다려야 하는 항목과 확장에서 자체 완료할 수 있는 누락을 구분하지 못한 것이 미완료 보고의 문제였으며, 후자는 이번에 위 표처럼 구현·검증했다. 필수 앱 계약은 아래 프롬프트에 구현 범위와 반환물을 구체적으로 적었다.

## 남은 앱 계약과 전달

**선택형 Homebrew 일괄 실행 복구는 필수 미완료 항목이다.** 확장에 직접 실행을 다시 넣거나 all-source update-all로 대체하지 않았다. 현재 단건 generic URL도 source/target 고정과 receipt를 보장하지 못한다.

앱 담당에게 전달할 전체 프롬프트: [VESSLO_APP_HANDOFF_PROMPT.ko.md](VESSLO_APP_HANDOFF_PROMPT.ko.md).

반환받아야 할 사항은 정확한 대상의 앱 내부 Review/Handoff, schema/session/revision/check-completion export, request별 authoritative receipt와 Swift→JSON fixtures다. 이를 받은 후 확장 sender/consumer와 선택형 batch UI 연결이 필요하다. 현재 존재하지 않는 API를 호출하거나 지원된다고 표시하지 않았다.

Verification Activity, 삭제 시각/사유, 실제 업데이트 재검사 요청, 파일형식/UTI는 현재 공개 export에 없는 정보다. 삭제 기록 자체의 조회는 이번에 구현됐으며 나머지 계약과 구분한다.

## 배포 준비 경계

- 원본의 root/nested 이중 추적은 이번 clone에서 해결된 문제가 아니다. [REPOSITORY_DELIVERY.md](REPOSITORY_DELIVERY.md)의 전달 절차와 별도 앱 소유권 정리가 필요하다.
- Store의 기존 스크린샷은 변경하지 않았다. 앱 연동을 포함한 최종 동작이 정해진 뒤 제출용 화면을 다시 촬영해야 한다. native 검증 이미지를 임의 확대하거나 Store 규격을 충족한다고 주장하지 않는다. [Raycast 공식 Store 가이드](https://developers.raycast.com/basics/prepare-an-extension-for-store)는 2000×1250 PNG와 자체 Window Capture를 안내한다.
- README/CHANGELOG/manifest는 현재 로컬 기능과 제한을 반영했다. 게시된 Store 내용이나 사용자 설치 확장을 바꾼 것은 아니다.

**워킹 디렉토리에만 수정, 커밋 안 함.** commit/push/publish/release를 수행하지 않았다.
