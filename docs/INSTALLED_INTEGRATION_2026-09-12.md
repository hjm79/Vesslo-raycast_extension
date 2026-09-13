# Vesslo / Raycast 실제 설치 연동 결과 — 2026-09-12

**Vesslo 설치본과 Raycast 확장의 로컬 교체를 완료했다.** 실제 운영 export를 최신 확장에서 읽고 7개 명령의 화면을 확인했다. 운영 Homebrew 검토·취소 receipt·실제 업데이트는 앱의 전역 `failed/sourceFailure` 정책 때문에 아직 검증하지 못했다. 이 문서는 이전의 격리 fixture·native harness 결과와 이번 설치 결과를 구분한다.

## 1. 원인과 이번 작업 범위

이전 A–C와 확장 기능 구현은 작업본에 있었지만, 당시 설치본·Raycast 등록에 반영된 사실을 입증하지 못했다. 이번 작업에서 앱의 현재 dirty 소스를 새로 archive/export하고 `/Applications/Vesslo.app` 전체 번들을 교체했다. Raycast는 최신 개발 등록을 갱신한 뒤 구버전 UUID 등록을 설정 보존 옵션으로 제거했다.

| 범위               | 실제 기준                                                                     |
| ------------------ | ----------------------------------------------------------------------------- |
| 앱 작업본          | `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`                    |
| 앱 HEAD            | `cad24187733387f545dd1b9793deacc02cfe8c8a` / `codex/vesslo-main-continuation` |
| 확장 작업본        | `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`              |
| 확장 HEAD          | `af13e51fb64eaaa181af89395000bbd6a9b88f2e` / detached                         |
| 설치 대상          | `/Applications/Vesslo.app`, `/Users/hjm/.config/raycast/extensions/vesslo`    |
| 실행 증거 디렉터리 | `/private/tmp/VessloInstalledIntegration-20260912-k001xumy`                   |

앱 소스 767개는 이번 설치 전후 내용이 동일하다. 보호된 `UpdateCheckService.swift`도 변경하지 않았다. 기존 dirty 구현을 새로 구현한 것으로 보고하지 않는다. 원본 앱 저장소 650개 파일과 원본 Raycast 저장소 29개 파일의 기존 내용 및 HEAD도 유지했다.

## 2. 설치 결과와 기능 변화

### Vesslo 앱

- A–C 구현을 포함한 universal `arm64` + `x86_64` Release archive/export를 새로 생성했다.
- Developer ID Application 서명과 hardened runtime, 중첩 Sparkle/helper 서명을 검증했다. Team ID는 `54V3JMN338`이다.
- 설치본의 70개 파일·심볼릭 링크가 검증한 export artifact와 일치한다.
- Bundle ID는 `top.hjm79.Vesslo`, 표시는 `2.0.1 (28)` 그대로다. 버전 문자열만으로 이번 패치 적용 여부를 구분할 수 없다.
- 실행 파일 SHA-256: `614f8e13d8e910cb975f0889132df7824508304cbf1ad84b69808e8ce4c9842b`.
- 실제 실행 경로와 `vesslo://` 기본 해석 경로는 모두 `/Applications/Vesslo.app`이다. 빌드가 임시로 등록한 이번 archive의 앱·Updater 두 경로만 해제했고, 해석 경로를 다시 확인했다.
- 실제 컴파일 입력에서 A–C 소스 포함, Test harness 제외를 확인했다. Release 바이너리에서도 harness·합성 fixture 흔적을 검사했다.

### Raycast 확장

최종 등록은 `hjm79/vesslo` 한 개다. 별도의 구버전 UUID 등록 `b5fe074b-8abe-48c4-ad54-889fd270f4cf`는 **Uninstall but Keep Settings**로 제거했다. 해당 UUID를 Store 설치라고 단정할 증거는 없다. 활성 확장에는 아래 7개 명령이 있고, 실제 런타임 16개 파일의 SHA-256이 최신 `dist`와 모두 일치한다. 개발 watcher를 종료했고 `cli.pid`도 없다. 확장 버전 표시는 기존 `1.1.0`을 유지했다.

