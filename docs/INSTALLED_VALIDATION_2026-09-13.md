# Vesslo·Raycast 설치 및 운영 검증 — 2026-09-13

**최신 앱과 Raycast 설치 및 허용된 실제 업데이트 1건의 완료 검증을 마쳤다. KeyCastr가 0.10.5에서 0.11.1로 바뀌었고, 같은 요청의 authoritative receipt·설치 파일·Homebrew 기록·Raycast 완료 화면이 모두 일치한다.** 앞선 취소·거부와 중간 산출물은 아래에 당시 결과로 보존한다.

| 항목              | 최종 확인 상태                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vesslo 설치       | `bdaad0cb…36caa`, 2.0.1 (28), universal Developer ID Team 54V3JMN338. 전체 번들과 서명 일치.                                                         |
| Raycast 설치      | 317-test 빌드의 7개 명령·16개 런타임 파일 일치.                                                                                                      |
| 이번 앱 자동 검증 | 986개 중 982 통과·기존 skip 4개·실패 0개. 새 회귀 15개, Debug/archive/export 성공.                                                                   |
| 운영 복구         | 앞선 1ebc 앱에서 검토·취소·Return 무변경·명시 승인·원문 보존 확인. 새 bdaad 앱에서 승인된 상태로 정상 재시작.                                        |
| 실제 업데이트     | KeyCastr 0.10.5 → 0.11.1 한 건. 요청 42733EA6…FBAA8, completed revision 5.                                                                           |
| 결과 대조         | 실제 설치 버전·실행 파일 SHA·Brew metadata·Raycast Completed 화면 일치.                                                                              |
| 남은 검증 한계    | 새 bdaad 앱의 승인 직후 UI 수명은 XCTest로 검증. 전용 root-binding native harness, 실제 TCC 거부·Installer 경로·공개 배포는 이 결과에 포함하지 않음. |

## 1. 첫 설치본과 확장의 교체 증거

첫 교체 당시 운영 앱 경로는 `/Applications/Vesslo.app`이다. 현재 후속 설치본은 아래 8절의 `1ebc2c46…6dac96`으로 구분한다. 설치 원본 `/private/tmp/VessloScanReadiness-20260912/export/Vesslo.app`과 전체 번들이 일치하고, 옮겨 보관한 기존 앱도 전체 미러와 일치했다. main executable SHA-256은 **`cee47b527f71a328f932d4208535e383f1ec3ec852b77948bf260314fac742ba`**, architecture는 arm64+x86_64, Developer ID team은 `54V3JMN338`이다. 버전 표시는 `2.0.1 (28)` 그대로이므로 이전 `30945a…9fa4` 설치본과 hash로 구별한다. [설치 journal](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/installed-app-journal.json)

Raycast의 실제 `~/.config/raycast/extensions/vesslo`에 7개 명령의 런타임 16개 파일을 반영했고, 모두 최종 전달 manifest와 일치했다. 사용 가능한 대상이 없으면 Bulk 요약도 `REVIEW ONLY`로 표시하는 수정이 포함돼 있다. [확장 설치 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/installed-extension-verification.json) · [최종 전달 manifest](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/final-extension-delivery-manifest.json)

실기 후 00:53 UTC의 재확인에서도 런타임 16개 파일은 동일했고, 확장 비교 대상 300개 파일의 source drift는 0이었다. 설치 앱 `cee47b…42ba`와 보호 `UpdateCheckService.swift` hash도 다시 확인했다. 이는 기록한 비교 대상의 보존 증거이며 모든 운영 데이터의 불변성을 뜻하지 않는다. [실기 후 artifact 재확인](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/post-runtime-artifact-verification.json)

`vesslo` URL의 기본 handler와 실제 해석 경로는 `/Applications/Vesslo.app`으로 확인했다. 실제 실행 증거도 이 경로이며, 검증 실행에는 `-enableAutoUpdate NO` 인자를 사용했다. 영구 자동 업데이트 설정과 이번 실행 인자를 구분한다. [URL handler 확인](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/handlers-installed.json) · [운영 실행·첫 검사 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/installed-check1/summary.json)

## 2. 백업과 보존 증거의 범위

대상 프로세스를 종료한 뒤 **11개 범위 전체 미러, 2,380개 기록**을 만들고 최종 대조했다. 백업은 [VessloScanPromotion 전체 미러](/Users/hjm/Documents/Vesslo-Backups/VessloScanPromotion-20260912-8crpqoyo)에 보관했다. 앞선 설치의 2,389개 기록과는 다른 실행의 결과다. [이번 백업 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/backup-summary.json)

