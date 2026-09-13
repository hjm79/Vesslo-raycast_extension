# Vesslo native Review/Handoff 격리 검증용 앱 작업 프롬프트

아래 내용은 앱 담당 작업에 그대로 전달할 수 있다. 문서 작성 자체는 다른 작업에 메시지를 보내거나 앱 수정·실행·등록·설치본 교체를 수행한 것이 아니다.

## 작업 목적과 기준

Raycast 연동 A–C의 앱 계약과 확장 소비자·sender·receipt 표시 연결 이후, **생산 데이터와 실제 앱 업데이트에 접근하지 않고 실제 Vesslo Review UI에서 요청 검토 → 취소 → receipt 조회를 검증할 수 있는 Test 전용 harness**를 구현하고 검증해라.

- 앱 작업 위치: `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`
- 조사 시점 HEAD: `cad2418`, branch `codex/vesslo-main-continuation`. 착수 시 실제 HEAD·branch·dirty 경계를 다시 확인하고 기록해라. 사용자가 다른 기준을 지정했다면 그 기준을 따른다.
- 기존 앱 패치는 이 HEAD 위의 워킹 디렉토리 변경이다. 기존 tracked/untracked 변경 전체를 보존하고 덮어쓰기·reset·자동 stage·복원하지 마라.
- 필수 문서와 `AGENTS.md`를 읽고 기준 커밋, 수정 금지 파일, 작은 작업 범위, 이슈별 커밋 경계를 먼저 명시해라.
- 보호 파일 `Sources/Vesslo/Services/UpdateCheckService.swift`는 수정하지 마라.
- 확장 작업 위치 `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`는 읽기 전용 참고 자료다. 확장 소스·manifest·테스트는 이 앱 작업에서 수정하지 마라.
- 커밋·push·배포·설치본 교체를 수행하지 마라. 이 요청은 아래의 Test 전용 구현과 검증만 승인한다.

## 이미 확인한 구현과 부족한 연결

다음은 조사 시점 앱 소스와 빌드 산출물에서 확인한 사실이다. 착수 시 실제 코드와 대조해라.

1. `Sources/Vesslo/Core/VessloRuntimeEnvironment.swift`는 `VESSLO_XCTEST_HOST=1`, XCTest 로드 또는 `top.hjm79.Vesslo.TestHost` bundle ID에서 PID/UUID별 임시 state directory 및 별도 defaults suite를 만든다. 외부에서 지정하는 Raycast fixture UI launch 경로는 없다.
2. `Sources/Vesslo/VessloApp.swift`의 Test 분기는 `Color.clear`를 표시한다. `Sources/Vesslo/VessloAdmittedRuntime.swift`의 admission gate는 테스트 runtime 생성을 금지한다. 실제 `.onOpenURL` → `RaycastHandoffService.receive`는 일반 admitted root view에만 있다.
3. `Sources/Vesslo/AppDelegate.swift`는 테스트 launch lifecycle을 조기에 반환한다. 일반 Debug launch에서는 실제 recovery와 Self Update/Auto Update scheduler가 시작될 수 있다. Debug 앱을 단순 실행하는 것으로 격리 검증을 대신하지 마라.
4. `Tests/VessloTests/RaycastHandoffServiceTests.swift`의 fixture는 metadata/inventory, 메모리 receipt 저장, 가짜 executor를 주입한 service 테스트다. 실제 native review window, OS 전달 경로와 확장 fixture가 읽는 격리 receipt 파일을 잇는 harness는 아니다.
5. 실제 view `Sources/Vesslo/Views/BatchUpdate/RaycastHandoffReviewView.swift`는 service를 주입받을 수 있다. `RaycastHandoffReceiptStore`도 URL과 application-session mutation authorizer를 주입받을 수 있다. 이 경계를 우선 활용해라.

조사 시 확인한 산출물:

