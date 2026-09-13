# Raycast → Vesslo Native Review 연결 검증

**실제 Raycast에서 원래 요청 생성기를 실행하고, 격리된 Vesslo Test 앱의 실제 Review UI에서 취소한 결과를 같은 Raycast 화면과 Homebrew Requests에서 확인했다.** 기존 확장의 기능 구현은 유지했고, 이번에는 두 프로그램 사이의 실제 파일·UI 연결을 검증하는 도구와 회귀 테스트를 추가했다. **워킹 디렉토리에만 수정, 커밋 안 함.**

## 기준과 원인

- 확장: `/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work`, HEAD `af13e51fb64eaaa181af89395000bbd6a9b88f2e`, 기존 dirty 유지.
- 앱: `/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work`, HEAD `cad24187733387f545dd1b9793deacc02cfe8c8a`, `codex/vesslo-main-continuation`. 이번 작업에서는 읽기와 기존 Test 바이너리 실행만 했다.
- 보호 파일 `UpdateCheckService.swift`, 원본 앱·원본 Raycast 저장소, 설치본을 수정하지 않았다.
- 이슈 단위: 실제 TS 요청과 native Review/receipt 연결 검증. 커밋·배포는 수행하지 않았다.

앞선 [native Raycast 검증](NATIVE_SCHEMA2_2026-09-11.md)은 합성 receipt로 소비자 UI를 확인한 결과였다. 앱 담당이 반환한 native harness 검증은 앱의 자체 CLI 요청에서 시작했다. 따라서 **Raycast의 원래 sender가 만든 요청을 실제 앱이 받고, 앱이 쓴 결과를 Raycast가 다시 읽는 연결**이 남아 있었다. 이번 작업으로 이 경계를 확인했다. 앱이 제공한 harness를 사용할 수 있었으므로 추가 앱 패치는 필요하지 않았다.

사용자가 전달한 앱 테스트 188/188 및 파일 증거 135/135는 앱 작업의 결과다. 해당 보고와 산출물 identity를 확인했으며, 이번 확장 작업에서 Swift 테스트나 Xcode 빌드를 다시 실행한 것으로 계산하지 않는다.

## 이번 수정 파일

| 파일                                                          | 역할                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `scripts/native-review/prepare.cjs`, `verify.cjs`             | 살아 있는 TestHost와 원본 TS 의존 그래프에 연결한 두 명령 생성, canonical 재번들링과 바이트 비교  |
| `scripts/native-review/actions.ts`, `transport.py`            | 원래 executor가 만든 URL을 그대로 private 파일로 전달하고 원래 request ID의 receipt 화면으로 연결 |
| `scripts/native-review/api.tsx`, `path-probe.ts`, `entry.tsx` | native Raycast API 어댑터, 정확한 합성 앱 3개에만 path availability 주입, 원래 명령 진입점        |
| `tests/native-harness-contract.test.cjs`                      | 앱이 반환한 실제 JSON으로 요청·URL·receipt 계약 회귀 9개                                          |
| `tests/native-review-transport.test.cjs`                      | URL·대상·manifest 고정 및 전달 경계 회귀 7개                                                      |
| `tests/native-review-fixture.test.cjs`                        | 원본 소스 보존·경로 제한·전달 후 오류·변조 거부 회귀 5개                                          |
| `tests/fixtures/native-review-app/`                           | 앱 자료에서 바이트 그대로 복사한 JSON 10개, 출처·해시와 설명                                      |
| 이 문서, `native-connection-20260912/`, README 및 관련 안내   | 현재 실행 증거와 재실행·남은 검증 범위                                                            |

이번 세션에서 확장 production `src`를 추가 변경하지 않았다. 기존 schema 2 소비자, 정확한 대상 요청, 상태 화면 및 Homebrew Requests 구현을 그대로 검증했다.

## 실제 실행과 결과

현재 실행의 request ID는 `879cd177-f617-4a4d-bfaf-982f6cf31b5d`, publisher session은 `AA11A67D-D04D-4A76-81F6-45C3112DA361`, TestHost PID는 `66872`였다. Swift receipt의 대문자 UUID는 같은 요청으로 정규화된다. 전달은 정확히 1회였으며, inventory/completed-check revision은 각각 1이었다.