첫 운영 검증 후 Vesslo와 Raycast를 정상 종료한 상태에서 다음 설치를 준비했다. 다음 bootstrap 수정본 설치를 준비하면서 **새 11개 범위 전체 미러, 2,385개 기록**의 최종 대조도 완료했다. 새 백업은 [VessloBootstrapFix 전체 미러](/Users/hjm/Documents/Vesslo-Backups/VessloBootstrapFix-20260913-8crpqoyo)에 보관하며, 이전 2,380개 기록도 그대로 유지한다. 후속 `1ebc2c46…6dac96` 교체는 이 전체 미러를 재대조한 뒤 진행했으며, 옮긴 원본 `cee47b…42ba`도 같은 백업 아래 보존했다. [다음 설치용 백업 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/backup-summary.json)

이번 05:06 UTC native 실기를 시작하기 전에도 대상 프로세스를 종료하고 **새 11개 범위 전체 미러, 2,385개 기록**을 최종 대조했다. [VessloNativeRecovery 전체 미러](/Users/hjm/Documents/Vesslo-Backups/VessloNativeRecovery-20260913-0506)와 [검증 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/backup-summary.json)을 추가로 보관한다. 앞선 두 백업과 별개의 시점이며 비교 항목·OS 관리 컨테이너 제외·metadata 검증 한계는 아래와 같다.

비교한 항목은 상대 경로·파일 종류·POSIX mode·파일 크기·내용 SHA-256·symlink 대상이다. `ditto`에 resource fork·extended attribute·ACL 보존 옵션을 요청했지만, 이 세 항목과 owner/group은 독립적으로 비교하지 않았다. 순차적인 일관성 검사이며 파일시스템 snapshot이나 모든 writer를 차단하는 잠금은 아니다.

OS 관리 `~/Library/Containers/com.raycast.macos.RaycastAppIntents`는 `.com.apple.containermanagerd.metadata.plist` 읽기가 거부되어 복사하지 않았다. 이 컨테이너는 설치·등록 변경 범위에서 제외했다. 따라서 이 컨테이너까지 백업했다거나, 검증하지 않은 metadata까지 동일하다고 표현하지 않는다.

전체 미러의 확인과 설치 번들 일치가 **이번 실행 전후 모든 운영 데이터의 불변성**을 입증하는 것은 아니다. 실제 스캔·export·receipt 생성과 Homebrew API cache 갱신이 있었다. 이전 변경 귀속 기록에도 작성자를 확정하지 못한 항목이 남아 있다. 전체 운영 데이터·모든 metadata가 보존됐다는 포괄적 완료 주장은 하지 않는다.

## 3. 운영 데이터와 7개 명령의 실제 화면

첫 전체 검사에서 `checkRevision == completedCheckRevision == 1`, `inventoryRevision == completedInventoryRevision == 63`을 확인했다. 전역 상태는 `failed/sourceFailure`이며 이를 숨기지 않았다. scan-promotion 수정 전에는 48개 모두 미검증이었지만, 이번 설치본의 09:36 KST 관측에서는 **Homebrew ready 증거 48개**가 게시됐다. 이 증거는 해당 시점·session·revision·identity에 한정된다. [검사 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/installed-check1/summary.json)

확장에 표시된 수는 **43개**였다. 나머지 업데이트 대상 Word·Outlook·Excel·PowerPoint·OneNote 5개는 `microsoft-office`라는 같은 cask를 공유한다. 해당 cask를 사용하는 설치 앱은 Defender·OneDrive까지 총 7개이므로, 하나의 앱 UUID를 선택해도 cask 실행 대상을 독립적으로 확정할 수 없는 중복 설치 정책에 따라 제외된다. 48개는 원시 source 증거 수, 43개는 확장 정책을 통과한 표시 수로 집계 기준이 다르다. 개별 요청에는 경로·권한·현재 proof·앱 실행 경계의 추가 검사가 적용된다.

Search Apps·View Updates·Bulk Homebrew Update·Browse by Tag·Review Apps·Deleted Apps·Homebrew Requests의 **7개 명령을 실제 Raycast에서 열었다.** View Updates는 82개 업데이트/48개 Homebrew 후보, Review Apps는 122개 검토 기록, Deleted Apps는 11개 삭제 기록을 표시했다. 전체 실패 안내와 `HOMEBREW CHECKED: 43`이 함께 노출됐다. [Search 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/search-apps-ax.txt) · [Updates 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/updates-ax.txt) · [Tag 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/browse-by-tag-ax.txt) · [Review 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/review-apps-ax.txt) · [Deleted 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/deleted-apps-ax.txt)

