# Vesslo 운영 Homebrew 요청 준비 상태 수정 요청

2026-09-12 실제 설치 연동에서 발견한 앱 측 후속 작업이다. 아래 「앱 작업에 전달할 프롬프트」 전체를 Vesslo 앱 작업에 붙여 넣으면 된다. 이 문서 작성 작업은 앱 소스나 확장 실행 코드를 변경하지 않았으며, 다른 작업으로 메시지를 전송하지 않았다.

## 현재 설치 상태와 문제

**A–C를 포함한 Vesslo 앱과 최신 7개 명령 Raycast 확장의 로컬 교체는 끝났다.** `/Applications/Vesslo.app` 전체 번들을 교체했고, 설치본과 Developer ID로 서명한 universal export artifact의 바이트 일치를 확인했다. 앱 버전 표시는 `2.0.1 (28)` 그대로이므로 버전 문자열만으로 구분하면 안 된다. 실행 파일 SHA-256은 `614f8e13d8e910cb975f0889132df7824508304cbf1ad84b69808e8ce4c9842b`이다. Raycast의 `~/.config/raycast/extensions/vesslo`도 최신 7개 명령 빌드와 바이트 일치한다. 이는 로컬 반영 결과이며 Store·공개 릴리스 배포 결과가 아니다.

현재 차단 요인은 구버전 설치나 schema 미지원이 아니다. 설치된 앱이 schema 2와 두 capability를 게시하지만, 전체 검사 도중 관측한 Sparkle 실패가 **모든 Homebrew 검토 요청의 전역 준비 상태**를 `failed/sourceFailure`로 바꾼다.

| 관측 항목                                  | 첫 전체 검사 완료 직후 값               |
| ------------------------------------------ | --------------------------------------- |
| `schemaVersion`                            | `2`                                     |
| capabilities                               | `homebrewReviewV1`, `requestReceiptsV1` |
| `checkPhase` / `checkReason`               | `failed` / `sourceFailure`              |
| `checkRevision` / `completedCheckRevision` | `1` / `1`                               |
| `checkedInventoryRevision`                 | 생략됨                                  |
| `inventoryRevision`                        | `59`                                    |
| 실제 전체 검사 완료 시각                   | `2026-09-12T10:56:02Z`                  |

같은 검사에서 Luminar Neo의 Sparkle HTTPS 정책 위반과 Vesslo의 Sparkle HTTP 비성공 응답을 관측했다. 각각 실패 시각은 `10:55:46Z`, `10:55:48Z`였다. Vesslo의 누적 실패 횟수 `196`을 이번 검사에서 196회 실패했다는 의미로 해석하면 안 된다. 위 revision·시각은 해당 실행의 증거이며 다음 실행에서 달라진다. 운영 앱 목록이나 원본 JSON은 이 문서에 복사하지 않았다.

## 확인한 코드와 계약

- [RaycastExportLifecycle.swift:127](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Sources/Vesslo/Services/RaycastExportLifecycle.swift:127)의 `hasFailure`는 검사 cohort 경로에 속하고 검사 시작 후 발생한 actionable 실패를 source 구분 없이 집계한다. 완료 시 그 결과를 전달하고, 완료 이후 관측된 실패도 반영한다.
- [RaycastExportState.swift:168](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Sources/Vesslo/Core/RaycastExportState.swift:168)는 전체 cohort 완료 revision·시각을 기록한 뒤, 실패가 있으면 `failed/sourceFailure`를 설정하고 `checkedInventoryRevision`을 설정하지 않는다. `recordLateSourceFailure`도 준비 상태를 해제한다.
- [RaycastHandoffService.swift:357](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Sources/Vesslo/Services/RaycastHandoffService.swift:357)의 admission은 `.ready`, 현재 checked inventory, 완료 검사 revision을 요구한다. 확장도 [data-state.ts:182](/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work/src/utils/data-state.ts:182)에서 동일한 전역 gate를 적용한다. 따라서 확장만 수정해서 안전하게 해결할 수 없다.
- [RaycastIntegration.md:104](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastIntegration.md:104)는 「ready는 전체 검사 루프 완료이며 모든 원격 source 성공 보증은 아니다」라고 설명하면서, 바로 이어서 **관측 가능한 source-health 실패는 failed로 게시한다**는 예외를 명시한다. 현재 구현은 이 예외와 일치한다. 사용자에게 전달된 짧은 완료 보고만으로는 서로 무관한 source 하나의 실패가 모든 Homebrew 요청을 막는 효과를 알기 어려웠다.
- [RaycastExportStateTests.swift:65](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Tests/VessloTests/RaycastExportStateTests.swift:65)는 source 실패 시 failed와 checked inventory 생략을, 다음 테스트는 late failure의 준비 상태 해제를 고정한다. 기존 테스트의 기대값 변경만으로 문제를 해결한 것으로 처리하지 않아야 한다.
- [RaycastHandoffService.swift:234](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Sources/Vesslo/Services/RaycastHandoffService.swift:234)의 비동기 준비 이후 validation은 실행 권한·session·현재 대상 확인을 호출한다. [BatchUpdateManager.swift:807](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Sources/Vesslo/Services/BatchUpdateManager.swift:807)은 이를 재호출하고 대상/source/실행 경로를 검사한다. 대상별 source 신뢰를 도입할 때 이 경로까지 같은 정책을 적용해야 한다. 이 지점의 late failure 우회 실행을 실제로 재현했다는 의미는 아니다.