| 관측 단계                | 결과                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 실제 private export 읽기 | 기존 `VessloDataReader`가 schema 2, ready, 합성 앱 3개를 읽음. 첫 요청 전 receipt 없음은 정상        |
| Raycast 선택과 검토      | 원래 Bulk Homebrew Update에서 Alpha/Beta/Gamma 선택 → 원래 `HomebrewRequestReview` 표시              |
| 요청 전달                | 원래 TS executor와 URL encoder 실행. URL 파일, delivery envelope URL, 기록된 request URL 바이트 일치 |
| 실제 Vesslo Review       | 원래 UI에 3개 대상의 Bundle ID·경로·cask·설치/대상 버전과 순서가 일치                                |
| 접수 상태                | 같은 Raycast 상태 화면에서 `Accepted — Awaiting Vesslo Review`, receipt revision 1                   |
| native Return            | 실행되지 않음. 전후 receipt 파일 바이트 동일, revision 1 유지                                        |
| native 취소              | Vesslo 실제 취소 버튼 → 모든 대상 `cancelled/userCancelled`, receipt revision 2                      |
| Raycast 상태 갱신        | 같은 mounted 화면이 실제 receipt를 읽어 3개 대상 모두 `Cancelled`로 표시                             |
| 별도 기록 명령           | Homebrew Requests에서도 같은 request ID와 취소 결과를 읽기 전용으로 표시                             |
| 종료                     | 실제 실행기 호출 0회, Review 닫힘, TestHost graceful 종료와 전용 root 정리                           |

실제 `HandoffReceiptReader`의 최종 읽기 상태는 `ready`, 요청 바인딩은 `current`, receipt phase는 `cancelled`였다. ACK만으로 접수·완료를 추정하지 않았다. `cancelAttempts=0`은 실행 중 작업을 중단하는 가짜 실행기 callback의 호출 횟수다. 검토 단계의 취소는 이 callback을 호출하지 않으며, 실제 취소 receipt와 UI 닫힘으로 확인했다.

주요 증거:

- [연결·요청·revision 검사](native-connection-20260912/connection-assertions.json)
- [native Review AX](native-connection-20260912/host-review-ax.txt), [Raycast accepted AX](native-connection-20260912/raycast-accepted-ax.txt), [Raycast cancelled AX](native-connection-20260912/raycast-cancelled-ax.txt), [Homebrew Requests AX](native-connection-20260912/raycast-history-ax.txt)
- [실제 accepted receipt](native-connection-20260912/accepted/raycast_receipts.json), [Return 후 receipt](native-connection-20260912/after-return/raycast_receipts.json), [실제 cancelled receipt](native-connection-20260912/cancelled/raycast_receipts.json)
- [증거 파일별 SHA-256 manifest](native-connection-20260912/manifest.json)

![실제 Vesslo 검토 화면](native-connection-20260912/screenshots/host-review.png)

![같은 Raycast 요청의 실제 취소 결과](native-connection-20260912/screenshots/raycast-cancelled.png)

## 자동 검증

- Node.js 22.22.2에서 저장소 `scripts/test.cjs`: **228/228 통과**, 실패·skip 0. 기존 207개와 이번 신규 21개를 포함한다. [로그](native-connection-20260912/tests.log)
- `npm run lint`: 전체 Raycast package/icon/metadata, ESLint, Prettier 통과. [로그](native-connection-20260912/lint.log)
- `npm run build:check`: production 7개 명령 컴파일·타입 검사·배포용 build 통과. [로그](native-connection-20260912/build.log)
- 별도 native fixture 두 entry strict TypeScript 검사(`skipLibCheck=false`) 통과. 원본 소스 해시·정확한 변환·파일 집합·빌드 그래프·canonical 재번들링·live host binding 검증 통과.
- 등록 직후 실제 Raycast runtime의 두 JS와 package JSON을 검증된 artifact와 바이트 비교했다. [runtime 해시](native-connection-20260912/runtime-artifacts.json)

중간 검증에서 신규 API 어댑터의 `List.Item.Accessory` 타입 namespace 누락을 수정했다. 해당 첫 artifact는 등록하지 않았다. 독립 리뷰에서 발견한 wrapper 재오픈 간격, manifest 고정 누락, 전달 후 오류의 미전송 오표시 가능성, bundle와 기록 해시 동시 변조 문제도 수정하고 최종 회귀와 artifact 검증을 통과했다. 최종 검증 후 개발 watcher는 의도적으로 Ctrl-C로 종료했다.