Bulk 검색 결과가 0개일 때 요약은 `REVIEW ONLY`였고 확인을 제안하지 않았다. 이어 같은 열린 Bulk 화면에서 실제 15분 증거가 00:50 UTC 무렵 자연 만료되자 snapshot·선택 요약이 자동으로 `REVIEW ONLY`로 바뀌었다. 48개 후보 행은 읽기 전용으로 남았다. 운영 export를 덮어쓰거나 가짜 시각을 주입한 테스트가 아니다. [0개 검색 결과 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/bulk-zero-candidates-ax.txt) · [자연 만료 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/bulk-expired-proof-ax.txt) · [자연 만료 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/command-smoke/bulk-expired-proof.png)

## 4. 운영 Apparency 검토·취소 완료

실제 설치된 `/Applications/Apparency.app`, Bundle ID `com.mothersruin.Apparency`, cask `apparency`, 버전 `3.2 → 3.3`의 정확한 요청을 전송했다. request ID는 **`F46A08E0-B0AD-4845-A2D6-BB69DE8FD209`**다.

1. 운영 Vesslo의 실제 native Review UI에 원래 대상이 표시되고 schema 2 receipt가 `accepted`, revision 1로 생성됐다.
2. Return을 눌러도 receipt가 변하지 않았으며 업데이트 실행으로 넘어가지 않았다.
3. 취소 후 같은 request가 `cancelled/userCancelled`, revision 2가 됐다. 원래 request·대상·readiness evidence ID가 보존됐다.
4. 이미 열려 있던 같은 Raycast request 화면에서 취소 상태를 확인했다. 관측한 Vesslo·Apparency·KeyCastr 번들의 설치 버전과 executable hash도 바뀌지 않았다.

[검토·취소 검증 요약](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-review-verification.json) · [운영 Review AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-review-accepted/review-ax.txt) · [Return 뒤 상태](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-review-return/summary.json) · [취소가 반영된 같은 Raycast AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-review-cancelled/raycast-ax.txt)

이것은 운영 요청의 수신·명시적 취소·파일 receipt·Raycast 표시 연결의 완료 증거다. Apparency 업데이트 성공을 뜻하지 않는다. 전날의 합성 `B51F…` 3개 대상 취소 기록과도 별개의 운영 검증이다.

## 5. KeyCastr 실제 확인은 거부됨 — 업데이트 0건

`/Applications/KeyCastr.app`, Bundle ID `io.github.keycastr`, cask `keycastr`, 버전 **`0.10.5 → 0.11.1`**의 request **`0977DC2B-B95E-42D5-8A48-97469E0D6FFC`**를 보냈다. 최초 수신은 `accepted`, revision 1이었다. 실제 앱에서 확인한 뒤 최종 receipt는 **`rejected/notExecutable`, revision 5**로 남았다. 원래 target과 proof는 보존됐고, 설치 버전은 **0.10.5 그대로**였다. authoritative `completed`는 없으며 실제 업데이트 성공은 0건이다. [최초 accepted 기록](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-update-accepted/summary.json) · [최종 거부와 설치 버전](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-update-lock-failed/summary.json) · [Homebrew Requests 실기 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-update-lock-failed/raycast-history-ax.txt)

실행 전 Vesslo 목표는 0.11.1이었고 초기 Homebrew CLI 조회의 내부 packages cache는 0.11.0을 보고했다. root의 `brew config` 조회 과정에서 00:39:46 UTC에 API cache가 갱신된 뒤 다시 조회한 목표는 0.11.1로 일치했다. 두 조회 모두 `installed`는 0.10.5였다. 이는 **metadata/cache 갱신이며 패키지 업데이트가 아니다.** 오래된 별도 API 파일의 날짜만으로 초기 CLI 결과의 직접 원인을 단정하지 않는다. [초기 CLI metadata](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/keycastr-preflight-brew.json) · [갱신 후 CLI metadata](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/keycastr-preflight-after-config.json)

## 6. 첫 운영 실행의 차단 원인과 후속 작업