## 앱 작업에 전달할 프롬프트

다음 Vesslo 앱 측 후속 문제를 원인 확인에서 구현·검증·설치 반영 자료까지 완료해 주세요.

작업 대상은 `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`입니다. 마지막 확인 HEAD는 `cad24187733387f545dd1b9793deacc02cfe8c8a`이며 A–C와 native harness 등이 이미 dirty 상태로 있습니다. 시작 시 실제 Git root·HEAD·branch·dirty 파일과 적용 지침을 다시 확인하고, 기존 변경과 이번 변경을 구분해 보존해 주세요. 원본 저장소와 Raycast 확장 작업본은 직접 수정하지 마세요. `/Users/hjm/Documents/git/all_application/Vesslo/Sources/Vesslo/Services/UpdateCheckService.swift` 및 앱 작업본의 대응 파일은 별도 사용자 승인 없이 수정하지 마세요. 해당 파일 변경이 불가피하면 재현·의심 라인·최소 변경안을 먼저 별도 보고하고 그 파일의 수정은 보류하되 다른 허용 작업은 계속하세요.

현재 설치 교체는 이미 완료됐습니다. `/Applications/Vesslo.app`은 A–C를 포함한 Developer ID universal 빌드이고 실행 파일 SHA-256은 `614f8e13d8e910cb975f0889132df7824508304cbf1ad84b69808e8ce4c9842b`입니다. Raycast도 최신 7개 명령이 로컬 반영됐습니다. 따라서 이전의 「호환 앱 설치 대기」를 반복하지 말고 새로 발견한 아래 준비 상태 문제를 해결해 주세요.

현재 전체 검사 루프가 완료되어 `completedCheckRevision == checkRevision == 1`과 완료 시각이 게시됐지만, Luminar Neo의 Sparkle HTTPS 정책 위반 및 Vesslo의 Sparkle 비성공 HTTP 응답 때문에 export가 `failed/sourceFailure`이며 `checkedInventoryRevision`이 없습니다. 같은 snapshot의 Homebrew 검토가 모두 막힙니다. 이 증거는 session `306D59A6-3BB2-4E7A-8B90-D01ACDC50091`, inventory revision `59`, 완료 시각 `2026-09-12T10:56:02Z`에서 수집했습니다. 원본 증거는 `/private/tmp/VessloInstalledIntegration-20260912-k001xumy/live-export-first-metadata.json` 및 `live-check-failures.json`에 있습니다. 현재 상태를 다시 읽되 운영 JSON·전체 앱 목록을 공개 문서나 fixture로 복사하지 마세요.

요구하는 결과는 **선택한 실제 Homebrew 대상의 검사가 신뢰 가능한 경우, 그 대상과 무관한 Sparkle 실패만으로 Homebrew 검토 전체가 불가능해지지 않는 것**입니다. 실패한 Homebrew 대상이나 신뢰를 확인할 수 없는 대상은 계속 차단해야 합니다. 단순히 모든 `sourceFailure`를 무시하거나 `ready`로 바꾸는 변경은 허용하지 않습니다.

