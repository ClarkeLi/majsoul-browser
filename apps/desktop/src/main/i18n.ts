/** 主进程自己的文案（菜单、系统对话框、启动错误）。渲染层的文案在 renderer/i18n。 */
import { pickLang, type Lang } from '@shared/lang'

interface MainMessages {
  cannotStart: string
  coreMismatch: string
  importModel: string
  menuView: string
  toggleAssist: string
  toggleHud: string
  toggleSidebar: string
  settings: string
  tab: (n: number) => string
  translocated: string
  translocatedHint: (app: string) => string
  notWritable: (root: string, err: string) => string
  notWritableHint: string
}

const M: Record<Lang, MainMessages> = {
  'zh-CN': {
    cannotStart: '雀魂浏览器无法启动', coreMismatch: 'Core 版本不一致', importModel: '导入模型',
    menuView: '视图', toggleAssist: '切换辅助 / 关', toggleHud: '显示 / 隐藏游戏内信息层', toggleSidebar: '折叠侧栏', settings: '设置', tab: (n) => `标签 ${n}`,
    translocated: '应用被 macOS 隔离在只读的临时路径中运行',
    translocatedHint: (a) => `请把 ${a} 移动到其他文件夹后再打开，或执行：xattr -dr com.apple.quarantine "${a}"`,
    notWritable: (r, e) => `数据目录不可写：${r}（${e}）`, notWritableHint: '请把应用放到可写的文件夹，或用环境变量 MAJSOUL_BROWSER_DATA_DIR 指定数据目录'
  },
  en: {
    cannotStart: 'Majsoul-Browser could not start', coreMismatch: 'Core version mismatch', importModel: 'Import model',
    menuView: 'View', toggleAssist: 'Toggle assist / off', toggleHud: 'Show / hide in-game overlay', toggleSidebar: 'Collapse sidebar', settings: 'Settings', tab: (n) => `Tab ${n}`,
    translocated: 'macOS is running the app from a read-only quarantine location',
    translocatedHint: (a) => `Move ${a} to another folder and open it again, or run: xattr -dr com.apple.quarantine "${a}"`,
    notWritable: (r, e) => `Data folder is not writable: ${r} (${e})`, notWritableHint: 'Put the app in a writable folder, or set MAJSOUL_BROWSER_DATA_DIR to choose a data folder'
  },
  ja: {
    cannotStart: 'Majsoul-Browser を起動できません', coreMismatch: 'Core のバージョンが一致しません', importModel: 'モデルを読み込む',
    menuView: '表示', toggleAssist: 'アシスト / オフ 切替', toggleHud: 'ゲーム内オーバーレイの表示 / 非表示', toggleSidebar: 'サイドバーを折りたたむ', settings: '設定', tab: (n) => `タブ ${n}`,
    translocated: 'macOS によって読み取り専用の一時領域で実行されています',
    translocatedHint: (a) => `${a} を別のフォルダへ移動してから開き直すか、次を実行してください：xattr -dr com.apple.quarantine "${a}"`,
    notWritable: (r, e) => `データフォルダに書き込めません：${r}（${e}）`, notWritableHint: 'アプリを書き込み可能なフォルダに置くか、環境変数 MAJSOUL_BROWSER_DATA_DIR でデータフォルダを指定してください'
  },
  ko: {
    cannotStart: 'Majsoul-Browser를 시작할 수 없습니다', coreMismatch: 'Core 버전 불일치', importModel: '모델 가져오기',
    menuView: '보기', toggleAssist: '보조 / 끄기 전환', toggleHud: '게임 내 오버레이 표시 / 숨기기', toggleSidebar: '사이드바 접기', settings: '설정', tab: (n) => `탭 ${n}`,
    translocated: 'macOS가 앱을 읽기 전용 격리 경로에서 실행하고 있습니다',
    translocatedHint: (a) => `${a}을(를) 다른 폴더로 옮긴 뒤 다시 열거나 다음을 실행하세요: xattr -dr com.apple.quarantine "${a}"`,
    notWritable: (r, e) => `데이터 폴더에 쓸 수 없습니다: ${r} (${e})`, notWritableHint: '앱을 쓰기 가능한 폴더에 두거나 환경 변수 MAJSOUL_BROWSER_DATA_DIR로 데이터 폴더를 지정하세요'
  },
  de: {
    cannotStart: 'Majsoul-Browser konnte nicht starten', coreMismatch: 'Core-Version passt nicht', importModel: 'Modell importieren',
    menuView: 'Ansicht', toggleAssist: 'Assistent / Aus umschalten', toggleHud: 'In-Game-Overlay ein-/ausblenden', toggleSidebar: 'Seitenleiste einklappen', settings: 'Einstellungen', tab: (n) => `Tab ${n}`,
    translocated: 'macOS führt die App aus einem schreibgeschützten Quarantäne-Pfad aus',
    translocatedHint: (a) => `Verschiebe ${a} in einen anderen Ordner und öffne sie erneut, oder führe aus: xattr -dr com.apple.quarantine "${a}"`,
    notWritable: (r, e) => `Datenordner ist nicht beschreibbar: ${r} (${e})`, notWritableHint: 'Lege die App in einen beschreibbaren Ordner oder setze MAJSOUL_BROWSER_DATA_DIR für einen eigenen Datenordner'
  }
}

/** 系统语言（app ready 之前也能用） */
export function systemLang(): Lang {
  return pickLang(process.env.MAJSOUL_BROWSER_LANG || Intl.DateTimeFormat().resolvedOptions().locale || process.env.LANG)
}

export function mt(lang: Lang): MainMessages {
  return M[lang] ?? M.en
}