화면에는 “다른 Homebrew 작업이 실행 중이거나 lock 파일이 남아 있습니다”라고 표시됐지만, 현재 조사에서는 단순한 외부 Brew lock 충돌로 확정하지 않았다. 앱 콘솔에는 launch recovery가 완료되지 않아 자동 업데이트 scheduler를 시작하지 않았다는 **검증 저장소 quarantine** 기록이 있다. 별도 관측에서 실행 중인 Brew 프로세스는 없었으며, 기존 lock 파일의 존재만으로 실제 경합을 입증하지 못한다. [운영 콘솔 AX](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/production-update-lock-failed/vesslo-console-ax.txt) · [Homebrew 프로세스·lock 관측](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/homebrew-lock-observation.json)

앱 담당 작업에 전달해 추적한 코드 경계는 다음과 같다.

- `bootstrap-review-pending`에서 launch reconcile을 요구하지만, 그 gate가 복구 closure 자체를 차단하여 복구할 수 없는 순환이 생긴다.
- typed quarantine의 `ownershipUnconfirmed`가 일반 Homebrew lock 오류로 변환되어 사용자에게 잘못된 원인을 보여 준다.
- 콘솔의 `InAppTerminal ownership check`에는 process group signal의 `Operation not permitted`도 별도로 관측됐다. 이 EPERM 기록만으로 위 순환 차단과 동일 원인이라고 단정하거나 TCC 거부라고 확정하지 않는다.

앱 담당 「Vesslo 메인 개발 인수 및 앱 패치 마감」 작업(`01a08b04-0f26-7030-919b-00426f6002fc`)은 다른 실행에서 빌려 쓸 수 없는 bootstrap preparation token, 정상 mutation gate 재획득, 취소·재시도 및 오류 분류 수정을 완료했다. 새 서명 artifact의 main SHA는 `74c5af4f86b7fd15f9adac2fc87c90985fcfd790d9aaf5e0f997ab7aef1713c7`이며 **아직 설치하지 않았다.** [전달 manifest](/private/tmp/VessloRecoveryAdmission-20260913/delivery-manifest.json) · [앱 수정 검증 문서](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RecoveryBootstrapValidation2026-09-13.md)

설치 전 01:22 UTC의 독립 읽기 검사에서 별도 차단을 확인했다. 운영 `UpdateRecoveryResolutionJournal` 디렉터리의 marker가 저장한 `systemNumber`는 `16777229`, 현재 `st_dev`는 `16777230`이다. inode `198748156`, uid `501`, mode `0700`은 일치하지만 `validateRootMarker`의 전체 identity 비교는 실패한다. `resolutions.json`은 없고 marker는 정상 JSON이다. 정확한 상태는 **journal 파일 없음 + root identity 검증 실패**이며 검증된 빈 journal이 아니다. 재부팅 또는 마운트 변경이 실제 원인인지는 확정하지 않았다. [원문·현재 identity 비교](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/journal-root-identity-observation-20260913T0122Z/comparison.json)

이 추가 원인 때문에 `74c5…13c7` 설치를 보류했고, 이 중간 후보는 설치하지 않았다. 이후 앱 담당이 장기 identity와 명시적 복구 검토를 구현·검증한 최종 후보를 전달했으며 8절처럼 교체했다. 운영 marker·journal·lock은 수동 수정하거나 삭제하지 않았다. 다음 설치용 전체 미러 11개는 이 시점에도 원본과 모두 일치했다. [백업 재대조](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/backup-recheck-after-bootstrap-artifact.json)

이 시점에 계획했던 잠금 해제·새 앱 실행·복구 검토의 취소와 Return 무변경·명시 승인·새 전체 검사는 이후 9절에서 실제 확인했다. 기존 만료·거부 request는 재생하지 않고 새 요청을 보냈으나 별도의 manual-installer launch recovery gate에서 거부됐다. 이후 이 후속 실행 차단 수정과 실제 업데이트·authoritative `completed` 검증도 10절처럼 완료했다.

## 7. 산출물별 자동 검증과 실기의 구분

첫 설치본 `cee47b…42ba`는 **2026-09-12 Focused-4의 총 702개 중 699 통과·기존 조건부 skip 3개·실패 0개**를 검증한 산출물이다. 확장은 같은 날 **317/317**, TypeScript·전체 Raycast lint·7개 명령 build를 통과했다. **이 수치는 9월 13일에 다시 실행한 테스트 수가 아니다.** 오늘 새로 확인한 것은 전체 미러와 설치 바이트, 실제 프로세스·URL handler, 운영 source proof, 7개 명령 화면, Apparency 취소, KeyCastr 거부, 자연 만료 동작이다. [전날 앱 결과](/private/tmp/VessloScanReadiness-20260912/focused-4-summary.json) · [전날 확장 명령 결과](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/promotion-fix/extension-validation.json)

