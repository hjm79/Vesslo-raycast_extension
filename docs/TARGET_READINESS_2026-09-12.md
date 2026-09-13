# Homebrew 대상별 준비 상태 연결 — 2026-09-12

## 현재 단계

> **9월 13일 최종 운영 상태:** 앱 `bdaad0cb…36caa`의 986개 테스트(982 통과·skip 4·실패 0), Debug/universal archive/Developer ID export와 독립 검증을 완료한 뒤 실제 설치본을 교체했다. 최신 확장은 317-test 빌드의 7개 명령·16개 파일로 설치돼 있다. 복구 폴더 검토·취소·명시 승인·원문 보존을 확인했고, 후속 화면 종료에 따른 복구 취소 문제도 수정했다. 새 설치본의 실제 KeyCastr 요청 `42733EA6-B861-4389-B98C-19AD927FBAA8`은 **0.10.5 → 0.11.1 업데이트 완료**, authoritative `completed` revision 5이며 설치 파일·Brew·Raycast 표시가 일치한다. 최신 근거와 검증 한계는 [9월 13일 검증 기록](INSTALLED_VALIDATION_2026-09-13.md)을 따른다. 아래 내용·미완료 표현·수치는 당시의 역사 기록이다.

확장의 schema 3 / Homebrew Review v2 / receipt v2 구현 및 native Review→Return 무실행→취소 receipt 연결을 검증했고, 첫 schema 3 앱과 확장을 운영 경로에 교체했다. 설치 앱은 `30945a70bc05d8c92a0e77a5269630c188a4aca4543a3282cffbceddb92e9fa4`이며 설치 확장 16개 파일은 당시 316개 테스트를 통과한 7개 명령 산출물과 일치한다. 11개 범위 전체 미러의 2,389개 기록을 최종 대조했다.

**실제 운영 스캔에서 추가 회귀가 발견되어 운영 요청 전송·실제 업데이트는 아직 각각 0건이다.** 정상적인 Homebrew 설치 정보 채우기를 외부 identity 변경으로 판단해, source 검사에 성공한 48개가 모두 `sourceUnverified`로 남았다. 강제 검사 revision 3까지 재현됐다. 앱 작업은 실제 scan-generated promotion 경로의 소스 수정과 회귀 검증을 완료했으며 최신 Focused-4 결과는 **702개 중 699 통과·기존 skip 3개·실패 0개**다. 이 수정이 포함된 Debug build·universal Release archive·Developer ID export와 독립 artifact 검증도 완료했다. 최종 준비 앱의 실행 파일 SHA-256은 `cee47b527f71a328f932d4208535e383f1ec3ec852b77948bf260314fac742ba`이며 재설치는 아직 완료되지 않았다.

확장은 해당 운영 상태의 실행을 계속 차단한다. 별도로 사용 가능한 대상이 0개인데도 Bulk 요약에 `CONFIRM IN VESSLO`를 표시하던 문제를 고쳐 **317/317 테스트·TypeScript·전체 lint·7개 명령 build**를 통과했다. 새 배지 수정 source/dist는 준비됐지만 아직 운영 확장에 재설치하지 않았다. 2026-09-12 12:30 UTC에는 CUA가 Mac 잠금 상태로 UI 조작을 거부해 사용자 잠금 해제 응답을 기다리고 있다. 후속 서명 artifact도 검증 완료했으며 잠금을 우회하지 않았다., 첫 설치 완료·후속 수정 소스 완료·새 artifact 준비·운영 검증 완료를 구분한다.

앱 소스는 기존 「Vesslo 메인 개발 인수 및 앱 패치 마감」 작업이 담당한다. 확장 소스·소비자 테스트·설치 연동은 이 작업이 담당한다. 앱은 `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`의 `cad2418` + 기존 dirty, 확장은 `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`의 `af13e51` + 기존 dirty에서 시작했다. 원본 저장소와 보호 `UpdateCheckService.swift` 수정은 요청하지 않았다.

## 1. 원인과 변경 계약

앞선 [실제 설치 보고서](INSTALLED_INTEGRATION_2026-09-12.md)에서 전체 검사 완료 후에도 Luminar Neo·Vesslo의 Sparkle 실패가 전역 `failed/sourceFailure`를 만들고 모든 Homebrew 요청을 막는 것을 확인했다. 실패를 숨기거나 전역 gate를 제거하는 대신, 전체 검사 완료와 선택한 대상의 Homebrew 검사 증거를 구분한다.