## 전달 도구의 경계

이 harness는 macOS 전용이다. 실제 운영 URL handler 대신 **동일한 원래 URL bytes를 TestHost의 전용 inbox로 전달**한다. 실제 app parser → service → Review UI → receipt store를 사용하지만 운영 설치본의 URL 등록을 검증하는 흐름은 아니다.

원본 TS 그래프 27개 파일 중 export/receipt 경로를 live manifest 경로로 연결하고, `/VessloSynthetic/Alpha.app`, `Beta.app`, `Gamma.app`의 존재 확인만 명시적으로 주입한다. 다른 경로는 거부한다. 실제 export의 bounded read와 receipt의 소유자·모드·no-follow 검증은 기존 reader를 사용한다.

Process는 앱이 제공한 Python CLI를 통해 격리된 inbox로 전달하기 위해 필요하다. shell 문자열을 실행하지 않고 고정 `/usr/bin/python3`와 명시적 argv를 사용한다. 검증한 wrapper bytes를 `-I -B -c`로 실행하며, driver/wrapper/manifest 해시, PID·시작 시각·session·실행 파일·dylib identity를 확인한다. timeout, 출력 크기, 환경을 제한한다. 전달 이후 오류가 나더라도 자동 재전송하지 않고 원래 요청의 receipt를 확인한다. Open/Finder/일반 update/clipboard 등 다른 효과는 차단한다.

## 재실행

보관된 manifest와 fixture는 이미 종료된 실행의 증거다. 새 host의 live manifest로 새 artifact를 생성해야 한다. 앱 빌드가 바뀌면 [앱 harness 문서](/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work/Docs/NativeReviewHarness.md)의 Test 구성 빌드 절차를 먼저 따른다. 이번 실행은 반환된 Test 바이너리의 executable·dylib 해시가 delivery manifest와 일치함을 확인하고 재사용했다. [실제 launch identity](native-connection-20260912/launch.json)

```sh
NATIVE_APP_ROOT=/Users/hjm/.codex/worktrees/dff0/Vesslo/vesslo-main-work
NATIVE_EXTENSION_ROOT=/Users/hjm/.codex/worktrees/22c7/Vesslo/raycast-extension-work
NATIVE_RUN=$(mktemp -d /private/tmp/VessloRaycastNativeReplay.XXXXXX)
python3 -I -B "$NATIVE_APP_ROOT/script/native_review_preservation.py" capture \
  --output "$NATIVE_RUN/production-before.json"
python3 -I -B "$NATIVE_APP_ROOT/script/raycast_native_review.py" launch \
  --app /private/tmp/VessloNativeReview-20260911/DerivedData/Build/Products/Test/Vesslo.app \
  --output-dir "$NATIVE_RUN/host" > "$NATIVE_RUN/launch.json"
NATIVE_MANIFEST=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["manifestPath"])' "$NATIVE_RUN/launch.json")
mkdir -m 700 "$NATIVE_RUN/deliveries"
cd "$NATIVE_EXTENSION_ROOT"
node scripts/native-review/prepare.cjs --manifest "$NATIVE_MANIFEST" \
  --evidence-root "$NATIVE_RUN/deliveries" > "$NATIVE_RUN/prepared.json"
NATIVE_PREPARED=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["directory"])' "$NATIVE_RUN/prepared.json")
node scripts/native-review/verify.cjs "$NATIVE_PREPARED"
```

Node.js 22.22.2 이상과 이 저장소 lockfile의 의존성을 사용한다. prepare/verify는 등록하거나 요청을 전송하지 않는다. 실제 등록 시 검증된 artifact 자체를 수정하지 말고 별도 `.ui-fixtures-native/registration/<fixtureId>` 사본에 `src`, `dist/assets`를 `assets`로, `dist/package.json`을 `package.json`으로 복사한다. 저장소의 strict `tsconfig.json`과 `node_modules` 연결을 추가한다. 해당 stage에서 `tsc --noEmit`과 `ray develop`을 실행하고, 생성된 고유 이름의 fixture 등록만 사용한다.