| 명령                 | 바뀐 기능과 이번 실제 화면 확인                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Search Apps          | schema 2의 검사 상태를 반영하며 설치 앱 201개를 조회한다. 실패 상태의 Review Only 안내를 확인했다.                                  |
| View Updates         | source별 목록과 실제 검사 완료 시각을 표시한다. 표시 83개·export 83개·Vesslo count 83개가 일치했다.                                 |
| Bulk Homebrew Update | 정확한 대상 선택과 최대 16개 검토 흐름을 제공한다. 현재 49개 후보는 검사 실패로 실행이 차단되고 0개 선택 상태였다.                  |
| Browse by Tag        | 운영 태그 8개와 각 앱 수를 표시했다.                                                                                                |
| Review Apps          | 새 명령. 검토 사유가 있는 앱 122개와 필터를 표시했다.                                                                               |
| Deleted Apps         | 새 명령. 삭제 기록 11개를 읽기 전용으로 표시했다.                                                                                   |
| Homebrew Requests    | 새 명령. 요청 receipt를 읽고 원래 대상별 결과를 표시하는 기능이다. 이번에는 실제 요청이 없으므로 receipt 파일 없음 안내를 확인했다. |

7개 명령을 실제 Raycast에서 각각 열었다. 모든 액션·필터 조합을 운영 데이터에서 전수 검증했다는 의미는 아니다. 앱 목록·스크린샷·AX 원문은 공개 fixture에 넣지 않고 위 실행 증거 디렉터리에 보관했다.

## 3. 새로 확인한 운영 차단 원인

새 앱은 schema 2와 `homebrewReviewV1`, `requestReceiptsV1`을 게시한다. 첫 전체 검사는 2026-09-12 19:56:02 KST에 완료되었고 `completedCheckRevision == checkRevision == 1`이다. 그러나 같은 검사에서 아래 source 실패를 관측했다.

- Luminar Neo Sparkle: HTTPS 요구 정책에 의해 feed 차단.
- Vesslo Sparkle: HTTP 비성공 응답.

`RaycastExportLifecycle.hasFailure`는 이 실패를 전체 검사 상태에 합산하고 `RaycastExportState.finishCheck`는 `failed/sourceFailure`를 게시한다. `checkedInventoryRevision`도 생략된다. 앱 receiver와 확장 모두 전체 `ready`를 요구하므로, 두 Sparkle 실패와 무관한 Homebrew 후보까지 검토할 수 없다.

실제 마지막 확인 값은 session `306D59A6-3BB2-4E7A-8B90-D01ACDC50091`, inventory revision `59`, export revision `245`였다. export의 212개 기록은 설치 앱 201개 + 삭제 기록 11개이며 count 불일치가 아니다. 전체 검사가 중단됐거나 inventory가 바뀌어 발생한 실패로 추정하지 않았다.

앱 계약 문서는 「ready는 모든 원격 source의 성공 보증이 아니다」와 함께 「관측 가능한 source 실패는 failed로 게시」라는 예외를 이미 명시한다. 따라서 구현과 문서가 전면 불일치하는 문제는 아니다. **선택한 Homebrew 대상과 무관한 source 실패가 모든 요청을 막는 정책**이 실제 설치 후 드러난 후속 문제다.

운영 export를 수동 변경하거나 실패를 숨기거나 HTTPS 요구를 완화하지 않았다. 확장의 gate도 제거하지 않았다. 실제 검토 URL·업데이트 요청은 보내지 않았으며, 운영 cancelled/completed receipt나 실제 앱 업데이트 완료를 주장하지 않는다.

[앱 작업에 전달할 전체 프롬프트](VESSLO_PRODUCTION_READINESS_HANDOFF.ko.md)에 코드 위치, source 해시, 재현 증거, 대상/source별 준비 상태 설계, 비동기 준비 이후 재검증, 계약 호환성, 회귀 검증과 실제 설치 완료 기준을 정리했다. 앱 작업으로 메시지를 전송하지 않았다.

## 4. 검증 결과와 실패 기록

이번 작업에서 새로 완료한 검증:

- universal archive와 Developer ID export 성공.
- 저장소의 archive/final artifact verifier 성공.
- `codesign --verify --deep --strict --all-architectures` 및 앱 런타임 Team 요구식 검증 성공.
- 설치본 70개 파일·링크와 export 일치, 확장 16개 런타임 파일과 `dist` 일치.
- 실제 앱 시작·사용자 시스템 인증 처리 후 schema 2 export 확인.
- 실제 Raycast 단일 등록·7개 명령 화면 및 count 일치 확인.
- 앱 작업본·원본 저장소의 기존 파일 내용 보존 확인.
- Markdown 형식·whitespace 및 문서 상대 링크 확인.

기존 확장 228/228, 앱 188/188 테스트는 앞선 작업의 결과다. 이번에는 앱·확장 실행 소스를 변경하지 않았으며 해당 테스트를 다시 실행한 것으로 기록하지 않는다. 이번 실제 운영 실행 증거가 기존 합성 fixture 테스트를 모든 조건에서 대체하지도 않는다.

