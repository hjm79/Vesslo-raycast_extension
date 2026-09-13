# Vesslo 메인 작업 전달 프롬프트

아래 구분선 다음 내용을 Vesslo 앱 담당 작업에 그대로 전달한다. 이 문서는 구현 요청이며, 여기에 적힌 새 API나 export 필드가 현재 지원된다는 뜻이 아니다.

---

Vesslo Raycast 연동을 완성하기 위해 **Vesslo 앱 측의 아래 필수 보강을 구현·검증해라.** Raycast 확장은 별도 담당이 구현 중이므로 이 작업에서는 앱 Swift·앱 프로젝트·앱 문서·Swift 테스트를 맡고, 확장 소스는 수정하지 마라.

## 1. 기준과 소유권

- 실제 앱 저장소: `/Users/hjm/Documents/git/all_application/Vesslo`.
- 2026-09-10 확인 기준 HEAD: `14b3916a3fcf00eedce2ffbf71844e0716cfa27b`와 해당 저장소의 기존 dirty 변경. 작업 시작 시 현재 HEAD와 dirty 경계를 다시 확인하고 최신 사용자 지시를 따른다. 오래된 자동 생성 worktree를 최신 앱으로 취급하지 마라.
- 앱 `AGENTS.md`와 필독 문서를 순서대로 읽어라. 보호 파일 `Sources/Vesslo/Services/UpdateCheckService.swift`는 사전 승인 없이 수정하지 마라. 기존 evaluator·export·deep-link/coordinator 경계로 해결할 수 있는지 먼저 확인해라.
- 확장 작업 사본: `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`, 최초 기준 `af13e51fb64eaaa181af89395000bbd6a9b88f2e`. 확장과 원본 nested repository는 이 앱 작업에서 수정하지 마라.
- 이전 소유권 변경으로 중단된 앱 사본 `/Users/hjm/.codex/worktrees/22c7/Vesslo/vesslo-app-work`에는 미검증 변경 4개가 있다. `RaycastHomebrewHandoff.swift`, `BatchUpdateManager.swift`, `UpdateExecutionCoordinator.swift`, `BatchUpdateProgressView.swift`이며 빌드·테스트되지 않았다. 그대로 덮어쓰거나 완성된 구현으로 재사용하지 말고, 필요하면 read-only 참고 후 현재 앱 경계에 맞춰 최소 변경으로 구현해라. 기존 변경을 임의 reset/restore/delete하지 마라.

## 2. 현재 코드에서 확인된 문제

- `DataExportService.ExportData`는 `exportedAt`, `updateCount`, `apps`만 공개한다. `updateCount`는 `apps.filter(\.isVisibleInUpdates).count`다. 최근 파일 생성 시각이 최근 업데이트 검사의 완료를 증명하지 않는다. 내부 export publication/session 보호가 이미 존재하는 것과 외부 소비자가 확인할 수 있는 공개 계약은 별개다.
- `VessloAdmittedRuntime.handleDeepLink`는 `app/<bundleId>`, `update/<bundleId>`, `update-all`을 처리한다. 업데이트 경로는 0.5초 지연 notification에 의존한다.
- `ContentView.deepLinkTarget`는 삭제되지 않은 첫 Bundle ID 일치 앱을 고른다. 동일 Bundle ID가 여러 경로에 설치돼 있으면 URL이 정확한 인스턴스를 특정하지 못한다.
- 단건 실행은 `.singleApp(app, trigger: .detailHeader)`로 현재 route를 다시 선택한다. 요청자가 의도한 source/cask/installed version/target version을 고정하지 못한다.
- `update-all`은 정확한 Homebrew 대상 집합을 받지 않는다. 이 경로를 Raycast Homebrew bulk의 대체물로 쓰면 범위가 넓어진다.
- 확장에서는 직접 brew/mas/Terminal 실행을 제거했고, Homebrew bulk가 현재 검토 안내로 제한돼 있다. **기존 일괄 기능을 복구하는 것은 이번 연동의 필수 작업이다.** 신규 엔진을 중복 구현할 필요는 없다.