별도 bootstrap 수정 후보는 오늘 **Focused-5 총 894개 중 890 통과·기존 조건부 skip 4개·실패 0개**이며 Debug build, universal Release archive, Developer ID export를 통과했다. 이는 미설치 `74c5…13c7` 후보의 자동 검증 결과로, 현재 설치본의 702개 결과나 운영 업데이트 성공에 합산하지 않는다. 이 테스트에는 뒤늦게 발견한 운영 root device 번호 불일치 해결 증거가 없다. [후보 테스트 요약](/private/tmp/VessloRecoveryAdmission-20260913/focused-5-summary.json)

**이전 단계 완료:** 복구 앱·확장 설치, 첫 설치본의 운영 Review/취소·7개 명령·자연 만료, 1ebc 앱의 복구 검토·취소·명시 승인·원문 보존과 bootstrap confirmed. 최종 bdaad 설치와 실제 업데이트 완료는 10절을 따른다.

**당시 미완료였던 실행 gate 수정·새 설치·실제 업데이트는 10절에서 완료했다.** 공개 배포·Store 게시·공증·커밋은 수행하지 않았다.

기존 source 변경은 **워킹 디렉토리에만 수정, 커밋 안 함**이다. 오늘 확장 소스 로직은 수정하지 않았고 설치·운영 검증 기록과 관련 문서를 갱신했다. 기존 전달 manifest는 검증 당시 기록으로 보존한다.

## 8. 앞선 복구 앱 1ebc 설치와 당시 경계

이 단계의 앱은 `/private/tmp/VessloRecoveryIdentity-20260913/export/Vesslo.app`이며, 당시 `/Applications/Vesslo.app`에 설치했다. 현재 설치본은 10절의 bdaad 앱이다. main SHA-256은 **`1ebc2c466ed7b1e950172b4951f608e52e0c5cca851ea58367c985bf396dac96`**, 최종 manifest SHA-256은 `dac052347aab12b7d3173839c2fa7c9c87cd9fe234a5544f4ad9301564a0448f`다. `2.0.1 (28)`, Developer ID team `54V3JMN338`, Mach-O 6개 모두 arm64+x86_64다. [최종 전달 manifest](/private/tmp/VessloRecoveryIdentity-20260913/delivery-manifest.json) · [실제 설치 journal](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/installed-app-journal.json)

앱 담당은 private marker schema 2에 volume UUID·file ID·birth time·owner·mode를 저장하고, 현재 열린 FD와 경로의 device/inode 비교도 유지한다. 과거 volume UUID가 없는 drifted legacy marker는 자동으로 같은 root라고 인정하지 않는다. 두 빈 root의 정확한 snapshot을 120초 동안만 검토하며, 명시적 동의 뒤 원본 marker를 새 marker 내부와 `.binding-origin` 파일에 보존한다. 이미 명시 승인으로 완료된 peer와 미완료 legacy root의 부분 재시도도 지원한다. 이 private marker 변경은 공개 export 3/request 2/receipt 2 계약 변경이 아니다. [앱 구현·검증 문서](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/RecoveryRootIdentityValidation2026-09-13.md)

첫 Focused-1은 **955개 중 103개 실패**, 다음 PathRegression-1은 **206개 중 75개 테스트 실패(93 assertion failures)**였다. Foundation 경로 정규화가 기존 물리 경로를 별칭으로 바꾸거나, 파일 존재 여부에 따라 다른 표현을 만들어 containment를 거부한 실제 회귀였다. 입력 symlink 거부·FD/path 보호는 유지하면서 물리 경로와 존재 여부에 독립적인 비교 기준으로 수정했다. 최종 PathRegression-2는 **218개 중 215 통과·skip 3개·실패 0개**, 최종 Focused-2는 **971개 중 967 통과·skip 4개·실패 0개**다. 기존 테스트 삭제는 0개이고 새 회귀 method는 66개다. 실행 범위가 다른 결과를 더하지 않는다. [최종 XCTest 요약](/private/tmp/VessloRecoveryIdentity-20260913/focused-2-summary.json)

