<p align="center"><img src="images/logo.png" width="128" alt="logo"></p>

<h1 align="center">Majsoul-Browser</h1>

<p align="center">
  A desktop browser with Mahjong Soul's web client built in. A local Mortal AI suggests discards for 4-player Riichi Mahjong,<br>
  and draws its recommendations, danger levels and push/fold calls right on top of the game.
</p>

<p align="center">
  <a href="../README.md">简体中文</a> · <b>English</b> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a>
  <br>📖 <a href="TECHNICAL.en.md">Technical docs</a> · <a href="TECHNICAL.md">技术文档</a>
</p>

> [!CAUTION]
> This is an **unofficial** third-party tool, not affiliated with Mahjong Soul or its operators, and is for learning, reference and discussion only. Delete it within 24 hours of downloading. Commercial use is prohibited; you bear all consequences otherwise.
>
> Mahjong Soul may detect its use and ban accounts; the author is not responsible for any consequences. By using this project you acknowledge and agree to these terms.

## In action

Everything below comes from one real friendly game against bots (4-player East round), played start to finish in **auto mode**: 96 decisions, finishing **1st with 44,000 points**. The username is pixelated.

<p align="center"><img src="media/autoplay.gif" width="860" alt="auto-play demo"></p>
<p align="center">AI declares riichi → self-draws a mangan (8,000) → climbs from 3rd to 1st (2× speed) · <a href="media/demo.mp4">▶ Watch the full video (50 s)</a></p>

| | |
|---|---|
| <img src="media/screenshots/autoplay.zh.jpg" alt="Auto-play: mangan tenpai after riichi, 12 decisions in a row matching the AI"> | <img src="media/screenshots/defense.zh.jpg" alt="Opponent riichi: the banner names the safest tile and push/fold switches to fold"> |
| Auto-play: mangan tenpai after riichi, 12 decisions in a row matching the AI | Opponent riichi: the banner names the safest tile and push/fold switches to fold |
| <img src="media/screenshots/tenpai.zh.jpg" alt="Tenpai against two riichi: waits, tiles left and hand value at a glance"> | <img src="media/screenshots/tsumo.zh.jpg" alt="The AI takes the tsumo; the sidebar explains why"> |
| Tenpai against two riichi: waits, tiles left and hand value at a glance | The AI takes the tsumo; the sidebar explains why |
| <img src="media/screenshots/win.zh.jpg" alt="Win screen"> | <img src="media/screenshots/result.zh.jpg" alt="Final result: 1st with 44,000 points"> |
| Win screen | Final result: 1st with 44,000 points |

<p align="center"><img src="media/screenshots/pages.jpg" width="860" alt="pages"><br>Sidebar: review · stats · models · settings (five UI languages)</p>

## What it does