## 3. 필수 A — 정확한 대상의 앱 소유 Review/Handoff

기존 readiness·batch·execution coordinator를 재사용해, Raycast가 선택한 단건/복수 Homebrew 대상을 정확히 검토하는 인터페이스를 추가해라.

1. 먼저 지원할 실제 transport/URL·버전·상한을 확정하고 문서와 fixture로 남겨라. 임의의 파일 경로를 URL로 받아 읽는 식으로 구현하지 마라. 기존 경로의 동작을 바꾸는 경우 호환성을 명시해라.
2. 최소 요청 정보는 `requestId`, producer session 또는 동등한 현재성 식별자, 생성 시각, source=`homebrew`, 명시적인 targets다. 각 target은 app UUID, Bundle ID, canonical path, cask token, installed version, expected target version으로 식별한다. UUID 하나나 Bundle ID 하나만 믿지 마라.
3. 수신은 자동 업데이트가 아니라 **해당 대상만 표시하는 앱 내부 검토 화면**을 열어야 한다. 사용자가 확인하기 전에 업데이트를 시작하지 마라.
4. 수신 시 현재 inventory와 대조하고 중복/삭제/ignored/current-target-skipped/변경된 source·cask·version·path/실행 불가능/권한·라이선스 제한을 명확히 구분한다. 다른 버전의 과거 skip 이력만으로 새 target을 숨기지 마라.
5. 확인 후에도 기존 admission, mutation lease, 실행 중 앱 preflight, cancellation, recovery, post-verification을 통과해야 한다. `await` 뒤 상태가 바뀌는 경우까지 source와 대상 집합을 유지해라. 다른 앱이나 Sparkle/App Store로 조용히 확대·전환하지 마라.
6. 중복 요청, 재전송, 만료/미래 시각, 앱 시작 중 대기, 다른 작업 진행 중, 취소, 재시작 동작을 정해라. 고정 0.5초 대기 대신 준비 상태 기반의 bounded pending 요청을 사용하고 세대 변경/만료 뒤 실행하지 마라.
7. 단건 source 고정도 동일한 대상 검증 모델을 재사용할 수 있게 해라. 현재 generic update URL을 보낸 사실만으로 요청 접수·실행·완료를 보장한다고 보고하지 마라.

## 4. 필수 B — 버전·검사 완료 상태가 있는 공개 export 계약

- 기존 consumer와의 전환 방식을 명시해 `schemaVersion`, producer build/version, publisher session, inventory/export revision, 검사 phase(`checking`/`ready`/`failed` 또는 동등한 enum), 완료 검사 revision, `lastUpdateCheckAt`을 공개해라. 각 시각과 revision의 의미를 문서화하고 `exportedAt`과 혼용하지 마라.
- 값은 실제 앱 상태에서 생성해야 한다. 태그/메모 변경이나 앱 시작 cache export에 검사 완료 시각을 새로 넣지 마라. ready는 완료된 검사의 inventory/revision과 일치할 때만 게시한다.
- 기존 worker publication 직전에 generation/session/revision을 재검사하는 보호를 유지해라. 오래된 작업이 새로운 상태를 덮어쓰지 않도록 한다.
- 각 앱의 `isVisibleInUpdates`, `currentTargetSkipped`, `hasAnySkippedVersion`, `eligibilityKind`, `primaryActionKind`를 같은 snapshot에서 생산한다. updateCount와 row visibility가 일치해야 한다.
- 현재 확장은 알려지지 않은 명시적 schemaVersion을 거부한다. **새 필드를 앱에 추가했다고 확장 호환까지 완료한 것으로 보고하지 말고**, 정확한 schema 및 JSON fixture를 확장 담당에 돌려줘라. 확장 측 consumer 연결은 그 계약을 받아 별도로 완성한다.
- 확장은 native fileIcon으로 이동했으므로 대용량 Base64 아이콘 export를 줄일 수 있다. 기존 소비자 호환을 확인한 후 아이콘 생략/옵션화 여부를 별도 판단해라. 이미지 처리 최적화가 위 계약 작업을 지연시키면 후순위로 둬라.