`ray develop`이 생성한 runtime의 두 JS 및 package JSON은 검증된 `dist`와 일치시킨 뒤 바이트 비교한다. 등록 경로는 `~/.config/raycast/extensions/<fixtureId>`이다. 원본 `vesslo` 등록에 덮어쓰지 않는다. 이번 stage와 prepared 경로는 [fixture 구성 기록](native-connection-20260912/fixture-config-final.json)에 보관했다.

실제 UI에서 3개 선택 → Review → Open Review in Vesslo → Vesslo Return → 취소 → 같은 Raycast 화면 갱신 → 별도 Homebrew Requests를 확인한다. 요청 전에는 receipt가 없어도 정상이며, 요청 TTL은 120초다. `read --output-dir`에는 매번 새 디렉터리를 사용해 accepted/Return/cancelled 증거를 따로 보관한다.

검증 후 developer watcher 종료, 정확한 `[NATIVE FIXTURE]` 등록만 Uninstall but Keep Settings로 제거, 기존 두 Vesslo 등록 유지 확인, 명령 화면 종료를 수행한다. 그 뒤 다음 순서로 host와 전용 root를 정리한다.

```sh
python3 -I -B "$NATIVE_APP_ROOT/script/raycast_native_review.py" stop --manifest "$NATIVE_MANIFEST"
python3 -I -B "$NATIVE_APP_ROOT/script/raycast_native_review.py" read \
  --manifest "$NATIVE_MANIFEST" --output-dir "$NATIVE_RUN/closed"
python3 -I -B "$NATIVE_APP_ROOT/script/raycast_native_review.py" cleanup --manifest "$NATIVE_MANIFEST"
python3 -I -B "$NATIVE_APP_ROOT/script/native_review_preservation.py" compare \
  --baseline "$NATIVE_RUN/production-before.json" --output "$NATIVE_RUN/production-after.json"
```

`stop`/`cleanup`의 identity와 소유 root 검사를 유지한다. 종료된 manifest를 살리거나 다른 Vesslo 프로세스를 종료하지 않는다. 정리된 artifact의 offline 무결성만 검사할 때는 `verifyNativeReview(directory, { inspect: false })`를 사용할 수 있지만 살아 있는 host 검증 결과로 보고하지 않는다.

## 정리와 보존

- 이번 TestHost가 `closed.json`을 쓴 뒤 종료됐고 private root를 정리했다. [종료](native-connection-20260912/stop.json), [정리](native-connection-20260912/cleanup.json)
- 임시 Raycast 등록 `vesslo-native-review-mty853bc-207267`과 runtime 디렉터리를 제거했다. 기존 Vesslo 등록 2개는 유지했다. [전](native-connection-20260912/registration-before.txt), [후](native-connection-20260912/registration-after.txt)
- 앱 worktree의 기존 767개 파일은 모두 바이트 동일하고 추가·삭제가 없다.
- 설치본·운영 Application Support/preferences/cask cache·보호 checker·원본 앱/원본 Raycast와 URL handler는 관측값이 동일하다.
- 보존 helper의 전체 `preserved`는 false다. 비교 대상에 이번에 수정한 확장 worktree도 포함되기 때문이다. 문서 작성 전 비교에서 신규 검증 파일 22개와 `raycast-env.d.ts` 메타데이터 갱신만 관측됐다. 기존 파일 내용 변경·삭제는 없었다. 이 차이를 숨기거나 baseline을 덮어쓰지 않았다. [보존·정리 요약](native-connection-20260912/preservation-summary.json)
- 최종 문서·증거 추가는 위 비교 이후 확장 폴더 안에서만 수행했다. `.ui-fixtures-native`의 생성 artifact와 등록용 stage는 재검토용으로 남겼으며 활성 등록이나 실행 중 host가 아니다.

## 남은 범위

이번 요청의 **격리 native 연결 검증은 완료**했다. 추가 앱 수정 blocker는 발견되지 않았다. 다음 배포 검증에는 실제 설치본의 `vesslo://` 라우팅, TCC 거부, 실제 업데이트/Installer와 authoritative 완료, 재시작 복구, 설치본 교체 및 배포가 남아 있다. 이번 cancelled receipt나 실행기 0회 결과를 실제 업데이트 성공으로 해석하지 않는다.

앱 작업에서 보고한 과거 dirty `project.pbxproj`의 이전 hunk 바이트 보존 한계는 별도 기록이다. 이번 767개 파일 비교는 이 세션 시작 이후 보존을 입증하며 그 이전의 내용을 재구성하지 않는다.
