export const zhCN = {
  app: { name: '雀魂浏览器' },
  bars: {
    summary: '向听 / 进张', after: '打 {{tile}} 之后', now: '现在手牌', tenpai: '听牌', n: '{{n}} 向听', total: '进张 {{n}} 张', done: '已成',
    kind: {
      run: '顺子', triplet: '刻子', head: '雀头', ryanmen: '两面', kanchan: '嵌张', penchan: '边张', pair: '对子', isolated: '孤张'
    },
    need: { ryanmen: '待', kanchan: '待', penchan: '待', pair: '碰' },
    form: { chiitoi: '七对子型更近', kokushi: '国士型更近' },
    ukeire: '进张', left: '余{{n}}', safest: '最安全', noGroups: '摸牌后显示分组', round: '{{wind}}{{kyoku}}局'
  },
  tips: {
    title: '为什么',
    why_closer: '打{{tile}}比打{{alt}}更好：打后{{a}}，比打{{alt}}的{{b}}更接近和牌。',
    why_more: '打{{tile}}和打{{alt}}同样是{{a}}，但进张更多：{{an}} 张对 {{bn}} 张，更容易前进。',
    close_call: '{{tile}}和{{alt}}差距很小（{{a}}·{{an}} 张 对 {{b}}·{{bn}} 张），模型略偏向{{tile}}。',
    tenpai: '听牌！待 {{waits}}，场上还剩 {{total}} 张。余张越多越容易和。',
    furiten: '振听：你打过自己的待牌，这手只能自摸、不能荣和。',
    safe_tiles: '{{opp}}威胁很高。你手里最安全的牌：{{list}}。',
    fold: '{{opp}}威胁很高而你离和牌还远，建议弃和，优先打：{{list}}。',
    riichi_rule: '立直：门清听牌时宣告，之后不能换牌；和牌多 1 番，还有里宝牌；要付 1000 点供托。',
    call_rule_chi: '吃：只能吃上家打出的牌。鸣牌后不再门清，不能立直、少 1 番，但速度更快。',
    call_rule_pon: '碰：任何人打出的牌都能碰成刻子。破坏门清，但役牌碰了就有役。',
    call_rule_daiminkan: '大明杠：杠别人打出的牌，会多翻宝牌，对手的宝牌也会变多。',
    kyuushu_rule: '九种九牌：起手有 9 种以上幺九牌时可以流局重来，手牌太散时才选。',
    pass_rule: '不鸣牌：鸣牌会破坏门清、降低打点；这次牌效没有明显提升，保持门清更好。',
    win_rule: '可以和牌了！点击确认，别忘了看役与点数。',
    k_ukeire: '术语：向听 = 离听牌还差几步；进张 = 摸到后能让手牌前进的牌，越多越好。',
    k_pushfold: '术语：押 = 继续进攻，引 = 防守弃和。牌型好就押，对手威胁高而你牌差就引。',
    safe: '安全', opp: '{{seat}}', and: '、',
    why: {
      genbutsu: '现物：他打过', suji: '筋：立直后较安全', half_suji: '单筋：略安全', nochance: '壁 No Chance：几乎不会放铳',
      onechance: '壁 One Chance：较安全', honor: '字牌：生牌，仍有风险', honor_seen: '字牌：已见 2 张以上', seen4: '四张全见：不会放铳', none: '无筋：危险'
    }
  },
  automatch: {
    label: '自动匹配', hint: '自动模式下：一局结束后依次点「確認」翻过结算页，再点「再來一場」继续匹配',
    desc: '自动模式下，一局结束后依次点「確認」（排名、段位分…），到知名度页点「再來一場」并在弹窗里点「確認」，在同一个场继续匹配。只在截图里确实看到按钮时才点，卡住会停下并提示',
    stuck: '自动匹配没能继续，请手动处理一下；再点一次「自动匹配」即可从当前画面接着走',
    s: { off: '未工作', playing: '对局中', scanning: '识别画面', joining: '进入场次', waiting: '等待匹配', queued: '排队中', stuck: '已停下' }
  },
  yaku: { 0: '门前清自摸和', 1: '立直', 2: '开立直', 3: '一发', 4: '抢杠', 5: '岭上开花', 6: '海底摸月', 7: '河底捞鱼', 8: '两立直', 9: '两开立直', 10: '流局满贯', 11: '人和', 12: '平和', 13: '断幺九', 14: '一杯口', 15: '役牌 白', 16: '役牌 发', 17: '役牌 中', 18: '自风 东', 19: '自风 南', 20: '自风 西', 21: '自风 北', 22: '场风 东', 23: '场风 南', 24: '场风 西', 25: '场风 北', 26: '三色同顺', 27: '一气通贯', 28: '混全带幺九', 29: '混老头', 30: '对对和', 31: '三暗刻', 32: '三杠子', 33: '三色同刻', 34: '七对子', 35: '小三元', 36: '混一色', 37: '纯全带幺九', 38: '二杯口', 39: '清一色', 100: '国士无双', 101: '九莲宝灯', 102: '四暗刻', 103: '大三元', 104: '小四喜', 105: '绿一色', 106: '四杠子', 107: '字一色', 108: '清老头', 109: '大车轮', 110: '大七星', 111: '大四喜', 112: '国士无双十三面', 113: '四暗刻单骑', 114: '纯正九莲宝灯', 115: '天和', 116: '地和', 117: '人和', 120: '宝牌', 121: '赤宝牌', 122: '里宝牌' },
  coach: {
    title: '教练', yourTurn: '轮到你了', statTitle: '本局你的选择与 AI 一致的次数',
    agreeStat: '一致 {{a}}/{{n}}', practice: '练习', practiceOn: '练习中', practiceTip: '练习模式：先隐藏答案，你出牌后立刻对比 AI 的选择',
    agreeShort: '一致', last: '上一手', agree: '与 AI 一致', youPlayed: '你打', aiPick: 'AI 选', aiProb: 'AI {{p}}%', riichiMark: '立直', loss: '损失 {{v}}',
    think: '先自己判断这一手，出牌后马上告诉你 AI 怎么看。',
    thinkHint: '思路：先数向听，再比进张，听牌后看好形；有人立直先找现物和筋。把鼠标移到手牌上可以看每张的危险度。',
    hiddenBar: '练习中：先自己想。揭晓后这里会显示打后的手牌分组与进张。',
    reveal: '看答案', tenpaiNow: '听牌中', noRec: '等待你的回合', confTitle: 'AI 对这一手的把握',
    adviceChip: { push: '押：继续进攻', balance: '攻守平衡', fold: '引：弃和' },
    waitLeft: '待牌共 {{n}} 张',
    col: { cand: '候选', ai: 'AI', after: '向听', ukeire: '进张', risk: '放铳' },
    mistakes: '本局失误', lossSum: '累计损失 {{v}}', noMistakes: '本局还没有失误',
    opps: '对手 · 防守', noSafe: '手里没有对他安全的牌',
    reason: { riichi: '立直（第 {{n}} 巡宣言）', riichiNoTurn: '立直', melds: '{{n}} 副露，可能在做快速和', closed: '门清，没有立直' },
    level: { high: '听牌可能 高', mid: '听牌可能 中', low: '听牌可能 低' },
    why: { genbutsu: '现物', suji: '筋（他打过{{basis}}）', half_suji: '单筋（他打过{{basis}}）', honor_seen: '字牌已见 {{n}} 张' },
    whyShort: { genbutsu: '现物', suji: '筋', half_suji: '单筋', honor_seen: '见 {{n}} 张' },
    basisLine: '依据：打后{{sh}} · 推荐牌放铳 {{risk}}% · 最大威胁 {{who}} {{th}}%',
    hand: { risk: '放铳 {{v}}%', vs: '主要对{{who}}', after: '打它：打后{{sh}}，进张 {{n}} 张', ai: 'AI 选它的概率 {{p}}%' },
    place: {
      rank: '第 {{n}} 位', rankShort: '位', up: '距上一名 {{v}}', down: '领先下一名 {{v}}', allLast: 'All Last',
      need: '升位需 {{tier}}（他家放铳或自摸 {{pts}} 点），直击{{who}}只需 {{direct}}。',
      needAny: '本场费和供托已经够了：任何和牌都能升位。',
      advice: {
        lead_safe: '你是第 1 位：不放铳就赢，优先防守，有机会就速和结束。',
        last_must_win: '你是第 4 位：必须和牌才能避四，打点优先。',
        avoid_fourth: '离第 4 位很近：避四第一，别给后面的人放铳。',
        chase: '可以追上一名：先看清需要多大的牌，再决定押引。'
      }
    },
    tier: { '1han': '1 番', '2han': '2 番', '3han': '3 番', mangan: '满贯', haneman: '跳满', baiman: '倍满', sanbaiman: '三倍满', yakuman: '役满', impossible: '一次和牌追不上' },
    ron: '荣', tsumo: '摸', ifRiichi: '立直后', noYaku: '无役，不能荣和', han: '番', fu: '符',
    level2: { mangan: '满贯', haneman: '跳满', baiman: '倍满', sanbaiman: '三倍满', yakuman: '役满' },
    lesson: '学', prev: '上一条', next: '下一条'
  },
  gloss: {
    shanten: { t: '向听', a: '向听', d: '离听牌还差几步。0 向听 = 听牌；1 向听 = 再进一张有效牌就听牌。打牌的第一原则是让向听数尽量小。' },
    ukeire: { t: '进张', a: '进张', d: '摸到后能让向听数减少的牌，按场上还看不见的张数计算。向听相同时，进张越多越快听牌。' },
    tenpai: { t: '听牌', a: '听牌', d: '只差一张就能和牌。流局时听牌的人从不听的人那里拿到罚符。' },
    ryanmen: { t: '两面', a: '两面', d: '两张相连的数牌（如 34）等两端（2 或 5），最多 8 张，是最好的搭子。' },
    kanchan: { t: '嵌张', a: '嵌张', d: '中间缺一张（如 46 等 5），只有 4 张，比两面差。' },
    penchan: { t: '边张', a: '边张', d: '12 等 3 或 89 等 7，只有 4 张，而且很难变成好形，通常优先拆掉。' },
    head: { t: '雀头', a: '雀头', d: '和牌需要的一对（将）。标准和牌型 = 4 组面子 + 1 个雀头。' },
    taatsu: { t: '搭子', a: '搭子', d: '差一张就成面子的两张牌：两面、嵌张、边张、对子。搭子太多时先拆差的。' },
    isolated: { t: '孤张', a: '孤张', d: '和别的牌连不上的单张。通常先打字牌和幺九孤张，留中张。' },
    goodshape: { t: '好形', a: '好形|愚形', d: '好形 = 待牌多的听牌（两面、多面）；愚形 = 嵌张、边张、单骑等只有一种待牌。好形立直胜率明显更高。' },
    genbutsu: { t: '现物', a: '现物', d: '某家自己打过的牌。因为振听规则，打他的现物绝对不会放铳给他。防守时第一选择。' },
    suji: { t: '筋', a: '筋', d: '对手打过 4，就不可能是 1-4 两面在等 1 或 7（1-4-7、2-5-8、3-6-9 为筋）。比无筋牌安全，但嵌张、单骑仍会中。' },
    kabe: { t: '壁', a: '壁|No Chance|One Chance', d: '某张牌 4 张都看得见，用它组成的两面就不存在（No Chance）。看见 3 张叫 One Chance，较安全。' },
    furiten: { t: '振听', a: '振听', d: '你的待牌在自己牌河里（或刚放过别人的），只能自摸，不能荣和。' },
    riichi: { t: '立直', a: '立直', d: '门清听牌时宣告并放 1000 点：+1 番，可能有一发和里宝牌，但之后不能换牌、无法防守。' },
    ippatsu: { t: '一发', a: '一发', d: '立直后一巡内（中间无人鸣牌）和牌，+1 番。' },
    pushfold: { t: '押引', a: '押引|弃和', d: '押 = 继续进攻，引 = 弃和防守。比较自己的速度与打点和对手的威胁：手好就押，手差又遇立直就引。' },
    menzen: { t: '门清', a: '门清', d: '没有吃、碰、明杠的手牌。只有门清才能立直和门前清自摸和。' },
    yaku: { t: '役', a: '役', d: '和牌至少要有 1 个役，宝牌不算役。鸣牌后很多役会消失，要先确认有役。' },
    dora: { t: '宝牌', a: '宝牌', d: '指示牌的下一张是宝牌，每张 +1 番，但它不是役。赤五也算宝牌。' },
    honba: { t: '本场', a: '本场', d: '连庄或流局后累计，和牌时每本场多 300 点。' },
    kyotaku: { t: '供托', a: '供托', d: '场上的立直棒，下一个和牌的人拿走，每根 1000 点。' },
    tsumogiri: { t: '摸切', a: '摸切', d: '摸到什么直接打掉。连续摸切说明对手的手牌可能已经成型或听牌。' },
    avoid4: { t: '避四', a: '避四', d: '段位战第 4 名扣分远多于其他名次，上魂天的核心是少吃四位：落后时要和，接近四位时绝不放铳。' },
    allLast: { t: 'All Last', a: 'All Last', d: '最后一局。此时只看最终名次，每一手都要按“需要几点才能升位、会不会掉到第 4”来决定。' },
    placement: { t: '顺位', a: '顺位|升位', d: '最终名次决定段位分。看清和上一名、下一名差多少，比单局打多少点更重要。' }
  },
  fx: {
    glyph: { tenpai: '聴', agree: '良', combo: '連', miss: '惜', riichi: '立', rankUp: '昇', rankDown: '落' },
    tenpai: '听牌！', tenpaiSub: '待 {{n}} 种 · 场上还剩 {{left}} 张',
    agree: '一致！', agreeSub: '和 AI 想的一样', combo: '连击', comboSub: '连续 {{n}} 手和 AI 一致',
    miss: '换个思路', youPlayed: '你打', aiPick: 'AI 打', loss: '价值差 {{v}}',
    riichi: '{{who}} 立直！', riichiSafe: '对他最安全', riichiNoSafe: '手里没有现物或筋，考虑弃和',
    rankUp: '升到 {{n}} 位！', rankDown: '掉到 {{n}} 位',
    rankSub1: '守住领先：少放铳就是赢', rankSub2: '离一位不远，看准机会', rankSub3: '先避开四位，再找机会', rankSub4: '要打点：需要能翻身的牌',
    risk: '放铳', danger: '立直 ×{{n}}', sync: '同步率', streak: '连击', best: '最高 {{n}}',
    track: '向听', now: '现在', after: '打后', win: '和', tenpaiShort: '听', race: '候选竞速', gauge: { fold: '弃', balance: '平', push: '攻' }
  },
  hud: {
    badge: { discard: '打', riichi: '立', call: '鳴', win: '和', kyuushu: '流', pass: '過', think: '考', idle: '待', opps: '守' },
    pickCombo: '选这组',
    bal: { title: '押引', sub: '收益 vs 损失', net: '推荐净值', empty: '轮到你出牌时，这里逐个候选显示和牌收益（绿）与放铳损失（红）。', hidden: '练习模式：出牌后再显示每个候选的收益与损失。' },
    title: '游戏内信息层', desc: '把推荐、牌效、危险度和教学提示直接显示在游戏画面上（不挡牌桌、按钮和手牌）',
    scale: '信息层大小', scaleDesc: '随窗口自动缩放，这里再微调', small: '小', mid: '中', large: '大',
    side: '显示位置', sideDesc: '信息栏放在画面的哪一侧', both: '两侧', left: '仅左侧', right: '仅右侧',
    teach: '教学提示', teachDesc: '解释“为什么这样打”，并讲解术语',
    reserve: '预留信息栏', reserveDesc: '在游戏画面上下各留一条，放手牌分组、进张、点数和安全牌', dock: '信息栏位置', dockDesc: '多出来的空间怎么分', dockSplit: '上下平分', dockBottom: '全放下面', bars: '手牌危险度条', barsDesc: '在每张手牌上方标出放铳风险',
    practice: '练习模式', practiceDesc: '先隐藏 AI 的答案，你出牌后再对比，并统计本局一致率与失误',
    toggleHint: '显示 / 隐藏信息层'
  },
  hero: {
    sides: '{{n}} 面', waiting: '等待对局', conf: '把握', tsumogiri: '摸切', after: '打后', ukeire: '进张 {{n}} 张', waits: '待', left: '余 {{n}}',
    risk: '放铳 {{v}}%', think: '思考 {{s}}s',
    arbSoft: '算法修正 · 模型犹豫（首选 {{m}}），净值 +{{g}}', arbHard: '算法否决 · 模型首选 {{m}} 放铳损失过大，净值 +{{g}}', arbVeto: '名次见逃 · 和了 {{p}} 点仍是末位且对局结束',
    styleDice: '掷骰 · 模型首选 {{m}}', styleGamble: '爱赌 · {{route}}差 {{n}} 张 · 模型首选 {{m}}',
    act: { pass: '过', reach: '立直', pon: '碰', chi: '吃', hora: '和牌' },
    route: { kokushi: '国士无双', suuankou: '四暗刻', daisangen: '大三元', suushi: '四喜和', tsuuiisou: '字一色', chuuren: '九莲宝灯' },
    eyebrow: { discard: '出牌建议', riichi: '立直建议', call: '鸣牌建议', win: '和牌', kyuushu: '流局', pass: '不鸣牌' }
  },
  shanten: { tenpai: '听牌', n: '{{n}} 向听', furiten: '振听', turn: '第 {{n}} 巡', seatWind: '自风 {{w}}', leftShort: '余 {{n}}', honbaShort: '{{n}} 本场' },
  verdict: { push: '进攻', balance: '平衡', fold: '弃和', riskOf: '推荐牌放铳率', threatOf: '场上最高威胁', pushDesc: '收益大于风险，继续进攻', balanceDesc: '攻守兼顾，注意安全牌', foldDesc: '对手威胁很高，建议弃和' },
  cards: {
    eff: '候选 · 牌效', effSub: '打后向听与进张', hand: '手牌 · 危险度', handSub: '条越长越危险', waits: '听牌 · 待牌', waitsAfter: '打后待牌',
    verdict: '押引判断', opps: '对手 · 威胁', scores: '点数状况', log: '记录', map: '危险度地图', mapSub: '综合放铳率',
    ic: { tips: '学', eff: '效', hand: '手', waits: '听', verdict: '判', opps: '敌', scores: '点', log: '录', map: '图', points: '值', values: '衡', know: '知' },
    expand: '展开', collapse: '收起'
  },
  tier: { 0: '安全', 1: '低', 2: '中', 3: '高', 4: '极危' },
  eff: { shanten: '向听', ukeire: '进张', total: '共 {{n}} 张', tenpaiAfter: '听牌', cnt: '{{n}}向听', noData: '摸牌后显示' },
  scoreCard: { diff: '{{v}}', dealer: '庄', you: '你', riichi: '立直' },
  oppRow: { threat: '威胁', closed: '门清', melds1: '1 副露', melds2: '2 副露', melds3: '3 副露', riichi: '立直', levelHigh: '高', levelMid: '中', levelLow: '低', river: '牌河' },
  topbar: {
    connected: '已连接', lobby: '大厅', disconnected: '未连接',
    model: '{{name}} · {{ms}}ms', modelNone: '无模型',
    settings: '设置', stop: '停止', stopHint: '急停'
  },
  mode: { label: '模式', off: '关', assist: '辅助', auto: '自动' },
  tabs: { match: '对局', review: '复盘', stats: '统计', models: '模型' },
  sidebar: { collapse: '折叠侧栏', expand: '展开侧栏', resize: '拖动调整侧栏宽度' },
  status: { frames: '帧 {{n}}', decisions: '决策 {{n}}', agree: '一致率 {{v}}', dataDir: '数据目录 {{path}}', info: '关于' },
  round: {
    label: '{{wind}}{{kyoku}}局 {{honba}}本场', kyotaku: '供托 {{n}}', left: '余牌 {{n}}', dora: '宝牌',
    dealer: '庄 ▸ {{seat}}'
  },
  seat: { self: '自家', next: '下家', across: '对家', prev: '上家' },
  wind: { E: '东', S: '南', W: '西', N: '北' },
  rec: {
    title: '推荐', confidence: '置信 {{v}}%', candidates: '候选', hand: '手牌', opponents: '对手', log: '记录',
    recent: '最近 {{n}}', tsumogiri: '摸切', none: '—'
  },
  action: {
    discard: '打', riichi: '立直', chi: '吃', pon: '碰', daiminkan: '杠', kakan: '加杠', ankan: '暗杠',
    ron: '荣和', tsumo: '自摸', kyuushu: '流局', kyuushuNote: '九种九牌', pass: '跳过'
  },
  exec: {
    idle: '等待你操作', thinking: '思考中', scheduled: '将在 {{s}}s 后执行', executing: '执行中', confirmed: '已确认',
    paused: '已暂停：{{reason}}', failed: '失败：{{reason}}', assistMode: '辅助模式', autoMode: '自动模式', offMode: '已关闭'
  },
  reason: {
    minimized: '窗口已最小化', unconfirmed: '点击未被游戏确认', click_failed: '点击失败', mismatch: '操作与预期不符',
    model_failed: '模型连续失败', manual: '检测到手动操作', desync: '牌局状态不同步', paused: '已暂停', hotkey: '快捷键', user: '手动停止'
  },
  banner: { resume: '继续自动' },
  opp: { riichi: '立直', tenpai: '听牌', tenpaiNone: '—', high: '高', mid: '中', low: '低', melds: '{{n}} 副露', score: '{{n}}' },
  timeline: { agree: '一致', differ: '不一致', executed: '已执行', recommended: '推荐 {{what}}', empty: '还没有决策记录' },
  empty: {
    disconnected: { title: '正在等待游戏连接', desc: '在左侧登录雀魂后即可开始' },
    lobby: { title: '在大厅中', desc: '进入四人对局后显示推荐' },
    sanma: { title: '暂不支持三人麻将', desc: '推荐与自动操作已停用' },
    desynced: { title: '牌局状态不同步', desc: '将在下一局自动恢复', action: '重新同步' },
    noModel: { title: '还没有可用的模型', desc: '导入模型后即可显示推荐', action: '导入模型' },
    modelError: { title: '模型加载失败', desc: '错误码 {{code}}', action: '查看详情' },
    coreDown: { title: '推理核心未运行', desc: '正在尝试重新启动' }
  },
  dialog: {
    autoTitle: '开启自动操作',
    autoItems: ['会模拟鼠标点击游戏画面', '任何异常都会立即暂停', '存在账号风险'],
    cancel: '取消', enable: '开启'
  },
  toast: { autoStopped: '自动操作已停止' },
  risk: { label: '危险度 {{n}}', hover: '打这张：q 值差 {{dq}} · 危险度 {{risk}}' },
  tile: {
    suit: { m: '万', p: '筒', s: '索' },
    num: ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
    honor: { E: '东', S: '南', W: '西', N: '北', P: '白', F: '发', C: '中' },
    red: '赤'
  },
  placeholder: { soon: '该页面将在后续版本提供' },
  wizard: {
    title: '开始之前',
    items: ['应用只读取页面流量，不会向服务器发送、修改或丢弃任何数据', '默认是辅助模式：只显示推荐和点击目标', '自动模式会模拟鼠标点击，存在账号风险；每次启动后都需要重新手动开启', '登录状态与记录都保存在数据目录，可随时清除'],
    start: '开始使用'
  },
  review: {
    title: '复盘', empty: '还没有对局记录', emptyDesc: '打完一局后会出现在这里', back: '返回', agreeRate: 'AI 一致率',
    decisions: '决策', qLoss: 'q 值损失', mistakes: '关键失误 Top 5', turns: '逐巡', yourChoice: '你的选择', recommended: '推荐',
    loss: '损失 {{v}}', noMistakes: '没有明显失误', game: '对局 {{id}}', refresh: '刷新'
  },
  stats: { title: '统计', dist: '行为分布', avgRank: '平均名次', winRate: '和了率', dealInRate: '放铳率', agree: 'AI 一致率', last20: '最近 20 局', trend: '一致率趋势', empty: '数据不足' },
  models: {
    title: '模型', import: '导入 .pth', active: '当前', activate: '使用', size: '{{mb}} MB', imported: '导入于 {{date}}', device: '设备 {{d}}',
    steps: { copy: '复制', verify: '校验', load: '加载测试' }, importing: '正在导入', failed: '导入失败：{{msg}}', pending: '将在下一局生效',
    empty: '还没有导入过模型', emptyDesc: '导入 Mortal 四麻 .pth 文件'
  },
  pts: {
    title: '打点 · 默听 vs 立直', sub: '期望值 = 和牌率 × 平均打点',
    ron: '荣和', tsumo: '自摸', dama: '默听', riichi: '立直', riichiDone: '已立直', open: '副露', wait: '待牌',
    noYaku: '无役', winRate: '和牌率', avg: '平均打点', ev: '期望值', best: '推荐', warnLabel: '注意',
    notes: {
      riichiBetter: '立直 +1 番（还有一发、里宝牌的机会）让平均打点从 {{a}} 升到 {{b}}；虽然别人会防守、和牌率降低，期望值仍多 {{d}}。',
      damaBetter: '默听已经够贵：立直后别人会防守，和牌率下降带来的损失超过了加番的收益（期望值少 {{d}}）。',
      yakulessDama: '默听无役，无法荣和；须立直才能和牌。',
      close: '立直只比默听多 {{d}} 点期望值，不到一成：默听更稳，也保留弃和的余地，所以推荐默听。',
      noRiichi_no_points: '持点不足 1000，不能立直', noRiichi_no_draw: '牌山不足一巡，不能立直', noRiichi_four_riichi: '其余三家都已立直，再立直会四家立直流局',
      onlyDama: '，只能默听。', onlyTsumo: '：默听无役，只能门清自摸。',
      inRiichi: '已立直：只能摸切，和牌率已考虑别人会防守。', openHand: '副露手：没有立直选项，打点取决于已有的役和宝牌。',
      furiten: '振听：只能自摸，和牌率已按振听计算。',
      stick: '立直棒成本已扣除：期望损失 {{n}}（没和牌时 1000 点收不回）。', pot: '场上供托 {{n}} 点归和牌者，已计入期望值。',
      model: '和牌率模型：每摸一张命中概率 = 剩余待牌 / 未见牌（{{u}}），自己还能摸约 {{d}} 次；并考虑别人打出你的待牌与对手抢和。里宝牌未计入。'
    },
    warn: { zero_points: '立直后持点归零：再被荣和或别人自摸就会被飞', low_points: '立直后只剩 {{n}} 点：放铳或被自摸很可能被飞', last_draws: '立直后最多再摸 {{n}} 次，几乎只剩海底', chase: '已有 {{n}} 家立直：追立直后不能弃和，只能硬打' }
  },
  bal: {
    gain: '和牌收益', loss: '放铳损失', net: '净',
    note: '收益 = 期望值（和牌率 × 平均打点）；损失 = Σ 对手放铳率 × 对手估计打点（立直按 8000，亲家 ×1.5）。',
    notTenpai: '{{n}} 向听：和牌收益按向听、进张、剩余巡目与对手威胁估（斜纹绿条），中间是净值。',
    notTenpaiNone: '{{n}} 向听：这张牌暂时算不出和牌收益，红条只看放铳损失。'
  },
  vals: {
    title: '候选 · 收益 vs 损失', sub: '与算法改判同一口径', attack: '进攻', loss: '损失', net: '净值', model: 'AI 首选', pick: '执行', riichi: '立直',
    hint: '绿 = 进攻价值（听牌时为期望值，否则按向听与进张估），红 = 放铳损失（终盘含掉名次），右侧是相减后的净值（点）。'
  },
  know: {
    title: '知识点',
    k_furiten: '振听：你的待牌（{{waits}}）里有自己打过的牌，不能荣和，只能自摸。可以考虑换听。',
    k_yakuless: '无役听牌：门清没役时默听只能靠自摸，荣和必须先立直。',
    k_fold: '{{opp}}立直，你还差 {{n}} 向听：此时和牌率通常低于 10%，一般应弃和，先打现物。',
    k_suji: '对{{opp}}：现物绝对安全；筋牌只防两面听，{{ends}}单筋和无筋的 4–6 最危险。', k_suji_ends: '像 {{tiles}} 这种幺九筋最安全，',
    k_no_chance: '壁（No Chance）：{{tiles}} 的两面搭子已经不可能存在，只剩单骑 / 双碰会放铳。',
    k_one_chance: 'One Chance：{{tiles}} 的两面搭子只剩一张，相对安全一些。',
    k_multi_wait: '多面听（{{waits}}）：剩余 {{n}} 张，好形听牌立直的期望值通常高于默听。',
    k_riichi_ev: '这手立直比默听期望值多 {{d}} 点（平均打点 {{a}} → {{b}}）：好形或便宜的手，立直加番更划算。',
    k_dama_ev: '这手默听比立直期望值多 {{d}} 点：默听打点已经够（{{a}}），立直后别人会防守、和牌率下降。',
    k_ev_close: '立直只比默听多 {{d}} 点期望值（平均打点 {{a}} → {{b}}），差距不到一成：默听更稳，也保留了弃和的余地。',
    k_not_max: 'Mortal 没打进张最多的 {{best}}（{{bn}} 张），而是打 {{tile}}（{{n}} 张）：它同时考虑打点、形状发展和安全度，进张数不是唯一标准。',
    k_ukeire: '进张：能让向听前进的牌。打牌时先比较打后的向听，再比较进张张数。'
  },
  settings: {
    title: '设置',
    general: '通用', language: '语言', languageDesc: '界面语言', theme: '主题', themeDesc: '默认深色',
    themeDark: '深色', themeLight: '浅色', themeSystem: '跟随系统',
    auto: '自动操作', playStyle: '打牌风格（掷骰 · 爱赌 · 算法改判）', playStyleDesc: '让出牌更像人：估值接近时掷骰、看到役满路线就赌一把、明显亏损时由算法改判。关闭后完全按模型第一名出牌，一致率为 100%',
    agree: '预计与 AI 一致率', agreeOn: '开启时约 80%：只在几个选择几乎一样好时偏离，按模型自己的估值损失很小。', agreeOff: '已关闭：每一手都按模型第一名，一致率 100%。',
    style: {
      dice: '掷骰', diceDesc: '与第一名估值差很小的备选里随机选一个（立直后、能和牌时不掷）',
      gamble: '爱赌', gambleDesc: '国士、四暗刻、大三元、四喜、字一色、九莲：路线够近就保留；南 3/南 4 领先时不赌',
      arb: '算法改判', arbDesc: '模型犹豫且算法更看好、或放铳损失明显更大时改判；终局和了仍是末位就见逃'
    },
    delay: '思考时间', delayDesc: '按把握度自动：把握高时快出，纠结时多想（新局第一打至少 2 秒）', delayValue: '1.2–4.4 秒', failPolicy: '失败策略', failPolicyDesc: '任何异常都会立即暂停', failPolicyValue: '失败即暂停',
    display: '显示', overlay: '游戏内高亮', overlayDesc: '在游戏画面上标出该点哪里', risk: '危险度条', riskDesc: '在手牌下方显示放铳危险度', candidates: '候选数量', candidatesDesc: '推荐卡下方显示的候选行数',
    tileSize: '牌面尺寸', tileSizeDesc: '手牌行的最大牌宽', sizeS: '小', sizeM: '中', sizeL: '大',
    data: '数据', openDir: '打开目录', openDirDesc: '应用数据、模型与记录都在这里', openDirBtn: '打开',
    records: '保存对局记录', recordsDesc: '用于复盘；可随时关闭', clearLogin: '清除登录状态', clearLoginDesc: '退出雀魂账号并清空网页数据', clearRecords: '清空记录', clearRecordsDesc: '删除所有对局记录',
    clear: '清除', confirmTitle: '确认清除', confirmLogin: '将退出登录并清空网页数据。', confirmRecords: '将删除所有对局记录，无法恢复。',
    about: '关于', version: '版本', license: '许可证', licenseValue: 'GPL-3.0-or-later', thirdParty: '第三方声明', thirdPartyDesc: 'Mortal（AGPL-3.0）· MahjongCopilot（GPL-3.0）· MajsoulMax（GPL-3.0）· riichi-mahjong-tiles（CC0）',
    cancel: '取消', diagnostics: '导出诊断信息', diagnosticsDesc: '收集日志与版本信息，不含账号数据', diagnosticsBtn: '导出', languageValue: '简体中文'
  }
}

export type Messages = typeof zhCN