| 경로                                                                                 | 식별 정보와 한계                                                                                                                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/tmp/VessloRaycastIntegration-20260910/DerivedData/Build/Products/Test/Vesslo.app`  | `top.hjm79.Vesslo.TestHost`, `2.0.1 (28)`, arm64, Apple Development 서명, `CFBundleURLTypes` 없음. 기존 상태로는 native Review URL 수신 화면을 제공하지 않는다. |
| `/tmp/VessloRaycastIntegration-20260910/DerivedData/Build/Products/Debug/Vesslo.app` | `top.hjm79.Vesslo`, `2.0.1 (28)`, arm64, Apple Development 서명, `vesslo` scheme 정보 있음. 일반 실행은 production 상태에 접근한다.                             |
| `/Applications/Vesslo.app`                                                           | `top.hjm79.Vesslo`, `2.0.1 (28)`, universal x86_64/arm64, Developer ID Application 서명. 위 두 산출물과 실행 파일 해시가 다르다. 보존 대상이다.                 |

버전 문자열이 같은 사실을 설치본에 새 계약이 반영되었다는 증거로 사용하지 마라. 위 임시 build의 존재·시각·해시는 현재 작업의 재검증을 대신하지 않는다.

## 요구 구현

### 1. Test 전용 native UI 진입점

- Test configuration에서만 컴파일·활성화되는 명시적인 opt-in 진입점을 만든다. 일반 XCTest는 기존 `Color.clear`와 live-runtime 차단을 유지한다.
- production/Release에서 launch argument 또는 환경 변수만으로 license, admission, 실제 실행 안전 절차를 우회할 수 있는 경로를 만들지 마라. 테스트 진입점과 DI 구현이 production 산출물에 포함되지 않음을 검사해라.
- 실제 `RaycastHandoffReviewView`와 실제 `RaycastHandoffService`를 주입 가능한 좁은 host에 연결한다. 테스트용 복제 화면으로 실제 view를 대신하지 않는다.
- production의 `AppDiscoveryService.shared`, license/keychain, update checker, schedulers, recovery, 실제 Terminal/Installer engine을 초기화하지 않는다. 전체 live runtime을 켜서 화면을 얻는 방식을 피한다.
- host의 닫기·취소·sheet dismissal을 실제 service lifecycle과 연결한다. 사용자 검토를 통과하지 않고 `confirm`을 자동 호출하지 않는다. Return 키가 실행 동의로 작동하지 않는지 native 화면에서도 확인한다.

### 2. 완전히 합성된 inventory와 실행 불가 경계

- synthetic UUID·Bundle ID·canonical `.app` 경로·cask·installed/target version만 사용한다. 실제 `/Applications` inventory를 수집하거나 대상 경로를 변경하지 않는다.
- schema 2 ready metadata와 일치하는 session/inventory/check revision을 만든다. 요청 시각과 fixture clock을 일관되게 사용하며 날짜를 현재 요청 시각으로 갱신하는 방법을 문서화한다.
- `RaycastHandoffService.Dependencies`에 synthetic inventory/readiness/authorization/target inspection을 주입한다. 기존 production validator를 완화하지 않는다.
- executor는 구조적으로 inert여야 한다. 실제 brew/mas/Process/Terminal/Installer/updater를 호출할 수 없어야 하며 호출 시도를 계수해 증거로 반환한다. 화면에서 실수로 확인 버튼을 눌러도 이 경계를 벗어나지 않도록 한다.
- 최초 review-only native 검증에서는 실행 확인을 누르지 않는다. 확인 처리 자체를 시험할 필요가 있다면 별도 합성 시나리오로 분리하고 가짜 executor임을 화면과 결과에 명시한다.

### 3. private export·receipt 파일과 수명

- 앱이 소유하는 새 private 임시 root에만 fixture export와 receipt를 게시한다. 기존 production 파일을 복사·교체·권한 변경하지 않는다.
- 실제 `RaycastHandoffReceiptStore`의 bounded/descriptor-bound 읽기·atomic writer·revision/terminal 보존 경계를 재사용한다. 테스트 authorizer는 해당 root와 host session에만 유효하도록 하고 production authorizer 우회로 노출하지 않는다.
- session/root lifecycle을 명시하고 종료 시 해당 host의 파일과 등록만 정리하는 절차를 제공한다. 임의 경로 재귀 삭제나 생산 디렉토리 정리는 금지한다.
- native Raycast fixture가 읽을 수 있도록 manifest에 **정확한 absolute root, export path, receipt path, publisher session, fixture clock, inventory/check revision, host bundle ID 및 executable/app path**를 기록한다. 요청 JSON/URL과 연결할 scenario ID도 제공한다.
- manifest와 fixture에 실제 라이선스·credential·사용자 앱 목록을 포함하지 않는다.

### 4. production URL handler를 보존하는 전달 경로

- production `vesslo` URL scheme의 기본 handler나 기존 설치본 등록을 변경하지 않는 명시적인 host 전달 경로를 구현한다. 단순한 `open vesslo://…`로 설치본을 선택하게 하지 마라.
- 전달 대상 host의 bundle ID·실행 경로·PID/session을 확인할 수 있어야 한다. 다중 fixture 또는 설치본이 실행 중이어도 엉뚱한 앱으로 요청을 보내지 않도록 한다.
- fixture 전용 transport가 필요하면 Test host에만 한정하고 원래 `RaycastHandoffTransport`로 payload를 해석한 다음 실제 service에 전달한다. production transport parser의 검증을 느슨하게 하지 않는다.
- 전용 scheme 등록이 꼭 필요하다면 고유한 fixture scheme만 사용하고 생성·제거 대상 및 원래 등록 불변 확인을 문서화한다. production scheme 변경은 허용하지 않는다.
- exact target 선택이 가능한 기존 macOS 전달 API/CLI를 검토하되, 실제 검증 없이 작동한다고 주장하거나 명령을 추측하지 마라. 구현 후 **그대로 실행 가능한 정확한 build/launch/send/observe/stop/cleanup 명령**을 반환해라.