독립 검사는 번들 134개 항목과 compiler source 329개의 차이 0건, 모든 실행 이미지의 서명·두 architecture, harness marker/symbol 0개를 확인했다. 새 production 파일 8개는 실제 SwiftFileList 4개 모두에 포함된다. manifest에 연결된 31개 파일의 SHA도 대조했다. [독립 artifact 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/independent-artifact-20260913T024241Z-6aff48/verification.json) · [전달 파일 해시 확인](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/delivery-reference-verification.json)

교체 직전 11개 전체 미러가 모두 일치했다. 교체 후 설치 앱 전체가 원본 산출물과 일치하고, 기존 앱 전체는 백업의 `moved-original/Vesslo.app`에 보존됐다. 나머지 **10개 범위는 교체 전 전체 미러와 동일**, 확장 런타임 **16개는 최종 317-test build와 동일**하다. `vesslo` 기본 handler는 `top.hjm79.Vesslo`, 해석 경로는 `/Applications/Vesslo.app`이다. 보호 `UpdateCheckService.swift`도 변경되지 않았다. 이는 해당 교체의 비교 범위이며 오늘 모든 운영 데이터가 불변이었다는 뜻은 아니다. [설치 후 재확인](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/post-install-verification.json)

설치 직후에는 Mac 재잠금으로 새 앱을 실행하지 못했고, 사용자에게 직접 잠금 해제를 요청했다. 이 당시의 [대기 기록](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/pending.json)은 역사 자료로 보존한다. 이후 잠금 해제와 실제 실행·복구 승인 결과는 다음 절에 기록했다. 앞서 완료한 Apparency 검토·취소는 첫 설치본 `cee47b…42ba`의 증거다.

실제 업데이트 성공 판정은 같은 request의 authoritative receipt, 설치 Info.plist/실행 파일, Brew 설치 metadata를 함께 대조한다. 준비한 [실기 결과 검증 도구](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/verify_real_update.py)는 새 KeyCastr request가 authoritative `completed`가 아니므로 [성공 판정을 거부했다](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/real-update-verifier-rejected.json).

## 9. 새 설치본의 복구 승인 완료와 남은 실행 차단 — 05:06–05:20 UTC

Mac 잠금 해제 후 위 새 전체 미러를 대조하고 `/Applications/Vesslo.app`을 `-enableAutoUpdate NO`로 실행했다. 프로세스 경로·인자와 `1ebc2c46…6dac96` 실행 파일 hash를 다시 확인했다. 확장 런타임 16개도 기존 317-test 산출물과 일치했다. [새 실행·검사 캡처](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/keycastr-native-accepted/summary.json) · [확장 재대조](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/installed-extension-recheck.json)

실제 Verification Center에서 `UpdateRecoveryResolutionJournal`과 `UpdateRecoveryArtifacts`의 경로·현재 volume UUID·file ID·원문 SHA를 검토했다. Return과 취소 뒤 두 schema 1 marker의 원문과 디렉터리 항목이 그대로였고, 다시 열어 동의하여 **승인 버튼이 활성화된 상태에서 Return을 눌러도 변경되지 않았다.** 이후 별도의 명시적 승인 버튼을 눌렀다. [취소 후 무변경](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/recovery-after-cancel.json) · [승인 가능 상태 Return 무변경](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/recovery-ready-return.json) · [승인 직전 실제 UI](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/recovery-ready-return.ax.txt)

승인 후 독립 읽기 검증은 두 root 모두 private marker **schema 2**, `explicitEmptyRebinding`, 현재 열린 FD와의 persistent identity 일치, 실제 폴더 식별 정보의 관측 중 안정성을 확인했다. 각 원본 marker는 새 marker의 embedded 원문·`.binding-origin` sidecar·승인 전 전체 미러와 **바이트 단위로 동일**했다. 초기화 marker는 `vesslo-update-verification-storage-v2-confirmed`의 정확한 바이트였고 `UpdateVerificationItems.json`은 0개였다. 검증의 `allChecksPass`는 true다. 옛 schema 1에는 volume UUID가 없으므로 과거 볼륨과의 연속성을 입증한 것은 아니며, 동시에 진행된 새 스캔을 포함한 전체 운영 데이터의 불변성도 주장하지 않는다. [승인 후 원문·identity·bootstrap 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/recovery-after-approval/verification.json)