- **One window to play in**: embeds the Mahjong Soul web client and keeps your login locally; no system proxy changes, no certificates to install, no admin rights needed.
- **Read-only**: it only reads the game's network messages to understand the hand, and never modifies, forges or drops any protocol data; all actions are done by simulating mouse clicks.
- **Local AI inference**: runs the [Mortal](https://github.com/Equim-chan/Mortal) model on your own computer (CPU is enough) and uploads no data.
- **In-game info layer**: shows the recommended play, confidence, shanten progress, candidate comparison, a danger bar for every tile in your hand, opponents' possible waits and safe tiles, and a push/fold verdict (attack / balanced / fold) in the empty areas of the table. Banners pop up when you reach tenpai, an opponent declares Riichi, or your rank changes.
- **Practice mode**: hides the AI's answer first, compares it with your discard right after you play, and tallies this game's agreement rate and mistakes.
- **Auto-play (optional)**: simulates clicks following the AI's decision, with a thinking delay. Anything uncertain (out-of-sync game state, model error, an unconfirmed click) stops it first, and it resumes automatically on the next turn. You can hit the emergency stop at any time.
- **Auto matchmaking, game log recording and review**, multi-model management, dark / light themes.
- **Five UI languages**: 简体中文, English, 日本語, 한국어, Deutsch.

## How it works

The Mahjong Soul page runs untouched. The shell reads every frame it sends and receives **read-only** through the browser's debugging interface,
hands them to the local Python core and the Mortal model, and draws the advice on a transparent overlay. In auto mode it simulates mouse clicks
and only counts an action as done once it sees the game actually send the matching request.

```mermaid
flowchart LR
  subgraph EL["Electron app"]
    direction TB
    GAME["Game view<br/>Mahjong Soul web client"]
    MAIN["Main process<br/>FrameTap reads frames · ClickExecutor clicks"]
    UI["Sidebar UI"]
    HUD["In-game overlay<br/>transparent · click-through"]
  end
  subgraph PY["Python Core"]
    direction TB
    SES["Protocol decoding → game state machine<br/>→ decisions / analysis"]
    WK["Mortal inference subprocess"]
  end
  SRV[("Mahjong Soul server")]
  GAME <-->|"WebSocket"| SRV
  GAME -.->|"read-only frame copies"| MAIN
  MAIN -->|"simulated mouse"| GAME
  MAIN <-->|"NDJSON"| SES
  SES <-->|"MJAI, one question one answer"| WK
  MAIN --> UI
  MAIN --> HUD
```

From an incoming frame to a discard:

```mermaid
flowchart LR
  A["Frame received<br/>(read-only copy)"] --> B["liqi decoding"] --> C["Game state machine<br/>→ MJAI events"] --> D["Mortal inference<br/>candidate probabilities"]
  D --> E["Legality check<br/>+ click plan"] --> F["Think time<br/>based on confidence"] --> G["Simulated click"] --> H{"Game sent the<br/>matching request?"}
  H -- yes --> OK["Done"]
  H -- no --> P["Pause, auto-resume next action"]
  D --> S["Sidebar & overlay<br/>show advice and reasons"]
```

The full design and implementation (a dozen architecture diagrams, state machines, the coordinate system, algorithms and thresholds) is in the **[technical documentation](TECHNICAL.en.md)** ([中文](TECHNICAL.md)).

## Download

Download the archive for your platform from the [Releases](../../../releases) page:

| Platform | File |
|---|---|
| Windows 10/11 (x64) | `Majsoul-Browser-<version>-win-x64.zip` |
| macOS (Apple Silicon, M-series chips) | `Majsoul-Browser-<version>-mac-arm64.zip` |
| macOS (Intel) | `Majsoul-Browser-<version>-mac-x64.zip` |
| Linux (x64) | `Majsoul-Browser-<version>-linux-x86_64.AppImage` or `.tar.gz` |

This is a portable build: unzip it into a **writable folder** and run it. All data (login, models, game logs, logs, settings) is stored in the `MajsoulBrowserData/` folder next to the program; deleting that whole folder uninstalls it.

<details>
<summary>System prompts on first launch</summary>

- **macOS**: the app is not signed by Apple. The first time, right-click `Majsoul-Browser.app` → "Open". If it says the app is "damaged", run this in Terminal:
  `xattr -dr com.apple.quarantine /path/to/Majsoul-Browser.app`. Don't run it straight from the Downloads folder or from inside the archive; move it to another folder first.
- **Windows**: SmartScreen may show "Unknown publisher". Click "More info" → "Run anyway".
- **Linux**: run `chmod +x Majsoul-Browser-*.AppImage` and then launch it; data is stored next to the AppImage file.

</details>

## Preparing a model

The package **does not include an AI model**. You need to bring your own Mortal-format model file (`.pth`, containing the three parts `mortal`, `current_dqn` and `config`; v1–v4 are supported), then click "Import" on the app's "Model" page. On import, the file is validated and a test inference is run; once it passes, you can use it in games.

Without a model the app still opens and you can play normally, just without AI suggestions.

## Usage

1. Open the app and log in to Mahjong Soul in the embedded page.
2. Import and enable a model on the "Model" page.
3. Start a 4-player game: suggestions appear in the sidebar and on the game screen. At the top you can switch between **Off / Assist / Auto**.

| Shortcut (use ⌘ on macOS) | Action |
|---|---|
| `Ctrl+Shift+Space` | **Emergency stop**: stops auto-play immediately (works globally) |
| `Ctrl+Shift+A` | Toggle Assist / Off |
| `Ctrl+Shift+H` | Show / hide the in-game info layer |
| `Ctrl+\` | Collapse the sidebar |
| `Ctrl+,` | Settings |
| `Ctrl+1` … `Ctrl+4` | Switch sidebar tabs |

Only 4-player Mahjong is supported; in 3-player games all features are turned off automatically.

## Building from source

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 22 | Desktop app (Electron + React + TypeScript) |
| [pnpm](https://pnpm.io/) | 10 | Frontend dependencies |
| [uv](https://docs.astral.sh/uv/) | latest | Python 3.12 environment and dependencies (downloads Python automatically) |
| [Rust](https://rustup.rs/) | stable | Compiling Mortal's libriichi from source |
| Extra on Windows | — | Visual Studio Build Tools ("Desktop development with C++") |

### Running in development

```bash
git clone https://github.com/ClarkeLi/majsoul-browser.git
cd majsoul-browser

# Python Core (the first run compiles libriichi and downloads PyTorch; takes a few minutes)
cd core
uv sync
uv run pytest -q                  # tests that need a model file are skipped automatically

# Desktop app
cd ../apps/desktop
pnpm install
pnpm test && pnpm typecheck
SOUL_MODEL=/path/to/mortal.pth pnpm dev     # you can also start without a model and import one later on the "Model" page
```

In development mode, data is stored in `.data/` inside the repository; you can also point to any data directory with the environment variable `MAJSOUL_BROWSER_DATA_DIR`.

### Packaging

One command builds the release package for the current platform, written to `release/` in the repository root:

```bash
scripts/package.sh mac-arm64      # macOS Apple Silicon
scripts/package.sh mac-x64        # macOS Intel (can also be built on Apple Silicon, requires Rosetta 2)
scripts/package.sh win            # Windows x64 (run in Git Bash on Windows)
scripts/package.sh linux          # Linux x64
```

It does three things in order: `scripts/build-core.sh` freezes the Python Core into `dist/soul-core/` with PyInstaller → builds the frontend → packages with electron-builder.
PyInstaller can't cross-compile, so the Windows and Linux builds must be made on their respective systems.

> **Note on Intel Macs**: PyTorch no longer provides macOS x86_64 builds after 2.2, so Intel Macs are pinned to torch 2.2.2 + numpy 1.26 (distinguished by platform in `core/pyproject.toml`).
> Building the Intel version on Apple Silicon requires installing Rosetta 2 first (`softwareupdate --install-rosetta`); the script adds the `x86_64-apple-darwin` Rust target automatically.

More details (the multi-platform release workflow, tests and self-checks) are in the technical docs: [Build, Packaging and Release](TECHNICAL.en.md#17-build-packaging-and-release) and [Test Suite](TECHNICAL.en.md#18-test-suite).

## Project structure

```
apps/desktop/   Electron + React + TypeScript (electron-vite): main / preload / renderer (including the in-game info layer)
core/           Python 3.12: protocol decoding, 4-player state machine, decisions and Mortal inference; talks to the desktop app via NDJSON over stdio
vendor/mortal/  Mortal source (AGPL-3.0), used to compile libriichi
scripts/        Packaging, read-only check, SBOM
test/           Fake game page for end-to-end tests
```

## Design principles

- **Zero protocol writes**: never sends, modifies or drops any WebSocket frame (`scripts/verify-readonly.sh` enforces this in CI).
- **Zero system changes**: no proxy changes, no certificates, no admin rights; data is only written next to the program.
- **Stop on failure**: when the game state is out of sync, the model errors, or the click target is uncertain, automatic actions stop; it never "clicks on a guess".

## License and acknowledgements

This project is released under [GPL-3.0-or-later](../LICENSE); the parts taken from Mortal keep their AGPL-3.0 terms. Thanks to:

- [Mortal](https://github.com/Equim-chan/Mortal) (Equim-chan) — the mahjong AI model and libriichi
- [MajsoulMax](https://github.com/Avenshy/MajsoulMax) (Avenshy) — Mahjong Soul protocol decoding
- [MahjongCopilot](https://github.com/latorc/MahjongCopilot) (latorc) — click coordinate reference
- [riichi-mahjong-tiles](https://github.com/FluffyStuff/riichi-mahjong-tiles) (FluffyStuff) — tile images

See [NOTICE](../NOTICE) for details.