## 필수 검증 시나리오

각 시나리오에서 화면과 실제 격리 receipt 파일의 request ID·전체 원래 ordered identity를 대조한다. 테스트 receipt snapshots의 대안 결과를 하나의 정상 진행 sequence처럼 덮어쓰지 않는다.

| 시나리오       | 기대 증거                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 정상 수신·검토 | 지정한 1개 및 복수 대상의 path/cask/버전만 실제 view에 표시. 수신만으로 executor 호출 없음. receipt `accepted`를 실행·완료로 표시하지 않음. |
| 취소           | 실제 취소 버튼 또는 허용된 닫기 경로 이후 `cancelled` receipt와 동일한 원래 request/targets 유지. 실제 실행 호출 0.                         |
| 중복 요청      | 같은 ID/같은 payload를 다시 받아도 기존 receipt를 보존하고 실행·대상 수를 늘리지 않음.                                                      |
| 동일 ID 충돌   | 같은 ID/다른 payload를 거부하고 원래 receipt를 보존.                                                                                        |
| 만료           | lifetime을 초과한 요청은 `expired`로 거부되고 실행 없음. UI와 per-target 이유를 확인.                                                       |
| 대상 거부      | stale session/revision 또는 한 target 불일치 시 all-or-none admission. 정상 target만 좁혀 실행하지 않음.                                    |
| 파일 오류      | 격리 fixture의 malformed/permission simulation 시 저장 실패를 성공으로 보고하지 않고 실행 확인 차단. 실제 사용자 파일 권한은 변경하지 않음. |
| 종료·정리      | host 종료와 timer/subscription 정리, fixture-owned registration 제거를 확인. production 설치본과 URL handler는 유지.                        |

실제 TCC 거부, 사용자 앱 업데이트, 실제 Terminal/Installer, 실제 production 재시작 복구는 이 harness 검증에 포함하지 않는다. 아직 검증하지 않은 항목을 통과로 집계하지 마라.

## 빌드·증거와 반환물

1. Test 전용 코드의 관련 Swift tests와 Test build를 실행하고 정확한 invocation·로그·xcresult를 남긴다. repository scheme의 Test configuration을 사용한다. 테스트 명령에 임의로 `-configuration Debug`를 덧붙이지 않는다.
2. production 경로 회귀를 확인하기 위해 repository 지침의 Debug build도 실행한다. 동일 오류를 반복 재시도하지 않고 실패와 blocker를 구체적으로 보고한다.
3. Test 전용 entrypoint가 Debug/Release production 동작에 포함되지 않는 검증 결과를 기록한다. harness에 필요한 별도 scheme/target을 추가했다면 target/configuration 경계를 명확히 한다.
4. 정확한 변경 파일 목록, 새 Test host의 bundle ID·서명·build/executable 해시·수정 시각, manifest와 synthetic request/receipt 예시를 반환한다.
5. native review → 취소 → receipt를 확인한 화면/AX 또는 다른 직접 실행 증거와 executor 호출 0 기록을 반환한다. service unit test 통과와 native 화면 통과를 구분한다.
6. 실행 전후 `/Applications/Vesslo.app`과 production Vesslo 데이터의 파일 목록·내용 해시를 비교하고 기존 URL handler 식별 정보를 비교한다. 파일 내용과 credentials는 로그에 출력하지 않는다. 다른 앱 작업이 동시에 변경 중이라 비교가 불확실하면 변경 없음으로 단정하지 말고 소유권과 증거 한계를 기록한다.
7. `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work` 담당이 그대로 사용할 manifest path와 정확한 build/launch/send/read/cleanup 절차를 반환한다. 확장 담당이 transport나 경로를 추정할 필요가 없어야 한다.
8. 앱 원본 HEAD·기존 dirty·보호 파일 보존 결과를 기록하고, 마지막에 `워킹 디렉토리에만 수정, 커밋 안 함`을 명시한다.

이 작업의 완료는 **합성 데이터와 실행 불가 executor를 사용한 실제 UI·격리 파일·명시적 전달 경로의 연결 검증**이다. 설치본 반영, 실제 앱 업데이트, 배포·공증 완료를 뜻하지 않는다.