| 경계            | 새로운 계약                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| 공개 export     | schema 3, 기존 `checkPhase`, `checkReason`, `checkedInventoryRevision` 의미 유지                          |
| 전체 검사 완료  | `completedInventoryRevision == inventoryRevision`, `completedCheckRevision == checkRevision`              |
| 협상 capability | `homebrewReviewV2`, `homebrewTargetReadinessV1`, `requestReceiptsV2` 모두 필요                            |
| 대상별 증거     | 원래 6개 대상 identity, Homebrew source, state, session/check/inventory, UUID evidence, 검사·만료 시각    |
| 증거 수명       | 최대 900초, 미래 허용 30초. 완료 검사와 현재 시각을 모두 대조                                             |
| 요청            | schema 2, `vesslo://review-homebrew/v2?payload=…`, 각 대상에 원래 `readinessEvidenceId` 포함              |
| receipt         | envelope 2에 receipt 2/request 2와 기존 receipt 1/request 1 history 공존. envelope 1에는 history 1만 허용 |

정확한 Swift 계약은 [RaycastHomebrewReadinessV2.md](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastHomebrewReadinessV2.md)를 따른다. 기존 schema 2 소비자는 schema 3을 거부한다. 새 capability를 광고하고 증거를 빠뜨린 데이터를 V1 요청으로 낮춰 보내지 않는다. 실패한 source의 정보는 계속 표시한다.

## 2. 확장 구현

- `types.ts`, `data.ts`: schema 3과 readiness 배열을 읽고 필수 필드·identity·UUID·중복·최대 크기·시각 구조를 검사한다. optional null은 생략된 값과 동일하게 처리한다. `failed/unverified`는 evidence와 시각이 없어야 하고 정확한 reason을 요구한다.
- `data-state.ts`, 새 `homebrew-readiness.ts`: Homebrew에만 별도 cohort와 대상 증거를 적용한다. 일반 Sparkle·App Store·manual 실행은 전역 ready 조건을 유지한다. 오래된 source-health 성공 시각이나 실패 기록의 부재를 준비 증거로 사용하지 않는다.
- `handoff-execution.ts`: await 전에 대상·revision·증거 전체 fingerprint를 고정한다. 디스크 강제 재조회 후 동일한 대상과 proof를 대조하고 원래 120초 요청 수명을 유지한다. proof UUID가 같아도 내부 시각 등이 바뀌면 거부한다. 일부 대상을 몰래 제거한 부분 전송은 하지 않는다.
- `handoff-contract.ts`, `receipt-contract.ts`: URL 경로와 요청 schema를 일치시키고 proof를 직렬화·보존한다. receipt fingerprint에 버전·proof·원래 대상 순서를 포함한다. envelope 1에 신규 receipt 2를 넣는 downgrade도 거부한다.
- `action-policy.ts`, `bulk-homebrew-update.tsx`: 선택한 대상의 proof 변화·만료만으로 선택을 재검증한다. 무관한 대상의 실패나 전역 `failed → ready` 전환은 정상 선택을 불필요하게 폐기하지 않는다.
- `data-reader.ts`, `DataStateNotice.tsx`: 파일 내용이 같아도 증거 만료 시 준비된 대상 수를 다시 계산해 화면을 갱신한다. 전체 실패와 `HOMEBREW CHECKED`를 함께 표시하며 경로 접근 권한까지 보증하지 않는다.
- `HandoffRequestStatus.tsx`, `handoff-requests.tsx`: 원래 proof를 표시하고 schema 3의 같은 session receipt를 현재 기록으로 분류한다. V1은 읽기 전용 기록이며 새 실행 권한이 아니다.
- `scripts/native-review/transport.py`, `scripts/ui-fixture/*`: 새 계약을 합성 transport와 UI fixture에 적용했다. 기존 V1 역사 fixture는 보존했다. 합성 transport를 운영 URL 전달에 사용하지 않는다.

## 3. 현재 검증 결과