두 도구 호출 오류가 있었다. Raycast CLI의 잘못된 엔트리 경로는 실제 `bin/run.js`로 수정했고 개발 빌드·등록이 성공했다. `codesign -R` 첫 호출은 요구식 앞의 `=` 누락으로 파일명으로 해석되어 실패했으며 literal 요구식으로 수정한 검증은 성공했다. 두 오류 로그는 보존했다. 소스 컴파일 실패로 기록하지 않는다.

| 증거                           | 경로                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 설치·서명·source 보존 manifest | [installable-app-manifest.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/build/installable-app-manifest.json) |
| 빌드 상세 인수 기록            | [BUILD_HANDOFF.md](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/build/BUILD_HANDOFF.md)                           |
| 설치본 전체 비교               | [installed-app-verification.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/installed-app-verification.json)   |
| 확장 런타임 전체 해시          | [raycast-installed-artifacts.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/raycast-installed-artifacts.json) |
| 최종 실행·보존 확인            | [final-runtime-verification.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/final-runtime-verification.json)   |
| 첫 검사 완료 메타데이터        | [live-export-first-metadata.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/live-export-first-metadata.json)   |
| source 실패 근거               | [live-check-failures.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/live-check-failures.json)                 |
| 최종 URL 해석 경로             | [handlers-final.json](/private/tmp/VessloInstalledIntegration-20260912-k001xumy/handlers-final.json)                           |

## 5. 백업·현재 실행 상태·남은 경계

백업은 `/Users/hjm/Documents/Vesslo-Backups/VessloInstalledIntegration-20260912-k001xumy`에 있다. 앱과 Raycast를 종료한 상태에서 설치 앱, Vesslo 지원 데이터·설정, Raycast config·지원 데이터·설정 2개·공유 컨테이너의 **8개 범위 전체 미러**를 만들었다. 총 2,072개 기록의 내용·유형·권한·링크 비교가 일치했다. 이전 설치 앱 원본도 `moved-original/Vesslo.app`에 통째로 남겼다. [백업 manifest](/Users/hjm/Documents/Vesslo-Backups/VessloInstalledIntegration-20260912-k001xumy/manifest.json)에 각 원본과 미러 경로가 있다.

별도 OS 관리 `com.raycast.macos.RaycastAppIntents` 컨테이너의 metadata 파일은 macOS가 읽기를 거부했다. 이 컨테이너는 복사하지 못했고 설치·등록 변경 범위에도 포함하지 않았다. 전체 OS 컨테이너까지 백업했다고 주장하지 않는다. 복구가 필요하면 실행 중인 앱과 현재 데이터를 먼저 확인하고 manifest의 전체 범위로 계획해야 하며, 임의 일부 파일만 덮어쓰는 복구 절차를 제공하지 않는다.

검증 전 실행 중이던 앱은 `/Applications` 설치본이 아닌 기존 Xcode Debug 앱이었다. 이를 종료하고 새 설치본을 실행했다. 시스템 인증은 사용자가 직접 완료했다. 최종 확인 PID는 `2587`이며 `/Applications/Vesslo.app/Contents/MacOS/Vesslo -enableAutoUpdate NO`로 실행 중이다. **현재 프로세스에서만 자동 업데이트를 꺼둔 상태를 유지했다.** 영구 `enableAutoUpdate` 설정은 원래 값 `true` 그대로다. 앱을 정상적으로 종료·재실행하면 원래 자동 업데이트 설정이 다시 적용된다. 이 차이는 별도 실제 업데이트 검증 전 확인해야 한다.

남은 실행 순서:

1. 앱 작업에서 선택한 Homebrew 대상의 현재 source 신뢰와 전체 검사 완료를 구분하는 정책을 수정하고 계약·합성 fixture·회귀 검증을 반환한다.
2. 새 계약이 필요하면 확장 소비자를 연결하고 새 설치본·확장을 반영한다.
3. 실제 운영 데이터에서 정확한 대상 검토 → 취소 → 동일 요청의 cancelled receipt를 Raycast에서 확인한다.
4. 허용 범위와 대상·복구 경로를 확인한 실제 업데이트 1건에서 설치 버전 변경과 authoritative completed를 함께 검증한다.

이번 작업에서 공개 릴리스·Store 게시·공증·실제 앱 업데이트를 수행하지 않았다. TCC 거부·Installer·재시작 이후 실제 업데이트 복구도 검증하지 않았다. 앱 소스 767개 보존은 이번 설치 작업의 시작 이후 비교이며 이전 작업의 `project.pbxproj` 과거 hunk 보존 한계를 소급 해소하지 않는다.

이번 소스 저장소 변경은 이 보고서, 앱 전달 프롬프트, README와 앱 인터페이스 안내 문서다. **워킹 디렉토리에만 수정, 커밋 안 함.** 로컬 설치 앱과 Raycast 런타임 교체는 별도로 완료됐다.
