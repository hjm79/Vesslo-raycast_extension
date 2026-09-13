# Schema 2 / receipt native Raycast 검증 — 2026-09-11

이번 작업에서는 이전 통합 작업에서 Mac 잠금 때문에 남았던 **Raycast native 화면 검증을 3개 합성 시나리오로 수행**했다. 검토 선택, 검증 대기, 부분 실패, 검사 중 요청 차단에서 추가 오류는 발견되지 않았다. 실제 Vesslo의 요청 수신과 파일 receipt를 연결하는 실기는 별도의 앱 Test harness 구현이 필요하다.

## 1. 원인과 작업 기준

- 이전 native 검증 미실행 사유는 Mac 잠금이었다. 이번에는 잠금이 해제된 Raycast에서 직접 조작하고 화면·AX를 기록했다.
- 확장 작업 기준: `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`, HEAD `af13e51fb64eaaa181af89395000bbd6a9b88f2e`. 기존 dirty 구현을 그대로 사용했다.
- 앱 참고 기준: `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`, HEAD `cad24187733387f545dd1b9793deacc02cfe8c8a`. 앱 소스와 설치본은 수정하지 않았다.
- 확장 소스·테스트·빌드 설정 등 이전 검증 manifest의 **104개 파일 SHA-256이 작업 전후 모두 동일**했다. 이번 변경은 검증 기록과 전달 문서다.

## 2. 실제 화면에서 확인한 결과

| 시나리오       | 수행 내용과 확인 결과                                                                                                                                                | 직접 증거                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 다중 선택·검색 | 5개 대상 선택 후 `historical` 검색으로 1개만 표시되어도 선택은 5개 유지. 검토 화면과 결과 화면에서 돌아와도 검색·선택 유지                                           | [선택 화면](native-schema2-20260911/selection-preserved.png)                                                                                        |
| 고정 대상 검토 | 선택한 5개만 검토에 표시. 개별 대상의 path, Bundle ID, cask, 설치·요청 버전 확인. Vesslo에서 추가 확인해야 한다는 안내 표시                                          | [대상별 AX 기록](native-schema2-20260911/partial-failure-ax.txt)                                                                                    |
| 부분 실패      | 1개 `Completed — Verified by Vesslo`, 나머지 4개 실패인 합성 receipt를 전체 `Failed — Check Each Target`으로 표시. 새로고침 후에도 원래 대상과 결과 유지             | [부분 실패 화면](native-schema2-20260911/partial-failure.png), [읽기 전용 액션](native-schema2-20260911/partial-failure-actions.png)                |
| 독립 요청 목록 | `Homebrew Requests`에서 현재 export session의 요청을 조회. 목록·상세에 실패 상태와 원래 대상 표시, 재실행·삭제 없는 읽기 전용 안내                                   | [목록 화면](native-schema2-20260911/requests-list.png), [AX](native-schema2-20260911/requests-list-ax.txt)                                          |
| 검증 대기      | 1개 대상 선택·검토 후 합성 receipt의 `verificationPending`을 `Verification Pending`으로 표시. 완료로 추정하거나 재전송하지 말라는 안내. 액션은 새로고침·요청 ID 복사 | [대기 화면](native-schema2-20260911/pending.png), [액션](native-schema2-20260911/pending-actions.png), [AX](native-schema2-20260911/pending-ax.txt) |
| 전체 검사 중   | `checking` export에서 목록을 조회할 수 있지만 `REVIEW ONLY` 상태로 요청 전송·선택 실행 액션 차단. summary의 기본 액션은 요청 기록 조회                               | [검사 중 화면](native-schema2-20260911/checking.png), [액션](native-schema2-20260911/checking-actions.png)                                          |
| receipt 없음   | 검사 중 화면에서 요청 기록 조회 시 `No Request Receipts` 표시. URL 열기만으로 접수·완료를 확정할 수 없다는 안내                                                      | [빈 목록](native-schema2-20260911/no-receipts.png), [AX](native-schema2-20260911/no-receipts-ax.txt)                                                |

`receipts-pending`은 **이미 접수된 요청의 실제 결과 검증 대기** 시나리오다. receipt 자체가 없는 전송 직후의 접수 대기와 구분한다. 화면에 나온 시각은 fixture의 합성 시각이며 실제 앱 업데이트 시각이 아니다.