- [최신 전체 자동 테스트](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/tests.log): **317/317 passed, 0 failed, 0 skipped**.
- [최신 TypeScript](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/typecheck.log), [전체 lint](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/lint.log), [7개 명령 build](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/build.log): 모두 성공.
- 추가 Bulk 회귀는 미검증 증거·경로 거부·검색 결과 없음·시간만료로 실제 검토 가능한 대상이 0개면 `REVIEW ONLY`를 표시하고, 검색에서 숨겨진 유효 선택은 유지하는지 검사한다. 실제 action/proof gate는 변경하지 않았다. 새 [source/dist 전달 manifest](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/final-extension-delivery-manifest.json)는 준비된 산출물 기록이며 아직 설치 완료 기록은 아니다.
- source failure와 유효 대상 증거의 공존, 검사 중·부분 cohort·잘못된 session/revision·대상 identity 변경·누락/실패/만료 증거, 강제 재조회 중 객체 변조, 동일 proof ID의 내용 변경, 선택하지 않은 대상의 실패, 버전 downgrade와 receipt 원본 보존을 검사했다.
- UI 자동 fixture는 23개 시나리오 × 7개 명령을 비실행 환경에서 빌드·렌더링했다. 실제 Raycast 창이나 실제 Vesslo 실행 결과로 계산하지 않는다.
- 독립 정적 검토에서 envelope 1의 신규 receipt 수용 누락을 발견해 수정했고 downgrade 회귀를 추가했다. 검토에서 지적한 상태를 남은 미수정 문제로 오인하지 않도록 수정 후 테스트를 기록한다.

앱 소유 익명 계약 예시 27개와 manifest를 [fixtures/app-readiness-v2](../tests/fixtures/app-readiness-v2/)에 원본 바이트로 보존했다. manifest SHA-256은 `0028fcefb14cd69b59d9cc12299abf90e09be4c9f59e1d80aab896869ca45d03`이다. 27개 원본 해시, export 11개·request 7개·receipt 7개의 실제 TS 소비를 검사했다. 내부 lookup 2개는 원본 해시를 검사했다. **수작업 익명 계약 예시이며 Swift 자동 생성물·운영 데이터가 아니다.**

위 focused 결과를 최신 전체 317개에 다시 더하지 않는다. 첫 schema 3 설치 전의 [316개 결과](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/tests.log)와 [당시 명령 기록](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/extension-validation.json)은 보존했다. 앞선 228개 테스트나 앱의 이전 188개 테스트도 최신 결과에 합산하지 않는다. 새 [extension-validation.json](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/extension-validation.json)에 최신 명령과 종료 상태를 기록했다.

첫 schema 3 앱 산출물 단계의 [Focused-5 요약](/private/tmp/VessloReadiness-20260912/focused-final-v2-summary.json)은 **688개 중 685 통과, 기존 조건부 skip 3개, 실패 0개**였다. [전체 로그](/private/tmp/VessloReadiness-20260912/focused-5.log)와 [xcresult](/private/tmp/VessloReadiness-20260912/Focused-5.xcresult)에 22개 관련 테스트 클래스의 당시 결과가 남아 있다. 증거 발급 scope·수신·확인·late gate·원래 대상과 request 소유 completion·실행 전 metadata 대조·native IO 및 자동 업데이트 회귀를 포함한다. metadata probe와 실행 환경은 가짜 Brew 프로세스로 검사했다. skip은 실제 Installer, 별도 프로세스 재시작, recovery sheet 키보드의 기존 opt-in 항목이며 실기 통과로 계산하지 않는다.

운영 scan-promotion 회귀 수정 후 최신 앱 [Focused-4 요약](/private/tmp/VessloScanReadiness-20260912/focused-4-summary.json)은 **702개 중 699 통과·기존 skip 3개·실패 0개**다. 새 state 회귀 10개와 실제 스캔 경로를 연결한 integration 회귀 4개를 포함한다. [focused-4.log](/private/tmp/VessloScanReadiness-20260912/focused-4.log)에 이번 실행을 기록했으며, 앞선 688개 실행을 최신 수에 다시 합산하지 않는다. 이 수정이 포함된 Debug build·universal Release archive·Developer ID export 및 공식 archive/final gate가 모두 통과했다. [새 설치 후보](/private/tmp/VessloScanReadiness-20260912/export/Vesslo.app)의 실행 파일 SHA-256은 `cee47b527f71a328f932d4208535e383f1ec3ec852b77948bf260314fac742ba`, 전체 번들 composite는 `362b73529feb91cc75a785d91acb9f29cdcd3e9ce9142aaf9719515e41b99edc`다. 버전 `2.0.1 (28)`, Team `54V3JMN338`, 모든 Mach-O 6개가 universal이며 harness marker/symbol은 0이다. 독립 검토가 전체 번들 134개 항목과 서명·실제 Release 입력 각 213개를 대조했다. [앱 전달 manifest](/private/tmp/VessloScanReadiness-20260912/delivery-manifest.json), [상세 artifact 검사](/private/tmp/VessloScanReadiness-20260912/artifact-verification.json), [새 스캔 경로 검증 문서](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastScanReadinessValidation2026-09-12.md)에 연결한다. 이 후보는 아직 설치하지 않았다.