다음 순서로 진행해 주세요.

1. `RaycastExportLifecycle.hasFailure`, `RaycastExportState.finishCheck`·`recordLateSourceFailure`, `RaycastHandoffService`의 수신·확인·실행 전 gate, Batch/coordinator의 재검증 경로와 관련 테스트를 확인하세요. 현재 계약 문서의 「전체 검사 완료」와 「관측된 source 실패는 전역 failed」라는 두 조건을 명시적으로 정리하세요. 알려진 실패와 관측하지 못한 실패를 혼동하지 말고, `lastFailureAt`만으로 현재 선택 대상의 Homebrew 성공을 추정하지 마세요.
2. 전체 검사 완료와 개별 source/대상의 실행 준비 여부를 구분하는 가장 작은 안전한 설계를 제시한 뒤 구현하세요. 대상/source별 준비 증거를 public export와 receiver 양쪽에서 검증하는 방법을 우선 검토하세요. 기존 ready 의미를 정리하는 설계를 택한다면 실패한 선택 대상이 계속 거부된다는 동등한 증거와 호환성 방안을 제시해야 합니다. session, 전체 검사 revision, inventory identity, source, 실제 Brew 설치, canonical path, cask, installed/target version, 권한·license·TCC·현재 eligibility를 하나의 요청 판단에 연결하세요. 새 검사가 시작되거나 source 증거가 없거나 오래됐으면 실패를 허용하는 방향으로 동작하지 않아야 합니다.
3. 수신 시, 명시적 확인 시, 비동기 UI·권한·실행 준비 이후 실제 mutation 직전 모두 같은 준비 정책을 재검증하세요. 선택된 대상의 late failure는 아직 실행되지 않은 작업을 막아야 합니다. 첫 대상의 정상 설치 때문에 inventory revision이 바뀌었다고 이미 승인된 동일 batch의 나머지를 무조건 깨뜨리지 않도록, 외부 변경과 해당 요청 자신의 진행을 구분하세요. 원래 대상·순서·요청 ID를 유지하고 일부 대상 제거 후 몰래 나머지만 실행하지 마세요.
4. `raycast_data.json`·요청·receipt에 필요한 계약을 문서화하고 익명 합성 fixture를 추가하세요. wire 의미가 바뀌면 명시적 schema/capability 또는 동등한 협상으로 기존 소비자가 안전하게 거부하도록 하세요. 기존 schema 2 소비자가 자동으로 새 의미를 이해한다고 가정하지 마세요. 확장 변경이 필요하면 정확한 TypeScript 소비·요청 조건과 fixture를 반환하고, Raycast 소스는 직접 수정하지 마세요.
5. 실제 Sparkle 실패 자체는 그대로 표시하고 각각 별도 원인으로 조사하세요. HTTPS 요구 완화, 운영 export·receipt 수동 수정, 실패 이력 삭제, 해당 앱을 몰래 제외·ignore 처리, 확장의 gate 제거는 금지합니다. 두 source 문제가 별도 설정/서버/코드 수정을 요구하면 근거와 소유 범위를 나누어 보고하세요. 전역 준비 상태 설계의 문제를 두 특정 앱의 임시 예외로 해결하지 마세요.

필수 회귀 검증은 다음과 같습니다.

- 전체 검사 완료 + 무관한 Sparkle 실패 + 현재 성공 증거가 있는 선택 Homebrew 대상: 그 대상만 검토 가능하고 Sparkle 실패 표시는 유지.
- 선택 Homebrew 대상의 실패·미검사·이전 session/revision의 성공·누락된 증거: 접수 또는 확인 거부, 실행기 호출 0회.
- 성공·실패 대상 혼합 선택: 원래 대상 목록과 각 사유를 유지하고 암묵적 부분 실행 금지.
- 검사 중 상태, 중단, 부분 cohort, inventory 교체, 대상 경로·UUID·Bundle ID·cask·설치/대상 버전·source 변경, 중복·만료·재시작: 안전한 거부와 원래 요청 보존.
- 확인 직후부터 저장·UI dismissal·권한 준비·Terminal/Installer 준비·실제 실행 직전 사이에 선택 source의 late failure 또는 identity 변경: 남은 mutation 차단. 무관한 source의 late failure와 구분.
- 같은 batch에서 먼저 성공한 대상의 정상 inventory 변경과 외부 대상 교체를 구분하는 회귀, 늦은 verification record가 다른 요청의 완료로 연결되지 않는 회귀.
- 거부·취소·재시작·부분 실패·verification pending·authoritative completed의 receipt 상태와 단조 revision, request identity, 대상 순서 보존. URL open·ACK·export 파일 갱신을 완료로 간주하지 않음.