새 전체 검사는 session **`F0F604A8-ADD5-4273-97B5-A06068728971`**, `checkRevision == completedCheckRevision == 2`, `inventoryRevision == completedInventoryRevision == 124`로 끝났다. 전역 `failed/sourceFailure`는 유지했고 raw Homebrew ready 47개·업데이트 후보 81개를 기록했다. 앞선 세션의 48개/82개와 다른 시점의 수치다. 새 KeyCastr 목표는 0.10.5 → 0.11.1, proof는 `5B662F98-30E9-47DD-8DCA-C2E9D5F260CC`였다.

새 request **`ABBD8479-B149-4604-84D3-C3062EBC4805`**는 실제 native Review에서 `accepted`, revision 1로 수신됐다. 명시적으로 실행을 확인한 뒤 **`rejected/notExecutable`, revision 5**가 됐고 원래 request·대상·proof는 보존됐다. 이번 콘솔의 직접 오류는 **`Manual installer launch recovery has not been scheduled`**다. 이전 bootstrap root 문제의 해결 확인과 별개로 남은 실행 준비 gate다. 실제 Raycast Homebrew Requests에서도 같은 request의 `Rejected` 상태를 확인했다. [accepted](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/keycastr-native-accepted/summary.json) · [rejected](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/bootstrap-fix/keycastr-native-failed/summary.json) · [실제 콘솔 오류](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/keycastr-failed-console.ax.txt) · [같은 요청의 Raycast 표시](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/keycastr-failed-raycast.ax.txt)

당시 KeyCastr는 **0.10.5**, executable SHA-256 **`5d3b9fb2b018cd24aa95f26a63c37d2aa097b271778d818cad9b778e1637b895`** 그대로이며 실제 업데이트 성공은 **0건**이다. 앱 담당 「Vesslo 메인 개발 인수 및 앱 패치 마감」 작업에 이 실행 gate 수정을 넘겨 진행 중이다. 당시 이 후속 수정의 새 artifact는 아직 전달되지 않았다. 이후 전달·설치·완료 결과는 10절을 따른다. Vesslo와 Raycast는 **05:20 UTC에 종료**했다. 이 절은 실제 운영 검증 기록이며 자동 테스트 수를 추가하거나 기존 971개 앱/317개 확장 결과를 재실행한 것으로 취급하지 않는다. [현재 실행 경계](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/native-runtime-20260913-0506/pending.json)

## 10. 실행 수명 수정과 실제 KeyCastr 업데이트 완료 — 05:50 UTC 이후

조건부 복구 배너 안에 있던 sheet가 승인 완료 시 사라지면서 후속 reconciliation Task까지 취소되는 경로를 앱 담당이 수정했다. sheet host를 조건 밖으로 옮기고, durable binding 이후에는 앱이 복구 작업을 소유하며, 종료 인계와 최종 준비 완료 통지를 처리한다. 실제 quarantine·session·권한 및 사용자 자동 업데이트 설정 검사는 유지된다. [앱 수정·검증 문서](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/LaunchRecoveryContinuationValidation2026-09-13.md)

동결 앱 main SHA는 **`bdaad0cb4b8c7df900b1290f8c35f60e3b05fcae47503042c875aba553f36caa`**, manifest SHA는 `88baddca8c743304837bd6975d3050dc74cd354ce786e3ce9e537f82a675e381`이다. 실제 XCTest 986개 중 982 통과·skip 4개·실패 0개, 새 method 15개다. Debug·Release archive·Developer ID export가 통과했다. 독립 검사에서 bundle 134개, 6 Mach-O의 서명·양쪽 아키텍처, frozen Swift 329개, 실제 compiler list 4개에 필수 production 9개, manifest 참조 32개를 대조했다. 테스트 전용 bounded actor-hold 두 곳의 Thread Performance Checker 경고는 비차단 fixture 개선점이며 production 동기 hold가 아니다. [동결 manifest](/private/tmp/VessloLaunchRecoveryContinuation-20260913/delivery-manifest.json) · [독립 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/independent-artifact-20260913T054906Z-3b91df/verification.json)

설치 전 새 전체 미러는 **11개 범위·2,383개 기록**이다. 앞선 2,385개와의 순감 2개는 원본 sidecar 2개 추가와 Raycast index 파일 8개 제거·4개 추가로 대조됐다. 각 백업의 원본=미러 확인은 모두 통과했으며 서로 다른 운영 시점의 차이다. 설치 후 새 앱 전체와 이전 앱 전체 백업, 나머지 10개 운영 범위가 교체 직전 값과 일치했다. [새 전체 미러](/Users/hjm/Documents/Vesslo-Backups/VessloLaunchContinuation-20260913-8crpqoyo/manifest.json) · [시점 간 차이](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/backup-session-delta.json) · [설치 후 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/post-install-verification.json)