## 3. 검증 방법과 보존 결과

- `scripts/prepare-ui-fixture.cjs`로 `receipts-partial-failure`, `receipts-pending`, `schema2-checking`을 준비·자동 검증했다. 각 준비 결과는 7개 명령을 빌드하고 callback과 effect 경계를 검사했다.
- 독립 ID로 임시 개발 등록한 뒤, 실제 등록 디렉터리의 7개 JavaScript와 `package.json`을 검증된 fixture 산출물과 일치시켰다. 각 8개 파일의 SHA-256 증거: [partial](native-schema2-20260911/partial-artifacts.json), [pending](native-schema2-20260911/pending-artifacts.json), [checking](native-schema2-20260911/checking-artifacts.json).
- 실제 command/component UI를 사용하고 파일 reader, receipt hook, 외부 action은 합성·무효화된 adapter를 사용했다. 검토 클릭 2회는 CLI에서 `VESSLO UI FIXTURE: SIMULATED`로 기록됐다. 실제 Vesslo URL 전달, 앱 실행, Homebrew 업데이트를 수행하지 않았다.
- native에서 직접 연 명령은 `Bulk Homebrew Update`, `Homebrew Requests`다. 자동으로 빌드·검증한 7개 명령 전부를 이번 native 세션에서 수동 확인했다고 집계하지 않는다.
- 개발 CLI 3개를 Ctrl-C로 종료했다. 이 의도적인 종료의 exit 1은 빌드 실패가 아니다. 임시 등록 3개는 Raycast의 **Uninstall but Keep Settings**로 제거했다. [기존 Vesslo 등록 2개 보존](native-schema2-20260911/registration-cleanup.txt), fixture 명령 검색 결과 제거를 확인했다. 준비 artifact와 재현용 staging은 `.ui-fixtures`와 `.ui-fixtures-native`에 남겨 두었다.
- 운영 `raycast_data.json` SHA-256은 전후 `f1b14ca310eaf26eb85ecced23bf910ceaddc898acf6cde8009b58e00365c651`로 동일하고 `raycast_receipts.json`은 전후 모두 없음이다. 이는 이 두 파일의 보존 증거이며 운영 데이터 전체의 hash audit는 아니다.
- [이번 검증 manifest](native-schema2-20260911/manifest.json)에 source 비교, 운영 파일 비교, native 범위와 정리한 ID를 기록했다.
- 전체 207개 테스트, TypeScript, lint, 7개 명령 build 통과는 [이전 통합 검증](SCHEMA2_INTEGRATION_2026-09-10.md)의 결과다. 이번에는 해당 104개 파일이 동일함을 확인하고 native 검증을 추가했다. 전체 테스트를 다시 실행했다고 보고하지 않는다.

## 4. 앱 측에 남은 실기 경계

앱의 기존 XCTest 경로는 임시 저장소를 사용하지만 `Color.clear`를 표시하고 live runtime을 차단한다. 반대로 일반 Debug 앱을 실행하면 운영 복구와 자동 업데이트 scheduler가 시작될 수 있다. 따라서 기존 산출물을 단순 실행하는 것으로 운영 데이터와 분리된 Review UI 검증을 수행할 수 없다. 이는 **검증용 실행 경로의 부재**이며, 이번 조사에서 A–C 기능의 새 결함이 입증된 것은 아니다.

[앱 담당에게 전달할 전체 프롬프트](VESSLO_NATIVE_REVIEW_HARNESS_PROMPT.ko.md)에 실제 Review view/service, 실행 불가 executor, private receipt 파일, 명시적 test host 전달 경로를 요구하고 완료 조건을 정리했다. 해당 문서는 실제로 다른 작업에 전송하지 않았다.

앱 harness 반환 후에는 그 manifest와 고정된 격리 경로를 사용해 **Raycast fixture → 실제 Vesslo Review UI → 사용자 취소 → 실제 private receipt writer → 확장 reader 표시**를 연결한다. 실제 설치본 반영, 사용자 앱 업데이트, TCC/Terminal/Installer 및 운영 재시작 검증, 배포는 아직 수행하지 않았다.

변경 파일은 이 보고서, `docs/native-schema2-20260911/*`, 앱 전달 프롬프트, 이를 연결하는 README·인터페이스·fixture 안내 문서다. **워킹 디렉토리에만 수정, 커밋 안 함.**