첫 schema 3 앱의 Debug build, arm64+x86_64 Release archive, Developer ID export 및 archive/final artifact 검증은 모두 통과했다. 당시 산출물인 [export/Vesslo.app](/private/tmp/VessloReadiness-20260912/export/Vesslo.app)의 main binary SHA-256은 `30945a70bc05d8c92a0e77a5269630c188a4aca4543a3282cffbceddb92e9fa4`이며 이 앱은 운영 경로에 설치했다. 버전은 `2.0.1 (28)`, team은 `54V3JMN338`이며 harness는 Test에만 존재함을 실제 입력과 바이너리에서 확인했다. [당시 artifact manifest](/private/tmp/VessloReadiness-20260912/artifact-verification-final.json)와 [앱 검증 기록](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastReadinessValidation2026-09-12.md)에 소스 동결·서명·입력 보존 범위를 기록했다. 이 hash는 후속 scan-promotion 수정 앱의 hash가 아니며 공증·공개 배포 완료도 뜻하지 않는다.

## 실제 native 연동 오류 수정과 재검증

첫 schema 3 native run은 요청 전송 전에 확장 decoder에서 차단됐다. 실제 Test export의 `lastUpdateCheckAt`은 `2026-09-12T12:00:43.112Z`였지만 `exportedAt`은 `2026-09-12T12:00:43Z`였다. Harness가 export 시각만 소수초를 절삭해 완료 시각이 export보다 미래가 된 것이다. 앱 담당 작업은 **Test 전용 직렬화를 동일 timestamp helper로 통일하고 고정 `.112`초의 정상·전역 실패 회귀를 추가해 수정·검증을 완료했다.** 소비자 검증이나 운영 파일을 바꾸지 않았다. 운영 writer의 두 시각은 모두 초 정밀도였고, Test 수정 이후에도 Debug·Release 입력이 원래 production 빌드 SHA와 일치함을 [입력 보존 기록](/private/tmp/VessloReadiness-20260912/production-input-preservation-after-harness-fix.json)으로 확인했다.

이 run의 실제 요청·receipt·executor 호출은 모두 0이다. 오류 원본과 Raycast AX는 [native-timestamp-rejection](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-timestamp-rejection)에 보관했다. 임시 등록 `vesslo-native-review-mtyc3dtw-d07b72`의 watcher를 종료하고 해당 등록만 설정 보존 옵션으로 제거했다. PID 83819의 전용 host와 storage root도 정확한 driver identity 검사 후 정리했다. 이 결과는 native Review 성공으로 계산하지 않는다.

수정 후 새로 동결한 [frozen-test-v2/Vesslo.app](/private/tmp/VessloReadiness-20260912/frozen-test-v2/Vesslo.app)의 `source-failure` 격리 harness를 실제 Raycast와 연결했다. 기존 실패 binary의 결과를 재사용하지 않았다. 공개 export는 `failed/sourceFailure`를 유지하면서 합성 Alpha·Beta·Gamma 3개 대상의 현재 긍정적 Homebrew 증거를 제공했고, 원래 대상 순서와 proof를 보존한 request `B51F777D-3AE7-4B8D-A150-4DDCD37EF010`을 전달했다.

| 단계         | 실제 확인 결과                                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review 수신  | 실제 native Review UI에 3개 원래 Bundle ID·경로·cask·설치/목표 버전 표시. request 2의 원래 대상·proof를 보존한 `accepted`, revision 1 확인.             |
| Return       | native 화면에서 Return을 눌러도 실행되지 않고 receipt revision 1과 내용 유지.                                                                           |
| 취소         | native 취소 후 원래 3개 대상 모두 `cancelled/userCancelled`, revision 2. 원래 request와 evidence ID는 그대로 유지.                                      |
| Raycast 연결 | 이미 열려 있던 같은 request 화면에서 Cancelled 반영. 별도 Homebrew Requests에서도 `Current Export Session`의 같은 request·revision 2·원래 proof를 표시. |
| 종료·정리    | 전달 1회, executor 호출 0회. 임시 등록과 watcher 제거, 정확한 host PID 94217 종료 및 전용 저장소 정리. 기존 production `hjm79/vesslo` 등록은 보존.      |

[검증 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-verification.json), [Review AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-accepted/review-ax.txt), [Return 뒤 receipt](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-return/raycast_receipts.json), [같은 Raycast 화면 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-cancelled/raycast-same-view-ax.txt), [현재 session 목록 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-cancelled/raycast-history-ax.txt), [종료 증거](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-closed/evidence.json), [저장소 정리 기록](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-cleanup.json), [등록 정리 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-v2-registration-cleanup-ax.txt)를 보관했다. 이 결과는 schema 3/request 2의 실제 native 수신·취소·파일 receipt 연결을 증명하며, 운영 설치 대상의 Homebrew 업데이트나 completed receipt를 증명하지 않는다.