저장소 규정의 Debug 빌드와 관련 Swift 테스트, source-contract/fixture 검사, production Debug/Release에서 Test harness 제외를 확인해 주세요. 테스트 수·실패·skip과 로그/xcresult의 정확한 경로를 반환하세요. 기존 dirty `project.pbxproj` hunk의 과거 보존을 입증하지 못했던 한계는 이번 결과로 소급 해소됐다고 쓰지 마세요. 새 변경 시작 전 파일·내용 기준을 남겨 이번 변경의 보존은 확인해 주세요.

설치 반영 시 기존 설치본과 운영 데이터 전체 미러 백업·복구 경로를 확보하고 정확한 새 artifact만 교체하세요. 현재 로컬 설치 작업은 사용자가 요청했으며 시스템 인증도 처리했습니다. 빌드 완료와 실제 설치 반영을 구분하고 `/Applications/Vesslo.app` 실행 파일·서명·아키텍처·현재 process/session·schema/capability·검사 상태를 확인하세요. 새 계약을 확장이 아직 소비하지 못하면 임의 payload로 운영 gate를 우회하지 말고, 앱 반환물과 함께 확장 담당에게 연결 검증을 넘기세요.

완료 기준은 새 설치본과 호환 확장을 통한 **운영 export → 정확한 실제 대상 검토 → 사용자 취소 → 같은 요청의 cancelled receipt를 Raycast에서 확인**하는 것입니다. 취소 결과를 `completed`로 표시하면 안 됩니다. 이후 실제 업데이트 1건의 검증은 실행 전 대상·복구 범위와 기존 사용자 허용 범위를 확인하고 진행하며, 실제 설치 버전 변경과 authoritative completed가 함께 있어야 업데이트 성공으로 기록하세요. TCC 거부·Installer·재시작을 테스트하지 못했다면 별도 미검증으로 남기세요. 로컬 설치 반영은 공개 배포·Store 게시 권한을 뜻하지 않습니다.

반환물은 다음을 포함해 주세요: 확정된 ready/대상별 신뢰 계약, 수정 파일·심볼·이번 patch, 원래 dirty 보존 결과, 익명 fixture와 manifest/SHA-256, receiver 및 TypeScript에 필요한 소비 규칙, 테스트 로그/xcresult, Debug/Release/Test artifact와 source·실행 파일 hash, 실제 설치 반영 여부·서명·process/session과 운영 검토/취소 receipt의 요약 증거, 남은 경계. 커밋을 만들지 않았다면 반드시 「워킹 디렉토리에만 수정, 커밋 안 함」이라고 보고하세요.

## 조사 기준 파일 SHA-256

아래는 문서 작성 시 앱 작업본에서 직접 읽은 파일의 해시다. HEAD만으로 dirty 구현을 식별하지 않도록 남긴다. 수정 후 반환물은 새 해시를 별도로 제공해야 한다.

| 앱 작업본 상대 경로                                    | SHA-256                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `Sources/Vesslo/Core/RaycastExportState.swift`         | `31c54cd08624d7a28fd864a47dd4b99181e477fe875ed445376c3fec0f3e7c86` |
| `Sources/Vesslo/Services/RaycastExportLifecycle.swift` | `3bf1a4a5716047c718aae7c0f5128e4da063fd0365ea202236908fafcc562d22` |
| `Sources/Vesslo/Services/RaycastHandoffService.swift`  | `a12fdbc6b3c3cac69d29e94c40fe5994b1102f32cf6079fed85fa13c69f4bdf5` |
| `Sources/Vesslo/Services/BatchUpdateManager.swift`     | `6d4a4b556491b265965ff6474fe8196ebe02e273b20737e7e6937ff3bfb0c6dd` |
| `Docs/RaycastIntegration.md`                           | `89d7cdbc997a961ec312a5e058e50528e657910e5ed4782fbbdf16f068f751bc` |
