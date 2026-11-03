<p align="center"><img src="images/logo.png" width="128" alt="logo"></p>

<h1 align="center">Majsoul-Browser (작혼 브라우저)</h1>

<p align="center">
  작혼 웹 버전을 내장한 데스크톱 브라우저. 로컬 Mortal AI가 4인 마작의 타패를 추천하고,<br>
  추천수·위험도·밀고 당기기 판단을 게임 화면 위에 그대로 표시합니다.
</p>

<p align="center">
  <a href="../README.md">简体中文</a> · <a href="README.en.md">English</a> · <a href="README.ja.md">日本語</a> · <b>한국어</b> · <a href="README.de.md">Deutsch</a>
</p>

> [!WARNING]
> 이 프로젝트는 **비공식** 서드파티 도구이며, 작혼(Mahjong Soul) 및 그 개발·운영사와 아무런 관련이 없습니다. "雀魂 / Mahjong Soul"은 해당 권리자의 상표입니다.
> 보조 또는 자동 타패 기능을 사용하면 게임 이용약관을 위반할 수 있으며, **계정 위험은 본인이 부담합니다**. 친선전, 연습, 복기 용도로만 사용하기를 권장합니다.

## 무엇을 할 수 있나요

- **창 하나로 플레이**: 작혼 웹 버전을 내장하고 로그인 상태를 로컬에 저장합니다. 시스템 프록시를 바꾸지 않고, 인증서도 설치하지 않으며, 관리자 권한도 필요 없습니다.
- **읽기 전용**: 게임의 네트워크 메시지를 읽어서 대국 상황을 파악할 뿐, 프로토콜 데이터를 수정·위조·폐기하지 않습니다. 모든 조작은 마우스 클릭을 흉내 내는 방식으로 이루어집니다.
- **로컬 AI 추론**: [Mortal](https://github.com/Equim-chan/Mortal) 모델을 내 컴퓨터에서 추론합니다(CPU만으로 충분). 어떤 데이터도 업로드하지 않습니다.
- **게임 내 정보 레이어**: 패 테이블의 빈 공간에 추천 플레이, 확신도, 샹텐 진행도, 후보 비교, 손패 한 장 한 장의 위험도 막대, 상대의 텐파이 가능성과 안전패, 밀고 당기기(공격 / 균형 / 오리) 결론을 표시합니다. 텐파이, 상대의 리치, 순위 변동 때는 배너로 알려 줍니다.
- **연습 모드**: 먼저 AI의 답을 숨기고, 패를 버린 직후에 비교해서 이번 대국의 일치율과 실수를 집계합니다.
- **자동 타패(선택)**: AI의 결정에 따라 클릭을 흉내 내며, 생각하는 시간을 둡니다. 불확실한 상황(대국 상태 불일치, 모델 이상, 클릭이 확인되지 않음)이 생기면 먼저 멈추고 다음 차례에 자동으로 재개됩니다. 언제든 긴급 정지할 수 있습니다.
- **자동 매칭, 패보 기록과 복기**, 여러 모델 관리, 다크 / 라이트 테마.
- **다섯 가지 UI 언어**: 简体中文, English, 日本語, 한국어, Deutsch.

## 다운로드

[Releases](../../../releases) 페이지에서 사용 중인 플랫폼의 압축 파일을 내려받으세요.

| 플랫폼 | 파일 |
|---|---|
| Windows 10/11 (x64) | `Majsoul-Browser-<버전>-win-x64.zip` |
| macOS (Apple Silicon, M 시리즈 칩) | `Majsoul-Browser-<버전>-mac-arm64.zip` |
| macOS (Intel) | `Majsoul-Browser-<버전>-mac-x64.zip` |
| Linux (x64) | `Majsoul-Browser-<버전>-linux-x86_64.AppImage` 또는 `.tar.gz` |

포터블 버전입니다. 압축을 풀어 **쓰기 가능한 폴더**에 두면 바로 실행됩니다. 모든 데이터(로그인 정보, 모델, 패보, 로그, 설정)는 프로그램 옆의 `MajsoulBrowserData/` 폴더에 저장되며, 이 폴더를 통째로 지우면 삭제가 끝납니다.

<details>
<summary>처음 실행할 때 나오는 시스템 경고</summary>

- **macOS**: 앱이 Apple 서명을 받지 않았습니다. 처음에는 `Majsoul-Browser.app`을 마우스 오른쪽 버튼으로 클릭하고 "열기"를 선택하세요. "손상되었다"는 메시지가 나오면 터미널에서 다음을 실행합니다.
  `xattr -dr com.apple.quarantine /path/to/Majsoul-Browser.app`. "다운로드" 폴더나 압축 파일 안에서 바로 실행하지 말고, 먼저 다른 폴더로 옮기세요.
- **Windows**: SmartScreen이 "알 수 없는 게시자"라고 표시할 수 있습니다. "추가 정보" → "실행"을 클릭하세요.
- **Linux**: `chmod +x Majsoul-Browser-*.AppImage`를 실행한 뒤 실행하세요. 데이터는 AppImage 파일 옆에 저장됩니다.

</details>

## 모델 준비

설치 패키지에는 **AI 모델이 포함되어 있지 않습니다**. Mortal 형식의 모델 파일(`.pth`, `mortal`, `current_dqn`, `config` 세 부분을 포함하며 v1–v4 지원)을 직접 준비한 다음, 앱의 "모델" 페이지에서 "가져오기"를 누르세요. 가져올 때 파일을 검증하고 시험 추론을 한 번 수행하며, 통과하면 대국에서 사용할 수 있습니다.

모델이 없어도 앱은 정상적으로 열리고 게임도 할 수 있지만, AI 추천은 표시되지 않습니다.

## 사용법

1. 앱을 열고 내장 페이지에서 작혼에 로그인합니다.
2. "모델" 페이지에서 모델을 가져와 활성화합니다.
3. 4인 마작을 시작하면 사이드바와 게임 화면에 추천이 나타납니다. 상단에서 **끔 / 보조 / 자동**을 전환할 수 있습니다.

| 단축키 (macOS는 ⌘ 사용) | 동작 |
|---|---|
| `Ctrl+Shift+Space` | **긴급 정지**: 자동 타패를 즉시 멈춥니다(전역으로 동작) |
| `Ctrl+Shift+A` | 보조 / 끔 전환 |
| `Ctrl+Shift+H` | 게임 내 정보 레이어 표시 / 숨기기 |
| `Ctrl+\` | 사이드바 접기 |
| `Ctrl+,` | 설정 |
| `Ctrl+1` … `Ctrl+4` | 사이드바 탭 전환 |

4인 마작만 지원하며, 3인 마작에서는 모든 기능이 자동으로 꺼집니다.

## 소스에서 빌드하기

### 준비물

| 도구 | 버전 | 용도 |
|---|---|---|
| [Node.js](https://nodejs.org/) | 22 | 데스크톱 앱 (Electron + React + TypeScript) |
| [pnpm](https://pnpm.io/) | 10 | 프런트엔드 의존성 |
| [uv](https://docs.astral.sh/uv/) | 최신 | Python 3.12 환경과 의존성 (Python을 자동으로 내려받음) |
| [Rust](https://rustup.rs/) | stable | Mortal의 libriichi를 소스에서 컴파일 |
| Windows에서 추가로 필요 | — | Visual Studio Build Tools ("C++를 사용한 데스크톱 개발") |

### 개발 모드 실행

```bash
git clone https://github.com/ClarkeLi/majsoul-browser.git
cd majsoul-browser

# Python Core (처음에는 libriichi를 컴파일하고 PyTorch를 내려받느라 몇 분 걸립니다)
cd core
uv sync
uv run pytest -q                  # 모델 파일이 필요한 테스트는 자동으로 건너뜁니다

# 데스크톱 앱
cd ../apps/desktop
pnpm install
pnpm test && pnpm typecheck
SOUL_MODEL=/path/to/mortal.pth pnpm dev     # 모델 없이 시작한 뒤 "모델" 페이지에서 가져와도 됩니다
```

개발 모드의 데이터는 저장소 안의 `.data/`에 저장됩니다. 환경 변수 `MAJSOUL_BROWSER_DATA_DIR`로 원하는 데이터 디렉터리를 지정할 수도 있습니다.

### 패키징

명령어 하나로 현재 플랫폼의 배포 패키지를 만들고, 저장소 루트의 `release/`에 출력합니다.

```bash
scripts/package.sh mac-arm64      # macOS Apple Silicon
scripts/package.sh mac-x64        # macOS Intel (Apple Silicon에서도 빌드 가능, Rosetta 2 필요)
scripts/package.sh win            # Windows x64 (Windows의 Git Bash에서 실행)
scripts/package.sh linux          # Linux x64
```

내부적으로 세 가지를 차례로 수행합니다. `scripts/build-core.sh`가 PyInstaller로 Python Core를 `dist/soul-core/`로 묶고 → 프런트엔드를 빌드한 뒤 → electron-builder로 패키징합니다.
PyInstaller는 크로스 컴파일이 안 되므로 Windows와 Linux 버전은 해당 OS에서 빌드해야 합니다.

> **Intel Mac 참고**: PyTorch는 2.2 이후 macOS x86_64 버전을 제공하지 않으므로, Intel Mac에서는 torch 2.2.2 + numpy 1.26으로 고정합니다(`core/pyproject.toml`에서 플랫폼별로 구분).
> Apple Silicon에서 Intel 버전을 빌드하려면 먼저 Rosetta 2를 설치해야 하며(`softwareupdate --install-rosetta`), 스크립트가 Rust 타깃 `x86_64-apple-darwin`을 자동으로 추가합니다.

### GitHub Actions로 네 플랫폼을 한 번에 빌드

저장소의 `.github/workflows/release.yml`은 macOS(Apple Silicon, Intel), Windows, Linux의 네 가지 네이티브 환경에서 각각 패키징합니다.
GitHub의 **Actions → release → Run workflow**에서 수동으로 실행하세요. 기본적으로는 설치 파일(Artifacts)만 업로드하며, `draft`를 체크하면 **초안** Release도 함께 만듭니다. 내용을 확인한 뒤 웹에서 직접 게시하세요.

### 기타 검사

```bash
scripts/verify-readonly.sh        # 정적 검사: 코드에 프로토콜 쓰기 / 네트워크 변경 호출이 하나도 없어야 함
cd apps/desktop
pnpm e2e:click                    # 실제 마우스 이벤트 → 가짜 Canvas, 클릭 좌표와 "중복 클릭 0회" 확인
pnpm e2e:hud                      # 게임 내 정보 레이어가 패 테이블, 버튼, 손패를 가리지 않는지 (픽셀 단위)
pnpm design:shots                 # 사이드바 각 상태의 스크린샷 → test/design-shots/
pnpm icon                         # 앱 아이콘 재생성 (macOS의 송체 폰트 필요)
```

## 프로젝트 구조

```
apps/desktop/   Electron + React + TypeScript (electron-vite): main / preload / renderer (게임 내 정보 레이어 포함)
core/           Python 3.12: 프로토콜 디코딩, 4인 마작 상태 머신, 의사결정과 Mortal 추론. stdio 위의 NDJSON으로 데스크톱 앱과 통신
vendor/mortal/  Mortal 소스 (AGPL-3.0), libriichi 컴파일용
scripts/        패키징, 읽기 전용 검사, SBOM
test/           엔드투엔드 테스트용 가짜 게임 페이지
```

## 설계 원칙

- **프로토콜 쓰기 0**: 서버로 WebSocket 프레임을 보내거나, 수정하거나, 폐기하지 않습니다(`scripts/verify-readonly.sh`가 CI에서 강제로 검사).
- **시스템 변경 0**: 프록시 변경 없음, 인증서 설치 없음, 관리자 권한 불필요. 데이터는 프로그램 옆에만 기록합니다.
- **실패하면 멈춤**: 대국 상태 불일치, 모델 이상, 클릭 대상이 불확실할 때는 자동 조작을 멈추며, 절대 "짐작으로 클릭"하지 않습니다.

## 라이선스 및 감사의 말

이 프로젝트는 [GPL-3.0-or-later](../LICENSE)로 배포되며, Mortal에서 가져온 부분은 AGPL-3.0 조항을 그대로 유지합니다. 다음 프로젝트에 감사드립니다.

- [Mortal](https://github.com/Equim-chan/Mortal) (Equim-chan) — 마작 AI 모델과 libriichi
- [MajsoulMax](https://github.com/Avenshy/MajsoulMax) (Avenshy) — 작혼 프로토콜 디코딩
- [MahjongCopilot](https://github.com/latorc/MahjongCopilot) (latorc) — 클릭 좌표 참고
- [riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (FluffyStuff) — 패 이미지

자세한 내용은 [NOTICE](../NOTICE)를 참고하세요.
