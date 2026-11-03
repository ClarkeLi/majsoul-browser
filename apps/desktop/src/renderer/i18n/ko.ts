import type { Messages } from './zh-CN'

export const ko: Messages = {
  app: { name: 'Majsoul-Browser' },
  bars: {
    summary: '샹텐 / 유효패', after: '{{tile}} 버린 후', now: '현재 손패', tenpai: '텐파이', n: '{{n}}샹텐', total: '유효패 {{n}}장', done: '완성',
    kind: {
      run: '슌쯔', triplet: '커쯔', head: '머리', ryanmen: '양면', kanchan: '간짱', penchan: '변짱', pair: '대기 쌍', isolated: '고립패'
    },
    need: { ryanmen: '대기', kanchan: '대기', penchan: '대기', pair: '퐁' },
    form: { chiitoi: '치또이츠가 더 가까움', kokushi: '국사무쌍이 더 가까움' },
    ukeire: '유효패', left: '남은 {{n}}', safest: '가장 안전', noGroups: '쯔모 후 표시', round: '{{wind}}{{kyoku}}국'
  },
  tips: {
    title: '이유',
    why_closer: '{{tile}} 버리기가 {{alt}}보다 낫습니다. 버린 후 {{a}}로, {{alt}}의 {{b}}보다 화료에 더 가깝습니다.',
    why_more: '{{tile}}와 {{alt}} 모두 {{a}}지만 유효패가 더 많습니다. {{an}}장 대 {{bn}}장으로 더 빨리 나아갈 수 있습니다.',
    close_call: '{{tile}}와 {{alt}}의 차이가 아주 작습니다({{a}}·{{an}}장 대 {{b}}·{{bn}}장). 모델은 {{tile}} 쪽을 약간 선호합니다.',
    tenpai: '텐파이! 대기 {{waits}}, 테이블에 {{total}}장 남았습니다. 남은 패가 많을수록 화료하기 쉽습니다.',
    furiten: '후리텐: 자신의 대기패를 버린 적이 있어 이 손은 쯔모로만 화료할 수 있고 론은 안 됩니다.',
    safe_tiles: '{{opp}}의 위협이 높습니다. 손패에서 가장 안전한 패: {{list}}.',
    fold: '{{opp}}의 위협이 높고 화료까지 멀어서 베타오리를 권합니다. 먼저 버릴 패: {{list}}.',
    riichi_rule: '리치: 멘젠 텐파이일 때 선언하며, 이후 패를 바꿀 수 없습니다. 1판 추가에 뒷도라가 붙지만 공탁 1000점을 내야 합니다.',
    call_rule_chi: '치: 상가(왼쪽 사람)가 버린 패만 가능합니다. 멘젠이 깨져 리치 불가, 1판 감소하지만 더 빠릅니다.',
    call_rule_pon: '퐁: 누가 버린 패든 커쯔로 만들 수 있습니다. 멘젠은 깨지지만 역패는 퐁하면 바로 역이 됩니다.',
    call_rule_daiminkan: '대명깡: 남이 버린 패로 깡하면 도라가 추가로 뒤집혀 상대의 도라도 늘어납니다.',
    kyuushu_rule: '구종구패: 첫 손패에 요구패가 9종류 이상이면 유국시킬 수 있습니다. 손패가 너무 흩어졌을 때만 선택하세요.',
    pass_rule: '패스: 울면 멘젠이 깨져 타점이 떨어집니다. 이번엔 효율 향상이 뚜렷하지 않으니 멘젠을 유지하는 편이 낫습니다.',
    win_rule: '화료할 수 있습니다! 눌러서 확정하고 역과 점수를 확인하세요.',
    k_ukeire: '용어: 샹텐 = 텐파이까지 남은 단계, 유효패 = 뽑으면 손이 전진하는 패. 많을수록 좋습니다.',
    k_pushfold: '용어: 밀기 = 계속 공격, 당기기 = 방어하며 베타오리. 손이 좋으면 밀고, 상대 위협이 높은데 내 손이 나쁘면 당깁니다.',
    safe: '안전', opp: '{{seat}}', and: ', ',
    why: {
      genbutsu: '현물: 그 사람이 버린 패', suji: '스지: 리치 후 비교적 안전', half_suji: '한쪽 스지: 약간 안전', nochance: '벽 No Chance: 거의 쏘이지 않음',
      onechance: '벽 One Chance: 비교적 안전', honor: '자패: 안 나온 패, 여전히 위험', honor_seen: '자패: 2장 이상 보임', seen4: '4장 모두 보임: 쏘이지 않음', none: '스지 아님: 위험'
    }
  },
  automatch: {
    label: '자동 매칭', hint: '자동 모드: 한 판이 끝나면 「確認」을 차례로 눌러 결과 화면을 넘기고 「再來一場」으로 이어서 매칭합니다',
    desc: '자동 모드에서는 한 판이 끝나면 「確認」(순위, 단위 점수…)을 차례로 누르고, 지명도 화면에서 「再來一場」을 누른 뒤 팝업의 「確認」을 눌러 같은 방에서 계속 매칭합니다. 스크린샷에서 버튼이 실제로 보일 때만 누르며, 막히면 멈추고 알려 줍니다',
    stuck: '자동 매칭을 이어 가지 못했습니다. 직접 처리한 뒤 「자동 매칭」을 다시 누르면 현재 화면에서 이어서 진행합니다',
    s: { off: '꺼짐', playing: '대국 중', scanning: '화면 인식', joining: '방 입장', waiting: '매칭 대기', queued: '대기열', stuck: '멈춤' }
  },
  yaku: { 0: '멘젠 쯔모', 1: '리치', 2: '오픈 리치', 3: '일발', 4: '창깡', 5: '영상개화', 6: '해저로월', 7: '하저로어', 8: '더블 리치', 9: '더블 오픈 리치', 10: '유국만관', 11: '인화', 12: '핀후', 13: '탕야오', 14: '이페코', 15: '역패 백', 16: '역패 발', 17: '역패 중', 18: '자풍 동', 19: '자풍 남', 20: '자풍 서', 21: '자풍 북', 22: '장풍 동', 23: '장풍 남', 24: '장풍 서', 25: '장풍 북', 26: '삼색동순', 27: '일기통관', 28: '찬타', 29: '혼노두', 30: '대대화', 31: '산안커', 32: '산깡쯔', 33: '삼색동각', 34: '치또이츠', 35: '소삼원', 36: '혼일색', 37: '준찬타', 38: '량페코', 39: '청일색', 100: '국사무쌍', 101: '구련보등', 102: '스안커', 103: '대삼원', 104: '소사희', 105: '녹일색', 106: '스깡쯔', 107: '자일색', 108: '청노두', 109: '대차륜', 110: '대칠성', 111: '대사희', 112: '국사무쌍 13면', 113: '스안커 단기', 114: '순정 구련보등', 115: '천화', 116: '지화', 117: '인화', 120: '도라', 121: '아카도라', 122: '뒷도라' },
  coach: {
    title: '코치', yourTurn: '내 차례', statTitle: '이번 판에서 내 선택이 AI와 같았던 횟수',
    agreeStat: '일치 {{a}}/{{n}}', practice: '연습', practiceOn: '연습 중', practiceTip: '연습 모드: 정답을 숨기고, 패를 버리면 바로 AI의 선택과 비교합니다',
    agreeShort: '일치', last: '직전 수', agree: 'AI와 일치', youPlayed: '내 선택', aiPick: 'AI 선택', aiProb: 'AI {{p}}%', riichiMark: '리치', loss: '손실 {{v}}',
    think: '먼저 이번 수를 직접 판단해 보세요. 패를 버리면 바로 AI의 생각을 알려 드립니다.',
    thinkHint: '요령: 먼저 샹텐을 세고, 유효패를 비교하고, 텐파이 후에는 좋은 모양을 봅니다. 누가 리치하면 현물과 스지부터 찾으세요. 손패에 마우스를 올리면 패마다 위험도를 볼 수 있습니다.',
    hiddenBar: '연습 중: 먼저 직접 생각해 보세요. 정답을 공개하면 버린 후의 손패 구성과 유효패가 여기에 표시됩니다.',
    reveal: '정답 보기', tenpaiNow: '텐파이', noRec: '내 차례를 기다리는 중', confTitle: '이번 수에 대한 AI의 확신',
    adviceChip: { push: '밀기: 계속 공격', balance: '공수 균형', fold: '당기기: 베타오리' },
    waitLeft: '대기패 총 {{n}}장',
    col: { cand: '후보', ai: 'AI', after: '샹텐', ukeire: '유효패', risk: '방총' },
    mistakes: '이번 판 실수', lossSum: '누적 손실 {{v}}', noMistakes: '이번 판은 아직 실수가 없습니다',
    opps: '상대 · 방어', noSafe: '손패에 상대에게 안전한 패가 없습니다',
    reason: { riichi: '리치 ({{n}}순째 선언)', riichiNoTurn: '리치', melds: '후로 {{n}}회, 빠른 화료를 노리는 듯', closed: '멘젠, 리치 없음' },
    level: { high: '텐파이 가능성 높음', mid: '텐파이 가능성 보통', low: '텐파이 가능성 낮음' },
    why: { genbutsu: '현물', suji: '스지 (상대가 {{basis}} 버림)', half_suji: '한쪽 스지 (상대가 {{basis}} 버림)', honor_seen: '자패 {{n}}장 보임' },
    whyShort: { genbutsu: '현물', suji: '스지', half_suji: '한쪽 스지', honor_seen: '{{n}}장 보임' },
    basisLine: '근거: 버린 후 {{sh}} · 추천패 방총 {{risk}}% · 최대 위협 {{who}} {{th}}%',
    hand: { risk: '방총 {{v}}%', vs: '주로 {{who}}에게', after: '버리면: 버린 후 {{sh}}, 유효패 {{n}}장', ai: 'AI가 고를 확률 {{p}}%' },
    place: {
      rank: '{{n}}위', rankShort: '위', up: '윗순위와 {{v}} 차', down: '아랫순위보다 {{v}} 앞', allLast: '올라스',
      need: '순위를 올리려면 {{tier}} 필요 (타가 방총 또는 쯔모 {{pts}}점), {{who}}에게 직격하면 {{direct}}만 있으면 됩니다.',
      needAny: '본장 점수와 공탁만으로 충분합니다. 어떤 화료든 순위가 오릅니다.',
      advice: {
        lead_safe: '1위입니다. 쏘이지만 않으면 이기니 방어 우선, 기회가 오면 빠르게 화료해 끝내세요.',
        last_must_win: '4위입니다. 4위를 피하려면 화료해야 하니 타점 우선입니다.',
        avoid_fourth: '4위와 가깝습니다. 4위 회피가 최우선이니 뒤에 있는 사람에게 쏘이지 마세요.',
        chase: '윗순위를 따라잡을 수 있습니다. 필요한 타점을 먼저 확인하고 밀지 당길지 정하세요.'
      }
    },
    tier: { '1han': '1판', '2han': '2판', '3han': '3판', mangan: '만관', haneman: '하네만', baiman: '배만', sanbaiman: '삼배만', yakuman: '역만', impossible: '한 번의 화료로는 못 따라잡음' },
    ron: '론', tsumo: '쯔모', ifRiichi: '리치 시', noYaku: '역 없음, 론 불가', han: '판', fu: '부',
    level2: { mangan: '만관', haneman: '하네만', baiman: '배만', sanbaiman: '삼배만', yakuman: '역만' },
    lesson: '학습', prev: '이전', next: '다음'
  },
  gloss: {
    shanten: { t: '샹텐', a: '샹텐', d: '텐파이까지 남은 단계입니다. 0샹텐 = 텐파이, 1샹텐 = 유효패 한 장만 더 들어오면 텐파이. 타패의 제1원칙은 샹텐 수를 최대한 줄이는 것입니다.' },
    ukeire: { t: '유효패', a: '유효패', d: '뽑으면 샹텐 수가 줄어드는 패로, 아직 보이지 않은 장수로 셉니다. 샹텐이 같다면 유효패가 많을수록 텐파이가 빠릅니다.' },
    tenpai: { t: '텐파이', a: '텐파이', d: '한 장만 더 있으면 화료하는 상태입니다. 유국 시 텐파이인 사람은 텐파이가 아닌 사람에게서 노텐 벌부를 받습니다.' },
    ryanmen: { t: '양면', a: '양면', d: '이어진 수패 두 장(예: 34)이 양쪽(2 또는 5)을 기다리는 모양입니다. 최대 8장으로 가장 좋은 탓쯔입니다.' },
    kanchan: { t: '간짱', a: '간짱', d: '가운데가 빠진 모양(예: 46에서 5 대기)입니다. 4장뿐이라 양면보다 나쁩니다.' },
    penchan: { t: '변짱', a: '변짱', d: '12에서 3 대기, 또는 89에서 7 대기입니다. 4장뿐이고 좋은 모양으로 바뀌기 어려워 보통 먼저 풉니다.' },
    head: { t: '머리', a: '머리', d: '화료에 필요한 한 쌍(작두)입니다. 기본 화료형 = 몸통 4개 + 머리 1개.' },
    taatsu: { t: '탓쯔', a: '탓쯔', d: '한 장만 더 있으면 몸통이 되는 두 장입니다(양면, 간짱, 변짱, 대기 쌍). 탓쯔가 너무 많으면 나쁜 것부터 풉니다.' },
    isolated: { t: '고립패', a: '고립패', d: '다른 패와 이어지지 않는 외톨이 패입니다. 보통 자패와 요구 고립패부터 버리고 중장패를 남깁니다.' },
    goodshape: { t: '좋은 모양', a: '좋은 모양|나쁜 모양', d: '좋은 모양 = 대기패가 많은 텐파이(양면, 다면). 나쁜 모양 = 간짱, 변짱, 단기처럼 대기가 한 종류뿐인 것. 좋은 모양의 리치가 승률이 훨씬 높습니다.' },
    genbutsu: { t: '현물', a: '현물', d: '그 사람이 직접 버린 패입니다. 후리텐 규칙 때문에 그 사람에게는 절대 쏘이지 않습니다. 방어 시 첫 번째 선택지입니다.' },
    suji: { t: '스지', a: '스지', d: '상대가 4를 버렸다면 1-4 양면으로 1이나 7을 기다릴 수 없습니다(1-4-7, 2-5-8, 3-6-9가 스지). 스지가 아닌 패보다 안전하지만 간짱과 단기에는 쏘입니다.' },
    kabe: { t: '벽', a: '벽|No Chance|One Chance', d: '어떤 패 4장이 모두 보이면 그 패로 만드는 양면은 존재할 수 없습니다(No Chance). 3장이 보이면 One Chance로 비교적 안전합니다.' },
    furiten: { t: '후리텐', a: '후리텐', d: '대기패가 자신의 패에 있거나 (방금 남의 패를 놓친 경우) 쯔모로만 화료할 수 있고 론은 안 됩니다.' },
    riichi: { t: '리치', a: '리치', d: '멘젠 텐파이에서 선언하고 1000점을 냅니다. 1판 추가, 일발과 뒷도라 기회가 있지만 이후 패를 바꿀 수 없고 방어도 못 합니다.' },
    ippatsu: { t: '일발', a: '일발', d: '리치 후 한 바퀴 안에 (중간에 울음 없이) 화료하면 1판 추가입니다.' },
    pushfold: { t: '밀고 당기기', a: '밀기|당기기|베타오리', d: '밀기 = 계속 공격, 당기기 = 베타오리로 방어. 내 속도와 타점을 상대의 위협과 비교하세요. 손이 좋으면 밀고, 손이 나쁜데 리치를 만나면 당깁니다.' },
    menzen: { t: '멘젠', a: '멘젠', d: '치, 퐁, 대명깡이 없는 손패입니다. 멘젠일 때만 리치와 멘젠 쯔모가 가능합니다.' },
    yaku: { t: '역', a: '역', d: '화료에는 최소 1개의 역이 필요하며 도라는 역이 아닙니다. 울면 사라지는 역이 많으니 먼저 역이 있는지 확인하세요.' },
    dora: { t: '도라', a: '도라', d: '표시패의 다음 패가 도라이며 1장당 1판 추가지만 역은 아닙니다. 아카 5도 도라로 칩니다.' },
    honba: { t: '본장', a: '본장', d: '연장이나 유국 후 쌓이는 수로, 화료 시 본장 하나당 300점이 추가됩니다.' },
    kyotaku: { t: '공탁', a: '공탁', d: '테이블에 놓인 리치봉으로, 다음에 화료한 사람이 가져가며 개당 1000점입니다.' },
    tsumogiri: { t: '쯔모기리', a: '쯔모기리', d: '뽑은 패를 그대로 버리는 것입니다. 연속으로 쯔모기리하면 상대 손이 이미 완성됐거나 텐파이일 수 있습니다.' },
    avoid4: { t: '4위 회피', a: '4위 회피|라스 회피', d: '단위전에서는 4위의 감점이 다른 순위보다 훨씬 큽니다. 혼텐으로 올라가는 핵심은 4위를 덜 하는 것입니다. 뒤처지면 화료하고, 4위가 가까우면 절대 쏘이지 마세요.' },
    allLast: { t: '올라스', a: '올라스', d: '마지막 국입니다. 최종 순위만 중요하므로 매 수를 「순위를 올리려면 몇 점이 필요한지, 4위로 떨어지지 않는지」로 판단합니다.' },
    placement: { t: '순위', a: '순위|순위 상승', d: '최종 순위가 단위 점수를 결정합니다. 한 판에서 몇 점을 따느냐보다 윗순위, 아랫순위와의 점수 차를 확인하는 것이 더 중요합니다.' }
  },
  fx: {
    glyph: { tenpai: '聴', agree: '良', combo: '連', miss: '惜', riichi: '立', rankUp: '昇', rankDown: '落' },
    tenpai: '텐파이!', tenpaiSub: '{{n}}종 대기 · 남은 {{left}}장',
    agree: '일치!', agreeSub: 'AI와 같은 생각', combo: '콤보', comboSub: '{{n}}수 연속 AI와 일치',
    miss: '다시 생각해 봐요', youPlayed: '내 선택', aiPick: 'AI 선택', loss: '가치 차 {{v}}',
    riichi: '{{who}} 리치!', riichiSafe: '이 패가 가장 안전', riichiNoSafe: '현물도 스지도 없음, 베타오리 고려',
    rankUp: '{{n}}위로 상승!', rankDown: '{{n}}위로 하락',
    rankSub1: '리드를 지키세요: 안 쏘이면 이깁니다', rankSub2: '1위가 멀지 않아요, 기회를 노리세요', rankSub3: '먼저 4위부터 피하고 기회를 보세요', rankSub4: '타점이 필요해요: 뒤집을 수 있는 패를',
    risk: '방총', danger: '리치 ×{{n}}', sync: '일치율', streak: '콤보', best: '최고 {{n}}',
    track: '샹텐', now: '현재', after: '버린 후', win: '화료', tenpaiShort: '텐', race: '후보 경쟁', gauge: { fold: '당김', balance: '균형', push: '밀기' }
  },
  hud: {
    badge: { discard: '打', riichi: '立', call: '鳴', win: '和', kyuushu: '流', pass: '過', think: '考', idle: '待', opps: '守' },
    pickCombo: '이 조합 선택',
    bal: { title: '밀고 당기기', sub: '이득 vs 손실', net: '추천 순이득', empty: '내 차례가 되면 후보별 화료 이득(초록)과 방총 손실(빨강)이 여기에 표시됩니다.', hidden: '연습 모드: 패를 버린 후에 후보별 이득과 손실이 표시됩니다.' },
    title: '게임 내 정보 레이어', desc: '추천, 패 효율, 위험도, 학습 팁을 게임 화면 위에 바로 표시합니다 (패 테이블, 버튼, 손패는 가리지 않음)',
    scale: '정보 레이어 크기', scaleDesc: '창 크기에 맞춰 자동 조절되며, 여기서 미세 조정합니다', small: '작게', mid: '보통', large: '크게',
    side: '표시 위치', sideDesc: '정보 패널을 화면의 어느 쪽에 둘지', both: '양쪽', left: '왼쪽만', right: '오른쪽만',
    teach: '학습 팁', teachDesc: '「왜 이렇게 버리는지」를 설명하고 용어를 알려 줍니다',
    reserve: '정보 바 확보', reserveDesc: '게임 화면 위아래에 한 줄씩 비워 손패 구성, 유효패, 점수, 안전패를 표시합니다', dock: '정보 바 위치', dockDesc: '남는 공간을 나누는 방법', dockSplit: '위아래 균등', dockBottom: '모두 아래', bars: '손패 위험도 바', barsDesc: '손패 위에 방총 위험을 표시합니다',
    practice: '연습 모드', practiceDesc: 'AI의 정답을 숨기고 패를 버린 후 비교하며, 이번 판의 일치율과 실수를 집계합니다',
    toggleHint: '정보 레이어 표시 / 숨기기'
  },
  hero: {
    sides: '{{n}}면', waiting: '대국 대기 중', conf: '확신', tsumogiri: '쯔모기리', after: '버린 후', ukeire: '유효패 {{n}}장', waits: '대기', left: '남은 {{n}}',
    risk: '방총 {{v}}%', think: '생각 {{s}}초',
    arbSoft: '알고리즘 보정 · 모델이 망설임 (1순위 {{m}}), 순이득 +{{g}}', arbHard: '알고리즘 거부 · 모델 1순위 {{m}}의 방총 손실이 너무 큼, 순이득 +{{g}}', arbVeto: '순위 회피 · {{p}}점 화료해도 여전히 꼴찌이고 대국이 끝남',
    styleDice: '주사위 · 모델 1순위 {{m}}', styleGamble: '승부수 · {{route}} {{n}}장 부족 · 모델 1순위 {{m}}',
    act: { pass: '패스', reach: '리치', pon: '퐁', chi: '치', hora: '화료' },
    route: { kokushi: '국사무쌍', suuankou: '스안커', daisangen: '대삼원', suushi: '사희', tsuuiisou: '자일색', chuuren: '구련보등' },
    eyebrow: { discard: '타패 추천', riichi: '리치 추천', call: '울기 추천', win: '화료', kyuushu: '유국', pass: '울지 않음' }
  },
  shanten: { tenpai: '텐파이', n: '{{n}}샹텐', furiten: '후리텐', turn: '{{n}}순째', seatWind: '자풍 {{w}}', leftShort: '남은 {{n}}', honbaShort: '{{n}}본장' },
  verdict: { push: '공격', balance: '균형', fold: '베타오리', riskOf: '추천패 방총률', threatOf: '테이블 최대 위협', pushDesc: '이득이 위험보다 크니 계속 공격', balanceDesc: '공수를 겸하며 안전패에 주의', foldDesc: '상대 위협이 높으니 베타오리 권장' },
  cards: {
    eff: '후보 · 패 효율', effSub: '버린 후 샹텐과 유효패', hand: '손패 · 위험도', handSub: '바가 길수록 위험', waits: '텐파이 · 대기패', waitsAfter: '버린 후 대기패',
    verdict: '밀고 당기기 판단', opps: '상대 · 위협', scores: '점수 현황', log: '기록', map: '위험도 지도', mapSub: '종합 방총률',
    ic: { tips: '学', eff: '効', hand: '手', waits: '聴', verdict: '判', opps: '敵', scores: '点', log: '録', map: '図', points: '値', values: '衡', know: '知' },
    expand: '펼치기', collapse: '접기'
  },
  tier: { 0: '안전', 1: '낮음', 2: '보통', 3: '높음', 4: '매우 위험' },
  eff: { shanten: '샹텐', ukeire: '유효패', total: '총 {{n}}장', tenpaiAfter: '텐파이', cnt: '{{n}}샹텐', noData: '쯔모 후 표시' },
  scoreCard: { diff: '{{v}}', dealer: '친', you: '나', riichi: '리치' },
  oppRow: { threat: '위협', closed: '멘젠', melds1: '후로 1', melds2: '후로 2', melds3: '후로 3', riichi: '리치', levelHigh: '높음', levelMid: '보통', levelLow: '낮음', river: '패산 앞 버림패' },
  topbar: {
    connected: '연결됨', lobby: '로비', disconnected: '연결 안 됨',
    model: '{{name}} · {{ms}}ms', modelNone: '모델 없음',
    settings: '설정', stop: '정지', stopHint: '긴급 정지'
  },
  mode: { label: '모드', off: '끔', assist: '보조', auto: '자동' },
  tabs: { match: '대국', review: '복기', stats: '통계', models: '모델' },
  sidebar: { collapse: '사이드바 접기', expand: '사이드바 펼치기', resize: '드래그해서 사이드바 너비 조절' },
  status: { frames: '프레임 {{n}}', decisions: '결정 {{n}}', agree: '일치율 {{v}}', dataDir: '데이터 폴더 {{path}}', info: '정보' },
  round: {
    label: '{{wind}}{{kyoku}}국 {{honba}}본장', kyotaku: '공탁 {{n}}', left: '남은 패 {{n}}', dora: '도라',
    dealer: '친 ▸ {{seat}}'
  },
  seat: { self: '나', next: '하가', across: '대면', prev: '상가' },
  wind: { E: '동', S: '남', W: '서', N: '북' },
  rec: {
    title: '추천', confidence: '신뢰도 {{v}}%', candidates: '후보', hand: '손패', opponents: '상대', log: '기록',
    recent: '최근 {{n}}', tsumogiri: '쯔모기리', none: '—'
  },
  action: {
    discard: '타패', riichi: '리치', chi: '치', pon: '퐁', daiminkan: '깡', kakan: '가깡', ankan: '안깡',
    ron: '론', tsumo: '쯔모', kyuushu: '유국', kyuushuNote: '구종구패', pass: '패스'
  },
  exec: {
    idle: '조작 대기 중', thinking: '생각 중', scheduled: '{{s}}초 후 실행', executing: '실행 중', confirmed: '확인됨',
    paused: '일시정지: {{reason}}', failed: '실패: {{reason}}', assistMode: '보조 모드', autoMode: '자동 모드', offMode: '꺼짐'
  },
  reason: {
    minimized: '창이 최소화됨', unconfirmed: '클릭이 게임에서 확인되지 않음', click_failed: '클릭 실패', mismatch: '조작이 예상과 다름',
    model_failed: '모델이 연속 실패', manual: '수동 조작 감지', desync: '대국 상태 불일치', paused: '일시정지됨', hotkey: '단축키', user: '직접 정지'
  },
  banner: { resume: '자동 재개' },
  opp: { riichi: '리치', tenpai: '텐파이', tenpaiNone: '—', high: '높음', mid: '보통', low: '낮음', melds: '후로 {{n}}', score: '{{n}}' },
  timeline: { agree: '일치', differ: '불일치', executed: '실행됨', recommended: '추천 {{what}}', empty: '아직 결정 기록이 없습니다' },
  empty: {
    disconnected: { title: '게임 연결을 기다리는 중', desc: '왼쪽에서 작혼에 로그인하면 시작됩니다' },
    lobby: { title: '로비에 있음', desc: '4인 대국에 들어가면 추천이 표시됩니다' },
    sanma: { title: '3인 마작은 아직 지원하지 않습니다', desc: '추천과 자동 조작이 비활성화됩니다' },
    desynced: { title: '대국 상태 불일치', desc: '다음 판에 자동으로 복구됩니다', action: '다시 동기화' },
    noModel: { title: '사용 가능한 모델이 없습니다', desc: '모델을 가져오면 추천이 표시됩니다', action: '모델 가져오기' },
    modelError: { title: '모델 로드 실패', desc: '오류 코드 {{code}}', action: '자세히 보기' },
    coreDown: { title: '추론 코어가 실행 중이 아닙니다', desc: '다시 시작을 시도하는 중' }
  },
  dialog: {
    autoTitle: '자동 조작 켜기',
    autoItems: ['게임 화면에서 마우스 클릭을 시뮬레이션합니다', '이상이 생기면 즉시 일시정지합니다', '계정 위험이 있습니다'],
    cancel: '취소', enable: '켜기'
  },
  toast: { autoStopped: '자동 조작이 중지되었습니다' },
  risk: { label: '위험도 {{n}}', hover: '이 패 버리기: q값 차 {{dq}} · 위험도 {{risk}}' },
  tile: {
    suit: { m: '만', p: '통', s: '삭' },
    num: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    honor: { E: '동', S: '남', W: '서', N: '북', P: '백', F: '발', C: '중' },
    red: '아카 '
  },
  placeholder: { soon: '이 페이지는 이후 버전에서 제공됩니다' },
  wizard: {
    title: '시작하기 전에',
    items: ['앱은 페이지 트래픽을 읽기만 하며, 서버로 데이터를 보내거나 수정하거나 버리지 않습니다', '기본은 보조 모드입니다: 추천과 클릭 위치만 표시합니다', '자동 모드는 마우스 클릭을 시뮬레이션하며 계정 위험이 있습니다. 실행할 때마다 직접 다시 켜야 합니다', '로그인 상태와 기록은 데이터 폴더에 저장되며 언제든 지울 수 있습니다'],
    start: '시작하기'
  },
  review: {
    title: '복기', empty: '아직 대국 기록이 없습니다', emptyDesc: '한 판을 마치면 여기에 나타납니다', back: '돌아가기', agreeRate: 'AI 일치율',
    decisions: '결정', qLoss: 'q값 손실', mistakes: '주요 실수 Top 5', turns: '순별', yourChoice: '내 선택', recommended: '추천',
    loss: '손실 {{v}}', noMistakes: '뚜렷한 실수 없음', game: '대국 {{id}}', refresh: '새로고침'
  },
  stats: { title: '통계', dist: '행동 분포', avgRank: '평균 순위', winRate: '화료율', dealInRate: '방총률', agree: 'AI 일치율', last20: '최근 20판', trend: '일치율 추이', empty: '데이터 부족' },
  models: {
    title: '모델', import: '.pth 가져오기', active: '사용 중', activate: '사용', size: '{{mb}} MB', imported: '{{date}} 가져옴', device: '장치 {{d}}',
    steps: { copy: '복사', verify: '검증', load: '로드 테스트' }, importing: '가져오는 중', failed: '가져오기 실패: {{msg}}', pending: '다음 판부터 적용됩니다',
    empty: '가져온 모델이 아직 없습니다', emptyDesc: 'Mortal 4인 마작 .pth 파일을 가져오세요'
  },
  pts: {
    title: '타점 · 다마 vs 리치', sub: '기대값 = 화료율 × 평균 타점',
    ron: '론', tsumo: '쯔모', dama: '다마', riichi: '리치', riichiDone: '리치 중', open: '후로', wait: '대기패',
    noYaku: '역 없음', winRate: '화료율', avg: '평균 타점', ev: '기대값', best: '추천', warnLabel: '주의',
    notes: {
      riichiBetter: '리치 +1판(일발과 뒷도라 기회도 있음)으로 평균 타점이 {{a}}에서 {{b}}로 오릅니다. 상대가 방어해 화료율이 떨어져도 기대값은 여전히 {{d}} 더 높습니다.',
      damaBetter: '다마만으로도 타점이 충분합니다. 리치하면 상대가 방어해 화료율이 떨어지는 손해가 판수 증가 이득보다 큽니다 (기대값 {{d}} 낮음).',
      yakulessDama: '다마로는 역이 없어 론이 불가능합니다. 화료하려면 리치해야 합니다.',
      close: '리치는 다마보다 기대값이 {{d}}만 높아 1할도 안 됩니다. 다마가 더 안정적이고 베타오리 여지도 남으므로 다마를 추천합니다.',
      noRiichi_no_points: '점수가 1000점 미만이라 리치할 수 없습니다', noRiichi_no_draw: '패산이 한 순도 안 남아 리치할 수 없습니다', noRiichi_four_riichi: '나머지 세 명이 모두 리치 중이라 리치하면 사가리치 유국이 됩니다',
      onlyDama: ', 다마만 가능합니다.', onlyTsumo: ': 다마로는 역이 없어 멘젠 쯔모만 가능합니다.',
      inRiichi: '리치 중: 쯔모기리만 가능하며, 화료율에는 상대의 방어가 이미 반영되어 있습니다.', openHand: '후로 손: 리치 선택지가 없으며 타점은 기존 역과 도라에 달려 있습니다.',
      furiten: '후리텐: 쯔모만 가능하며 화료율에 후리텐이 반영되어 있습니다.',
      stick: '리치봉 비용 차감: 기대 손실 {{n}} (화료하지 못하면 1000점을 돌려받지 못함).', pot: '테이블의 공탁 {{n}}점은 화료자에게 가며 기대값에 포함되어 있습니다.',
      model: '화료율 모델: 한 번 뽑을 때 적중 확률 = 남은 대기패 / 안 보인 패({{u}}), 나는 약 {{d}}번 더 뽑을 수 있음. 상대가 내 대기패를 버리는 경우와 상대의 선화료도 고려합니다. 뒷도라는 미포함.'
    },
    warn: { zero_points: '리치 후 점수가 0이 됩니다: 다시 론당하거나 타가 쯔모하면 토비입니다', low_points: '리치 후 {{n}}점만 남습니다: 방총이나 쯔모당하면 토비일 가능성이 큽니다', last_draws: '리치 후 최대 {{n}}번만 더 뽑을 수 있어 사실상 해저뿐입니다', chase: '이미 {{n}}명이 리치 중: 추격 리치 후에는 베타오리할 수 없고 밀어붙여야 합니다' }
  },
  bal: {
    gain: '화료 이득', loss: '방총 손실', net: '순',
    note: '이득 = 기대값(화료율 × 평균 타점), 손실 = Σ 상대 방총률 × 상대 예상 타점 (리치는 8000, 친은 ×1.5).',
    notTenpai: '{{n}}샹텐: 화료 이득은 샹텐, 유효패, 남은 순목, 상대 위협으로 추정하며(사선 초록 바), 가운데가 순이득입니다.',
    notTenpaiNone: '{{n}}샹텐: 이 패는 아직 화료 이득을 계산할 수 없어 빨간 바는 방총 손실만 나타냅니다.'
  },
  vals: {
    title: '후보 · 이득 vs 손실', sub: '알고리즘 보정과 같은 기준', attack: '공격', loss: '손실', net: '순이득', model: 'AI 1순위', pick: '실행', riichi: '리치',
    hint: '초록 = 공격 가치 (텐파이면 기대값, 아니면 샹텐과 유효패로 추정), 빨강 = 방총 손실 (종반에는 순위 하락 포함), 오른쪽은 뺀 후의 순이득(점)입니다.'
  },
  know: {
    title: '알아 두기',
    k_furiten: '후리텐: 대기패({{waits}}) 중에 내가 버린 패가 있어 론은 안 되고 쯔모만 가능합니다. 대기를 바꾸는 것도 고려하세요.',
    k_yakuless: '역 없는 텐파이: 멘젠인데 역이 없으면 다마로는 쯔모만 가능하고, 론하려면 먼저 리치해야 합니다.',
    k_fold: '{{opp}}이(가) 리치했고 나는 {{n}}샹텐입니다. 이때 화료율은 보통 10% 미만이므로 대체로 베타오리하고 현물부터 버리세요.',
    k_suji: '{{opp}}에게: 현물은 절대 안전하고, 스지는 양면 대기만 막아 줍니다. {{ends}}한쪽 스지와 스지 아닌 4–6이 가장 위험합니다.', k_suji_ends: '{{tiles}} 같은 요구패 스지가 가장 안전하고, ',
    k_no_chance: '벽(No Chance): {{tiles}}의 양면 탓쯔는 이미 불가능하며, 단기 / 샤보 대기에만 쏘입니다.',
    k_one_chance: 'One Chance: {{tiles}}의 양면 탓쯔는 한 장만 남아 비교적 안전한 편입니다.',
    k_multi_wait: '다면 대기({{waits}}): {{n}}장 남음. 좋은 모양의 텐파이는 리치의 기대값이 보통 다마보다 높습니다.',
    k_riichi_ev: '이 손은 리치가 다마보다 기대값이 {{d}} 높습니다 (평균 타점 {{a}} → {{b}}). 좋은 모양이거나 싼 손은 리치로 판수를 올리는 편이 이득입니다.',
    k_dama_ev: '이 손은 다마가 리치보다 기대값이 {{d}} 높습니다. 다마만으로도 타점이 충분({{a}})하고, 리치하면 상대가 방어해 화료율이 떨어집니다.',
    k_ev_close: '리치는 다마보다 기대값이 {{d}}만 높고 (평균 타점 {{a}} → {{b}}) 차이가 1할도 안 됩니다. 다마가 더 안정적이고 베타오리 여지도 남습니다.',
    k_not_max: 'Mortal은 유효패가 가장 많은 {{best}}({{bn}}장)가 아니라 {{tile}}({{n}}장)를 버렸습니다. 타점, 모양 발전, 안전도를 함께 보기 때문에 유효패 수가 유일한 기준은 아닙니다.',
    k_ukeire: '유효패: 샹텐을 전진시키는 패. 버릴 때는 버린 후의 샹텐을 먼저 비교하고, 그다음 유효패 장수를 비교하세요.'
  },
  settings: {
    title: '설정',
    general: '일반', language: '언어', languageDesc: '인터페이스 언어', theme: '테마', themeDesc: '기본은 다크',
    themeDark: '다크', themeLight: '라이트', themeSystem: '시스템 설정 따름',
    auto: '자동 조작', playStyle: '플레이 스타일 (주사위 · 승부수 · 알고리즘 보정)', playStyleDesc: '더 사람처럼 두기: 평가가 비슷하면 주사위로 고르고, 역만 루트가 보이면 승부를 걸고, 뚜렷한 손해가 보이면 알고리즘이 수정합니다. 끄면 항상 모델 1순위대로 두며 일치율은 100%입니다',
    agree: '예상 AI 일치율', agreeOn: '켜면 약 80%: 선택지가 거의 비슷할 때만 벗어나므로 모델 자체의 평가로는 손실이 아주 작습니다.', agreeOff: '꺼짐: 매 수 모델 1순위대로 두므로 일치율 100%입니다.',
    style: {
      dice: '주사위', diceDesc: '1순위와 평가 차이가 아주 작은 대안 중에서 무작위로 고릅니다 (리치 후, 화료 가능할 때는 쓰지 않음)',
      gamble: '승부수', gambleDesc: '국사무쌍, 스안커, 대삼원, 사희, 자일색, 구련보등: 루트가 가까우면 유지하며, 남3국/남4국에서 리드 중이면 걸지 않음',
      arb: '알고리즘 보정', arbDesc: '모델이 망설이고 알고리즘이 더 낙관하거나 방총 손실이 뚜렷이 클 때 수정하며, 마지막 국에서 화료해도 꼴찌면 화료를 포기합니다'
    },
    delay: '생각 시간', delayDesc: '확신도에 따라 자동: 확신이 높으면 빠르게, 고민되면 더 오래 (새 국 첫 타패는 최소 2초)', delayValue: '1.2–4.4초', failPolicy: '실패 시 동작', failPolicyDesc: '이상이 생기면 즉시 일시정지합니다', failPolicyValue: '실패 시 일시정지',
    display: '표시', overlay: '게임 내 하이라이트', overlayDesc: '게임 화면에서 어디를 눌러야 하는지 표시합니다', risk: '위험도 바', riskDesc: '손패 아래에 방총 위험도를 표시합니다', candidates: '후보 개수', candidatesDesc: '추천 카드 아래에 표시할 후보 줄 수',
    tileSize: '패 크기', tileSizeDesc: '손패 줄의 최대 패 너비', sizeS: '작게', sizeM: '보통', sizeL: '크게',
    data: '데이터', openDir: '폴더 열기', openDirDesc: '앱 데이터, 모델, 기록이 모두 여기에 있습니다', openDirBtn: '열기',
    records: '대국 기록 저장', recordsDesc: '복기에 사용하며 언제든 끌 수 있습니다', clearLogin: '로그인 정보 삭제', clearLoginDesc: '작혼 계정에서 로그아웃하고 웹 데이터를 지웁니다', clearRecords: '기록 삭제', clearRecordsDesc: '모든 대국 기록을 삭제합니다',
    clear: '삭제', confirmTitle: '삭제 확인', confirmLogin: '로그아웃하고 웹 데이터를 모두 지웁니다.', confirmRecords: '모든 대국 기록이 삭제되며 복구할 수 없습니다.',
    about: '정보', version: '버전', license: '라이선스', licenseValue: 'GPL-3.0-or-later', thirdParty: '서드파티 고지', thirdPartyDesc: 'Mortal (AGPL-3.0) · MahjongCopilot (GPL-3.0) · MajsoulMax (GPL-3.0) · riichi-mahjong-tiles (CC0)',
    cancel: '취소', diagnostics: '진단 정보 내보내기', diagnosticsDesc: '로그와 버전 정보를 수집하며 계정 데이터는 포함하지 않습니다', diagnosticsBtn: '내보내기', languageValue: '한국어'
  }
}