`/Applications/Vesslo.app -enableAutoUpdate NO` 프로세스로 실행했다. 영구 설정은 true 그대로이며 이번 실행 인자만 NO다. 승인된 root를 그대로 읽었고 콘솔의 mutation safetyBlock은 none, launch recovery 미예약 오류는 사라졌다. 새 session **72ACE62A-B07F-4E49-81B6-CD81DFD90186**, completed check 1 / inventory 62, raw readiness 47개·확장 정책을 통과한 대상 42개였다. 전역 failed/sourceFailure는 원격 source 일부 실패를 그대로 표시한다. [시작 콘솔](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/startup-console.ax.txt)

검사 종료 순간 `snapshot=81, published=79` 경고가 있어 실행을 멈추고 대조했다. 코드의 published는 디스크 파일이 아닌 비동기 discovery 카운트다. 안정 상태의 동일 session·revision·export에서 **앱 툴바 81 = JSON updateCount 81 = isVisibleInUpdates 81 = Raycast 81**을 확인했다. 비동기 순서가 원인이라는 설명은 소스 기반 추론이며 당시 이벤트를 직접 추적한 결과는 아니다. 현재 지속적인 개수 불일치는 없었다. [안정 상태 대조](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/count-stable.json) · [Raycast 개수 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/count-raycast-updates.ax.txt)

실제 요청 **42733EA6-B861-4389-B98C-19AD927FBAA8**은 `/Applications/KeyCastr.app`, Bundle ID `io.github.keycastr`, cask `keycastr`, **0.10.5 → 0.11.1** 한 개만 포함했다. app ID는 `7055FAB7-B4E0-4949-85D3-7DDE83C6674C`, evidence ID는 `14BECE8D-3216-4251-8892-D33804B2B6DC`다. accepted revision 1 상태에서 설치 파일·raw plist·Brew metadata를 캡처한 뒤 실제 native 확인 버튼을 눌렀다. 다운로드와 설치가 진행됐고 **05:55:43 UTC에 completed revision 5**가 저장됐다. 원래 request와 대상·proof가 보존됐으며 fast authoritative verification 경로로 완료됐다.

최종 설치 버전과 build는 **0.11.1**, executable SHA는 **`dab4b8f35b4554857b8bf31cc9d0c77eb4761a41a72a326fa6a6b6207fb65ef1`**이다. 이전 SHA `5d3b9fb2…7b895`와 달라졌고, Brew 설치 버전·정확한 앱 artifact 경로·native 검증 완료 화면·Raycast **Completed — Verified by Vesslo**가 일치했다. 과거 rejected 두 건과 Apparency cancelled 기록은 그대로 보존됐다. [3-way 완료 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/real-update-verification.json) · [실제 앱 완료 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/keycastr-completed.png) · [실제 Raycast 완료 화면](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/keycastr-completed-raycast.png)

업데이트 후 독립 검증에서도 설치 Vesslo 전체 134개·확장 런타임 16개·앱 Swift 329개·HEAD·보호 파일이 대조값과 일치했다. 승인된 root와 원본 sidecar는 유지됐고, Apparency 3.2 (861)의 버전·build·실행 파일 SHA도 그대로다. Vesslo를 정상 종료한 뒤에도 새 completed와 기존 rejected 2개·cancelled 1개가 보존됐다. 최종 프로세스 관측에서는 Raycast만 실행 중이었다. [실기 후 독립 검증](/private/tmp/VessloTargetReadiness-20260912-8crpqoyo/launch-continuation-fix/post-runtime-artifact-verification.json)

이번 완료는 **최신 로컬 설치와 실제 Homebrew 단건 업데이트 경로**의 완료다. 새 bdaad의 승인 직후 sheet 수명은 서비스 수준 XCTest의 취소 주입으로 검증했다. 이전 1ebc에서 수행한 실제 root 검토·취소·승인과 혼합해 새 bdaad native 재실기로 주장하지 않는다. 기존 NativeReviewHarness는 Raycast 요청 UI용으로, 별도의 root-binding native harness는 없다. 실제 TCC 거부·수동 Installer 및 공개 배포는 추가 범위다. **워킹 디렉토리에만 수정, 커밋 안 함.**