이 합성 request `B51F777D-3AE7-4B8D-A150-4DDCD37EF010`의 검증은 첫 설치 전 동결 코드의 결과로 보존한다. 이후 발견한 실제 scan-promotion 회귀와 그 수정 앱의 운영 경로 검증을 대신하지 않는다.

## 4. 앱 실행 경계와 남은 설치 검증

앱 작업은 비밀번호를 기다리는 grouped/password Terminal 경로에서 각 cask mutation 직전 재검증을 보장할 수 없어 신규 V2 요청을 `notExecutable`로 거부하도록 했다. 확장이 이 경로를 다른 실행 방식으로 우회하지 않는다.

실제 업데이트 preflight에서 기존 `.homebrew` 환경은 metadata 자동 갱신을 금지하지 않고, `brew upgrade` 직전에 요청의 목표 버전과 실제 cask metadata를 직접 대조하지 않는다는 점도 확인했다. 앱 작업은 V2 전용 `.homebrewPinnedMetadata` 환경과 읽기 전용 metadata probe를 구현·검증했다. `brew info --cask --json=v2 <canonical-cask>`에서 단일 cask·canonical token·기존 checker와 동일한 comma build 분리 후 목표 버전·비어 있지 않은 Brew 설치 기록을 대조한다. probe와 upgrade/fetch는 `HOMEBREW_NO_AUTO_UPDATE=1`, `HOMEBREW_FORCE_API_AUTO_UPDATE` 제거를 적용한 같은 환경을 사용하며, 비동기 probe 후와 실제 spawn 직전에 proof·identity·권한을 다시 검사한다. 일반 앱 업데이트의 환경 정책은 변경 범위가 아니다.

수동 Installer 경로도 fetch 전과 artifact 준비 전후에 metadata를 확인하고 opener 직전까지 원래 요청을 검사한다. installed mutation 또는 Installer open 전의 거부는 `blocked/notStarted`로 구분한다. 이는 이미 수행한 다운로드·cache 조회·복구 파일 준비가 없었다는 뜻은 아니다. 환경 고정은 해당 child의 자동 갱신을 막지만 다른 Brew 프로세스의 cache/tap 변경을 전역으로 잠그거나 probe와 spawn 사이의 외부 metadata 교체를 원자적으로 차단하지 않는다. 실행 후 strict installed-bundle 검증과 원래 request 소유 completed receipt는 계속 필요하다. 정확한 계약과 이 한계는 [앱 계약의 실행 직전 metadata 대조](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RaycastHomebrewReadinessV2.md)에 기록돼 있다.

첫 schema 3 앱·확장 교체와 그 이전 동결 Test의 native 취소 연결은 완료했다. 후속 scan-promotion 소스 수정과 702개 앱 테스트, Bulk 표시 수정과 317개 확장 테스트도 완료했지만 수정된 앱의 서명 artifact도 완료했고 두 산출물의 재설치가 남았다. **남은 순서는 사용자 잠금 해제 확인 → 대상 프로세스 종료 후 다음 11개 범위 전체 미러 백업 → 수정 앱·최신 확장 교체 → 실제 운영 export의 대상별 증거 확인 → 운영 대상 검토·취소와 같은 요청의 cancelled receipt 확인 → 허용된 실제 업데이트 1건의 설치 버전·authoritative completed 확인이다.**

12:30 UTC의 Mac 잠금으로 CUA가 UI 접근을 거부했고 사용자에게 직접 잠금 해제를 요청한 상태다. UI 확인을 다른 경로로 우회하지 않았다. [운영 대기 상태](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/pending-runtime.json)에 첫 schema 3 설치 hash, 현재 검사 revision 3의 `ready 0 / failed 0 / unverified 48`, 운영 mutation 요청 0건·실제 업데이트 0건과 준비됐지만 미설치인 확장을 구분해 기록했다.

현재 설치 Vesslo의 검증 실행은 프로세스 인자 `-enableAutoUpdate NO`를 사용하고 영구 자동 업데이트 설정은 원래 `true`를 보존하고 있다. 새 검증 실행에서도 이 구분을 유지해야 한다. 실제 업데이트 후보를 정하더라도 실행 전 경로·버전·실행 중 여부와 전체 복구 범위를 다시 확인한다.

공개 릴리스·Store 게시·공증·커밋은 수행하지 않았다. **워킹 디렉토리에만 수정, 커밋 안 함.**
