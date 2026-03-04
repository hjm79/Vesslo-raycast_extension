---
description: macOS 앱 버전 릴리스 워크플로우. 빌드, 공증, DMG, GitHub Release, Sparkle appcast, 서버 배포까지 전체 절차.
---

# /release - Vesslo 버전 릴리스

// turbo-all

$ARGUMENTS

---

## Purpose

Vesslo 새 버전 출시 시 따라야 하는 전체 절차 (11단계).
**모든 단계는 터미널에서 실행한다.**

---

## 사전 준비

1. 프로젝트 릴리스 문서 확인: `Docs/릴리스워크플로우.md`
2. DMG 가이드 확인: `Docs/DMG-Creation-Guide.md`

---

## 실행 절차

### Step 1: 버전 범프
// turbo
1. `project.yml` 수정:
```yaml
MARKETING_VERSION: "X.X.X"        # 사용자 표시 버전
CURRENT_PROJECT_VERSION: "N"      # 빌드 번호 (+1)
```
2. 프로젝트 재생성:
```bash
cd ~/Documents/git/all_application/Vesslo && xcodegen generate
```

### Step 2: 빌드 + Archive (터미널)
// turbo
```bash
xcodebuild archive \
  -project Vesslo.xcodeproj \
  -scheme Vesslo \
  -archivePath ~/Desktop/Vesslo.xcarchive \
  -configuration Release
```

### Step 3: Export (공증 포함)
// turbo
```bash
xcodebuild -exportArchive \
  -archivePath ~/Desktop/Vesslo.xcarchive \
  -exportPath ~/Downloads/VessloExport \
  -exportOptionsPlist ExportOptions.plist
```

### Step 4: DMG 생성
// turbo
```bash
rm -f ~/Desktop/Vesslo.dmg

create-dmg \
  --volname "Vesslo" \
  --window-pos 200 120 \
  --window-size 540 450 \
  --background ~/Documents/git/all_application/Vesslo/Assets/DMG/dmg_background.tiff \
  --icon-size 100 \
  --icon "Vesslo.app" 135 200 \
  --app-drop-link 405 200 \
  ~/Desktop/Vesslo.dmg \
  ~/Downloads/VessloExport/Vesslo.app
```

### Step 5: DMG 공증 + 스탬플
// turbo
```bash
xcrun notarytool submit ~/Desktop/Vesslo.dmg \
  --keychain-profile "notarization" --wait

xcrun stapler staple ~/Desktop/Vesslo.dmg
```

### Step 6: EdDSA 서명
🔴 **반드시 Step 5 스탬플 완료 후 실행!**
```bash
SIGN_UPDATE=$(find ~/Library/Developer/Xcode/DerivedData -name "sign_update" -path "*/artifacts/*" -type f | head -1)
$SIGN_UPDATE ~/Desktop/Vesslo.dmg
```
출력의 `edSignature`와 `length` 값을 기록한다.

### Step 7: appcast.xml 업데이트
1. `~/Documents/git/app.hjm79.top/web/public/appcast.xml`에 새 `<item>` 추가
2. Step 6의 서명과 크기 반영
3. 릴리스 노트 HTML 인라인 작성

### Step 8: GitHub Release 생성
```bash
gh release create vX.X.X ~/Desktop/Vesslo.dmg \
  --repo hjm79/Vesslo-MacAppManager \
  --title "Vesslo X.X.X" \
  --notes-file Docs/release-notes-vX.X.X.md
```

### Step 9: 다운로드 URL (자동)
- `latest` 패턴이므로 **수정 불필요**

### Step 10: 서버 배포
// turbo
```bash
# appcast.xml 배포 (매 릴리스 필수)
scp -P 2254 -i ~/.ssh/id_rsa \
  ~/Documents/git/app.hjm79.top/web/public/appcast.xml \
  root@192.168.1.26:/var/www/vesslo.top/appcast.xml
```

### Step 11: 검증
- [ ] `curl -s https://vesslo.top/appcast.xml | head -20` → 새 버전 확인
- [ ] GitHub Release 다운로드 가능 확인
- [ ] 이전 버전 앱에서 업데이트 확인

### Step 12: 커밋 + 푸시
// turbo
```bash
cd ~/Documents/git/all_application/Vesslo
git add -A && git commit -m "release: vX.X.X ..." && git push
```
> 공용 배포 리포(Vesslo-MacAppManager)에는 소스코드 커밋 금지!

---

## Sub-commands

```
/release            - 전체 릴리스 절차 (대화형)
/release check      - 릴리스 전 체크리스트만
/release appcast    - appcast.xml 항목 생성 도우미
/release notes      - 릴리스 노트 작성 도우미
```

---

## 절대 규칙

| ❌ 금지 | ✅ 올바른 방법 |
|:--------|:-------------|
| DMG에 버전 포함 (`Vesslo-1.0.0.dmg`) | 고정 파일명 (`Vesslo.dmg`) |
| 스탬플 전에 EdDSA 서명 | 스탬플 → 서명 순서 엄수 |
| Xcode에서 버전 직접 수정 | `project.yml` + `xcodegen` |
| Git만 푸시하고 배포 완료 | `scp`로 appcast.xml 서버 업로드 |
| 홈페이지 URL에 버전 하드코딩 | `latest` 패턴 사용 |