## 5. 필수 C — 접수와 실제 결과 구분

- requestId/session 및 원래 target identity에 연결된 읽기 전용 receipt를 제공해라. accepted/rejected(reason), running, verificationPending, completed, failed, cancelled를 구분한다.
- 앱의 기존 authoritative verification 결과로만 completed를 게시해라. process exit 0, URL open 성공, spinner 종료, 파일 mtime은 완료 근거가 아니다.
- receipt 조회·보존·삭제/만료·원자적 게시 정책과 per-target 부분 실패를 정한다. 원래 요청 밖의 대상이 결과에 섞이지 않아야 한다.
- 확장에 필요한 최소 capabilities와 receipt 조회 방법/예시를 제공해라. 아직 없는 endpoint를 호출하는 시연으로 연동 완료를 주장하지 마라.

## 6. 기능 보강용 읽기 전용 계약

필수 A–C 이후 현재 앱의 Update Activity/Verification snapshot을 재사용해 읽기 전용 export 가능 범위를 정리해라. 앱 ID, source, target, 발생/갱신 시각, 실제 검증 상태, 간결한 사유와 앱 내 조회 이동만 필요하다. 로그 전체·서명 URL·개인정보·credential을 노출하지 마라. 확장에 verification/retry/delete 같은 mutation API를 새로 만들지 마라.

현재 확장의 `Deleted Apps`는 기존 `isDeleted` 레코드 조회만 제공한다. 삭제 시각/사유·복구 가능 여부는 export에 없어 추정하지 않는다. 이 메타데이터를 추가할 경우 실제 앱 저장소 값을 사용하고 없으면 명시적으로 unknown을 유지해라.

현재 확장의 `⌘R`은 파일 재읽기다. 앱의 실제 업데이트 재검사 요청 API를 제공한다면 이를 별도 capability와 접수/진행 상태로 문서화해라. 파일을 다시 읽은 것을 업데이트 검사 완료로 취급하지 마라.

## 7. 필수 검증과 반환물

- Swift producer → JSON → TypeScript consumer가 함께 사용할 고정 fixture를 작성해라: 과거 skip+새 target, 현재 target skip, unknown action, 중복 Bundle ID/서로 다른 경로, checking/failed/ready, 같은 mtime 다른 revision, stale session, count 불일치, deleted, 누락/손상/권한 거부.
- 수신/실행 회귀: 정확한 Homebrew 집합, 다른 source fallback 금지, preflight await 중 변경, 중복/만료/재시작 요청, 부분 거부/실패, terminal waiting과 verification pending, 접수와 완료 구분.
- 실제 설치 앱 업데이트 없이 주입된 executor/격리 fixture로 검증해라. 관련 Swift 테스트와 `xcodebuild -project Vesslo.xcodeproj -scheme Vesslo -configuration Debug build`를 수행하고 실제 수동 검증 여부를 따로 기록해라.
- 반환물: 수정 경로·기준, 확정된 요청/응답/schema/capabilities 문서, representative JSON fixtures, tests/build 로그, 구현/미구현 항목과 정확한 통합 순서. 확장 담당이 이 자료로 sender/consumer 및 선택형 batch UI를 연결할 수 있어야 한다.
- 원본 반영·실제 업데이트·commit/push/publish/release는 기존 사용자 지시 경계를 따른다. 요청되지 않은 배포/실제 업데이트를 수행하지 마라.

단순히 “앱 쪽 필요”라고 다시 넘기지 말고, 위 계약을 현재 앱 구조에 맞게 구현하고 검증된 인터페이스를 반환해라. 기존 기능 복구, 신규 조회 기능, 자동 검증, 실기 검증을 분리해 보고해라.
