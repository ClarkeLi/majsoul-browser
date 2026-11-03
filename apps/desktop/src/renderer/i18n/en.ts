import type { Messages } from './zh-CN'

export const en: Messages = {
  app: { name: 'Majsoul-Browser' },
  bars: {
    summary: 'Shanten / ukeire', after: 'After discarding {{tile}}', now: 'Current hand', tenpai: 'Tenpai', n: '{{n}}-shanten', total: '{{n}} useful tiles', done: 'done',
    kind: {
      run: 'Run', triplet: 'Triplet', head: 'Pair (head)', ryanmen: 'Two-sided', kanchan: 'Closed wait', penchan: 'Edge wait', pair: 'Pair', isolated: 'Isolated'
    },
    need: { ryanmen: 'needs', kanchan: 'needs', penchan: 'needs', pair: 'pon' },
    form: { chiitoi: 'Seven pairs is closer', kokushi: 'Thirteen orphans is closer' },
    ukeire: 'Ukeire', left: '{{n}} left', safest: 'Safest', noGroups: 'Shown after your draw', round: '{{wind}}{{kyoku}}'
  },
  tips: {
    title: 'Why',
    why_closer: 'Discarding {{tile}} beats {{alt}}: you end up {{a}}, closer to winning than {{alt}} ({{b}}).',
    why_more: 'Discarding {{tile}} and {{alt}} both leave you {{a}}, but {{tile}} has more useful tiles: {{an}} vs {{bn}}.',
    close_call: '{{tile}} and {{alt}} are very close ({{a}}·{{an}} vs {{b}}·{{bn}}); the model slightly prefers {{tile}}.',
    tenpai: 'Tenpai! Waiting on {{waits}}, {{total}} left on the table. More left = easier to win.',
    furiten: 'Furiten: you discarded one of your own waits, so this hand can only win by tsumo, not ron.',
    safe_tiles: '{{opp}} is dangerous. Safest tiles in your hand: {{list}}.',
    fold: '{{opp}} is dangerous and your hand is far from winning. Consider folding; discard first: {{list}}.',
    riichi_rule: 'Riichi: declare with a closed tenpai hand; you cannot change it afterwards. +1 han and ura-dora, but costs a 1000-point stick.',
    call_rule_chi: 'Chi: only from the player on your left. It opens your hand (no riichi, -1 han) but is faster.',
    call_rule_pon: 'Pon: you can pon any discard into a triplet. Opens the hand, but yakuhai triplets give yaku.',
    call_rule_daiminkan: 'Open kan: a kan of someone else’s discard reveals an extra dora, for everyone.',
    kyuushu_rule: 'Nine terminals: with 9+ kinds of terminals/honors in your starting hand you may abort the round.',
    pass_rule: 'Pass: calling opens the hand and lowers its value; this call gives no clear gain, so stay closed.',
    win_rule: 'You can win! Confirm it and check the yaku and points.',
    k_ukeire: 'Terms: shanten = steps away from tenpai; ukeire = tiles that move your hand forward. More is better.',
    k_pushfold: 'Terms: push = keep attacking, fold = defend. Push with a good hand; fold when an opponent is dangerous and you are far.',
    safe: 'Safe', opp: '{{seat}}', and: ', ',
    why: {
      genbutsu: 'genbutsu: they discarded it', suji: 'suji: safer after riichi', half_suji: 'half suji: slightly safe', nochance: 'No Chance wall: almost never deals in',
      onechance: 'One Chance wall: fairly safe', honor: 'honor: unseen, still risky', honor_seen: 'honor: 2+ already seen', seen4: 'all 4 seen: cannot deal in', none: 'no suji: dangerous'
    }
  },
  automatch: {
    label: 'Auto match', hint: 'In auto mode: after a game, click through the result screens and press Play Again',
    desc: 'In auto mode, after each game it clicks through the results screens and queues for the room you last played. Stops and tells you if it gets stuck',
    stuck: 'Auto match could not continue; fix it by hand, then toggle Auto match to continue from the current screen',
    s: { off: 'inactive', playing: 'in game', scanning: 'reading screen', joining: 'joining', waiting: 'starting', queued: 'queued', stuck: 'stopped' }
  },
  yaku: { 0: 'Menzen tsumo', 1: 'Riichi', 2: 'Open riichi', 3: 'Ippatsu', 4: 'Chankan', 5: 'Rinshan', 6: 'Haitei', 7: 'Houtei', 8: 'Double riichi', 9: 'Double open riichi', 10: 'Nagashi mangan', 11: 'Renhou', 12: 'Pinfu', 13: 'Tanyao', 14: 'Iipeikou', 15: 'Haku', 16: 'Hatsu', 17: 'Chun', 18: 'Seat East', 19: 'Seat South', 20: 'Seat West', 21: 'Seat North', 22: 'Round East', 23: 'Round South', 24: 'Round West', 25: 'Round North', 26: 'Sanshoku', 27: 'Ittsu', 28: 'Chanta', 29: 'Honroutou', 30: 'Toitoi', 31: 'Sanankou', 32: 'Sankantsu', 33: 'Sanshoku doukou', 34: 'Chiitoitsu', 35: 'Shousangen', 36: 'Honitsu', 37: 'Junchan', 38: 'Ryanpeikou', 39: 'Chinitsu', 100: 'Kokushi', 101: 'Chuuren', 102: 'Suuankou', 103: 'Daisangen', 104: 'Shousuushii', 105: 'Ryuuiisou', 106: 'Suukantsu', 107: 'Tsuuiisou', 108: 'Chinroutou', 109: 'Daisharin', 110: 'Daichisei', 111: 'Daisuushii', 112: 'Kokushi 13-wait', 113: 'Suuankou tanki', 114: 'Junsei chuuren', 115: 'Tenhou', 116: 'Chiihou', 117: 'Renhou', 120: 'Dora', 121: 'Red dora', 122: 'Ura dora' },
  coach: {
    title: 'Coach', yourTurn: 'Your turn', statTitle: 'How often your choice matched the AI this game',
    agreeStat: 'Match {{a}}/{{n}}', practice: 'Practice', practiceOn: 'Practicing', practiceTip: 'Practice mode: the answer stays hidden until you play, then you compare with the AI',
    agreeShort: 'match', last: 'Last move', agree: 'matched the AI', youPlayed: 'You', aiPick: 'AI', aiProb: 'AI {{p}}%', riichiMark: 'riichi', loss: 'Loss {{v}}',
    think: 'Decide this move yourself. Right after you play, you will see what the AI thinks.',
    thinkHint: 'Method: count shanten, then compare ukeire, then aim for good shape at tenpai; if someone riichis, look for genbutsu and suji first. Hover your hand to see each tile\'s danger.',
    hiddenBar: 'Practicing: think first. After the reveal this shows your hand groups and ukeire.',
    reveal: 'Show answer', tenpaiNow: 'Tenpai', noRec: 'Waiting for your turn', confTitle: 'How confident the AI is',
    adviceChip: { push: 'Push: keep attacking', balance: 'Balanced', fold: 'Fold: defend' },
    waitLeft: '{{n}} winning tiles left',
    col: { cand: 'Option', ai: 'AI', after: 'Shanten', ukeire: 'Ukeire', risk: 'Risk' },
    mistakes: 'Mistakes this game', lossSum: 'Total loss {{v}}', noMistakes: 'No mistakes yet',
    opps: 'Opponents · defense', noSafe: 'No tile in your hand is safe against them',
    reason: { riichi: 'Riichi (declared turn {{n}})', riichiNoTurn: 'Riichi', melds: '{{n}} calls, probably going fast', closed: 'Closed, no riichi' },
    level: { high: 'Tenpai chance high', mid: 'Tenpai chance mid', low: 'Tenpai chance low' },
    why: { genbutsu: 'Genbutsu', suji: 'Suji (they cut {{basis}})', half_suji: 'Half suji (they cut {{basis}})', honor_seen: 'Honor, {{n}} seen' },
    whyShort: { genbutsu: 'Genbutsu', suji: 'Suji', half_suji: 'Half suji', honor_seen: '{{n}} seen' },
    basisLine: 'Basis: after discard {{sh}} · deal-in {{risk}}% · top threat {{who}} {{th}}%',
    hand: { risk: 'Deal-in {{v}}%', vs: 'mainly vs {{who}}', after: 'Cut it: {{sh}}, ukeire {{n}}', ai: 'AI picks it {{p}}%' },
    place: {
      rank: 'Place {{n}}', rankShort: 'place', up: '{{v}} behind next', down: '{{v}} ahead of next', allLast: 'All Last',
      need: 'To move up: {{tier}} ({{pts}} by tsumo or ron off others), only {{direct}} by ron off {{who}}.',
      needAny: 'Honba and riichi sticks already cover the gap: any win moves you up.',
      advice: {
        lead_safe: 'You are 1st: no deal-in means you win. Defend first, end it with a fast hand.',
        last_must_win: 'You are 4th: you must win to avoid last, value first.',
        avoid_fourth: 'Close to 4th: avoid last above all, do not deal in to those behind you.',
        chase: 'You can catch the next place: check how big a hand you need, then decide push or fold.'
      }
    },
    tier: { '1han': '1 han', '2han': '2 han', '3han': '3 han', mangan: 'mangan', haneman: 'haneman', baiman: 'baiman', sanbaiman: 'sanbaiman', yakuman: 'yakuman', impossible: 'not reachable in one win' },
    ron: 'Ron', tsumo: 'Tsumo', ifRiichi: 'If riichi', noYaku: 'No yaku: cannot ron', han: 'h', fu: 'fu ',
    level2: { mangan: 'Mangan', haneman: 'Haneman', baiman: 'Baiman', sanbaiman: 'Sanbaiman', yakuman: 'Yakuman' },
    lesson: 'Learn', prev: 'Previous', next: 'Next'
  },
  gloss: {
    shanten: { t: 'Shanten', a: 'shanten', d: 'How many steps from tenpai. 0 = tenpai; 1 = one useful draw away. First rule of discarding: keep shanten as low as possible.' },
    ukeire: { t: 'Ukeire', a: 'ukeire', d: 'Tiles that lower your shanten, counted by how many are still unseen. At equal shanten, more ukeire means faster tenpai.' },
    tenpai: { t: 'Tenpai', a: 'tenpai', d: 'One tile away from winning. At an exhaustive draw, tenpai players collect penalty points from the others.' },
    ryanmen: { t: 'Ryanmen', a: 'ryanmen|open wait', d: 'Two consecutive tiles (34) waiting on both ends (2 or 5): up to 8 tiles, the best shape.' },
    kanchan: { t: 'Kanchan', a: 'kanchan', d: 'A gap in the middle (46 waits on 5): only 4 tiles, worse than ryanmen.' },
    penchan: { t: 'Penchan', a: 'penchan', d: '12 waiting on 3, or 89 waiting on 7: only 4 tiles and hard to improve; usually broken first.' },
    head: { t: 'Pair (head)', a: 'pair|head', d: 'The pair a winning hand needs. Standard hand = 4 sets + 1 pair.' },
    taatsu: { t: 'Taatsu', a: 'taatsu', d: 'Two tiles one away from a set: ryanmen, kanchan, penchan or a pair. With too many, break the worst.' },
    isolated: { t: 'Isolated tile', a: 'isolated', d: 'A tile that connects to nothing. Cut honors and terminals first, keep middle tiles.' },
    goodshape: { t: 'Good shape', a: 'good shape|bad shape', d: 'Good shape = many winning tiles (ryanmen or multi-sided). Bad shape = kanchan, penchan, tanki. Good-shape riichi wins far more often.' },
    genbutsu: { t: 'Genbutsu', a: 'genbutsu', d: 'A tile that player already discarded. Because of furiten, it can never deal in to them. First choice on defense.' },
    suji: { t: 'Suji', a: 'suji', d: 'If they cut 4, a 1-4 or 4-7 ryanmen wait is impossible (1-4-7, 2-5-8, 3-6-9). Safer than non-suji, but kanchan and tanki still hit.' },
    kabe: { t: 'Kabe (wall)', a: 'kabe|No Chance|One Chance', d: 'If all 4 of a tile are visible, ryanmen waits using it cannot exist (No Chance). 3 visible = One Chance, fairly safe.' },
    furiten: { t: 'Furiten', a: 'furiten', d: 'A winning tile is in your own discards (or you just passed it): you can only win by tsumo, not ron.' },
    riichi: { t: 'Riichi', a: 'riichi', d: 'Declare with a closed tenpai hand and pay 1000: +1 han, chance of ippatsu and ura dora, but you can no longer change your hand or defend.' },
    ippatsu: { t: 'Ippatsu', a: 'ippatsu', d: 'Winning within one go-around after riichi with no calls in between: +1 han.' },
    pushfold: { t: 'Push / fold', a: 'push|fold', d: 'Push = keep attacking, fold = defend. Weigh your speed and value against the threat: push good hands, fold bad hands against riichi.' },
    menzen: { t: 'Closed hand', a: 'closed', d: 'A hand with no chi, pon or open kan. Only closed hands can riichi or win with menzen tsumo.' },
    yaku: { t: 'Yaku', a: 'yaku', d: 'A win needs at least 1 yaku; dora are not yaku. Many yaku disappear after calling.' },
    dora: { t: 'Dora', a: 'dora', d: 'The tile after the indicator is dora: +1 han each, but not a yaku. Red fives count too.' },
    honba: { t: 'Honba', a: 'honba', d: 'Counter added by dealer repeats and draws; each adds 300 to a win.' },
    kyotaku: { t: 'Riichi sticks', a: 'riichi sticks', d: '1000-point sticks on the table, taken by the next winner.' },
    tsumogiri: { t: 'Tsumogiri', a: 'tsumogiri', d: 'Discarding the tile just drawn. Repeated tsumogiri suggests a finished or tenpai hand.' },
    avoid4: { t: 'Avoiding 4th', a: 'avoid last|avoiding 4th', d: 'In ranked play 4th loses far more points than anything else. Reaching the top rank is mostly about rarely finishing last.' },
    allLast: { t: 'All Last', a: 'All Last', d: 'The final hand. Only final placement matters, so decide by how many points you need to move up or to stay out of 4th.' },
    placement: { t: 'Placement', a: 'placement|move up', d: 'Final placement decides rank points. Knowing the gaps to the players above and below matters more than the score of a single hand.' }
  },
  fx: {
    glyph: { tenpai: '聴', agree: '良', combo: '連', miss: '惜', riichi: '立', rankUp: '昇', rankDown: '落' },
    tenpai: 'TENPAI!', tenpaiSub: '{{n}} waits · {{left}} tiles left',
    agree: 'MATCH!', agreeSub: 'Same as the AI', combo: 'COMBO', comboSub: '{{n}} in a row matching the AI',
    miss: 'Rethink', youPlayed: 'You', aiPick: 'AI', loss: 'value gap {{v}}',
    riichi: '{{who}} RIICHI!', riichiSafe: 'Safest vs them', riichiNoSafe: 'No genbutsu or suji in hand: consider folding',
    rankUp: 'Up to #{{n}}!', rankDown: 'Down to #{{n}}',
    rankSub1: 'Protect the lead: avoid dealing in', rankSub2: 'First place is close: pick your spot', rankSub3: 'Stay out of 4th first', rankSub4: 'You need value: aim for a big hand',
    risk: 'Deal-in', danger: 'Riichi ×{{n}}', sync: 'Sync', streak: 'Streak', best: 'best {{n}}',
    track: 'Shanten', now: 'now', after: 'after', win: 'Win', tenpaiShort: 'T', race: 'Candidates', gauge: { fold: 'Fold', balance: 'Mix', push: 'Push' }
  },
  hud: {
    badge: { discard: '打', riichi: '立', call: '鳴', win: '和', kyuushu: '流', pass: '過', think: '考', idle: '待', opps: '守' },
    pickCombo: 'Pick this',
    bal: { title: 'Push/fold', sub: 'gain vs loss', net: 'Pick net', empty: 'On your turn, each candidate shows its win gain (green) and deal-in loss (red) here.', hidden: 'Practice mode: gains and losses appear after you play.' },
    title: 'In-game info layer', desc: 'Show recommendations, efficiency, danger and teaching tips right on the game screen (without covering the table, buttons or hand)',
    scale: 'Layer size', scaleDesc: 'Scales with the window; fine-tune here', small: 'S', mid: 'M', large: 'L',
    side: 'Position', sideDesc: 'Which side of the screen holds the panels', both: 'Both', left: 'Left', right: 'Right',
    teach: 'Teaching tips', teachDesc: 'Explain why a move is made and teach terms',
    reserve: 'Reserve info bars', reserveDesc: 'Keep a strip above and below the game for hand groups, ukeire, scores and safe tiles', dock: 'Bar position', dockDesc: 'How spare space is split', dockSplit: 'Split', dockBottom: 'Bottom', bars: 'Hand danger bars', barsDesc: 'Mark deal-in risk above every tile',
    practice: 'Practice mode', practiceDesc: 'Hide the AI answer until you play, then compare; tracks agreement and mistakes this game',
    toggleHint: 'Show / hide the info layer'
  },
  hero: {
    sides: '{{n}}-sided', waiting: 'Waiting for a game', conf: 'conf.', tsumogiri: 'tsumogiri', after: 'After', ukeire: '{{n}} tiles to improve', waits: 'Waits', left: '{{n}} left',
    risk: 'Deal-in {{v}}%', think: 'Think {{s}}s',
    arbSoft: 'Override · model hesitated (top {{m}}), net +{{g}}', arbHard: 'Veto · model top {{m}} risks too much, net +{{g}}', arbVeto: 'Placement skip · winning {{p}} still leaves you 4th and ends the game',
    styleDice: 'Dice · model prefers {{m}}', styleGamble: 'Gamble · {{route}}, {{n}} away · model prefers {{m}}',
    act: { pass: 'Pass', reach: 'Riichi', pon: 'Pon', chi: 'Chi', hora: 'Win' },
    route: { kokushi: 'Kokushi', suuankou: 'Suuankou', daisangen: 'Daisangen', suushi: 'Suushii', tsuuiisou: 'Tsuuiisou', chuuren: 'Chuuren' },
    eyebrow: { discard: 'DISCARD', riichi: 'RIICHI', call: 'CALL', win: 'WIN', kyuushu: 'ABORT', pass: 'NO CALL' }
  },
  shanten: { tenpai: 'Tenpai', n: '{{n}}-shanten', furiten: 'Furiten', turn: 'Turn {{n}}', seatWind: 'Seat {{w}}', leftShort: '{{n}} left', honbaShort: '{{n}} honba' },
  verdict: { push: 'Push', balance: 'Balance', fold: 'Fold', riskOf: 'Deal-in risk of this tile', threatOf: 'Highest threat on table', pushDesc: 'Reward outweighs risk: keep attacking', balanceDesc: 'Stay flexible, watch safe tiles', foldDesc: 'Opponent threat is high: consider folding' },
  cards: {
    eff: 'Candidates · Efficiency', effSub: 'Shanten and tiles after discard', hand: 'Hand · Danger', handSub: 'Longer bar = riskier', waits: 'Tenpai · Waits', waitsAfter: 'Waits after discard',
    verdict: 'Push / Fold', opps: 'Opponents · Threat', scores: 'Scores', log: 'Log', map: 'Danger map', mapSub: 'Combined deal-in',
    ic: { tips: 'T', eff: 'E', hand: 'H', waits: 'W', verdict: 'V', opps: 'O', scores: 'S', log: 'L', map: 'M', points: 'P', values: 'B', know: 'K' },
    expand: 'Expand', collapse: 'Collapse'
  },
  tier: { 0: 'Safe', 1: 'Low', 2: 'Mid', 3: 'High', 4: 'Critical' },
  eff: { shanten: 'Shanten', ukeire: 'Ukeire', total: '{{n}} tiles', tenpaiAfter: 'Tenpai', cnt: '{{n}}-shanten', noData: 'Shown after your draw' },
  scoreCard: { diff: '{{v}}', dealer: 'D', you: 'You', riichi: 'Riichi' },
  oppRow: { threat: 'Threat', closed: 'Closed', melds1: '1 meld', melds2: '2 melds', melds3: '3 melds', riichi: 'Riichi', levelHigh: 'high', levelMid: 'mid', levelLow: 'low', river: 'River' },
  topbar: { connected: 'Connected', lobby: 'Lobby', disconnected: 'Disconnected', model: '{{name}} · {{ms}}ms', modelNone: 'No model', settings: 'Settings', stop: 'Stop', stopHint: 'Emergency stop' },
  mode: { label: 'Mode', off: 'Off', assist: 'Assist', auto: 'Auto' },
  tabs: { match: 'Match', review: 'Review', stats: 'Stats', models: 'Models' },
  sidebar: { collapse: 'Collapse sidebar', expand: 'Expand sidebar', resize: 'Drag to resize sidebar' },
  status: { frames: 'Frames {{n}}', decisions: 'Decisions {{n}}', agree: 'Agreement {{v}}', dataDir: 'Data {{path}}', info: 'About' },
  round: { label: '{{wind}}{{kyoku}} · {{honba}} honba', kyotaku: 'Riichi sticks {{n}}', left: 'Wall {{n}}', dora: 'Dora', dealer: 'Dealer ▸ {{seat}}' },
  seat: { self: 'You', next: 'Right', across: 'Across', prev: 'Left' },
  wind: { E: 'East ', S: 'South ', W: 'West ', N: 'North ' },
  rec: { title: 'Recommendation', confidence: 'Confidence {{v}}%', candidates: 'Candidates', hand: 'Hand', opponents: 'Opponents', log: 'Log', recent: 'Last {{n}}', tsumogiri: 'Tsumogiri', none: '—' },
  action: { discard: 'Discard', riichi: 'Riichi', chi: 'Chi', pon: 'Pon', daiminkan: 'Kan', kakan: 'Added kan', ankan: 'Closed kan', ron: 'Ron', tsumo: 'Tsumo', kyuushu: 'Abort', kyuushuNote: 'Nine terminals', pass: 'Pass' },
  exec: { idle: 'Waiting for you', thinking: 'Thinking', scheduled: 'Acting in {{s}}s', executing: 'Acting', confirmed: 'Confirmed', paused: 'Paused: {{reason}}', failed: 'Failed: {{reason}}', assistMode: 'Assist mode', autoMode: 'Auto mode', offMode: 'Off' },
  reason: { minimized: 'Window minimized', unconfirmed: 'Click not confirmed by the game', click_failed: 'Click failed', mismatch: 'Action did not match', model_failed: 'Model failed repeatedly', manual: 'Manual action detected', desync: 'Game state out of sync', paused: 'Paused', hotkey: 'Hotkey', user: 'Stopped by you' },
  banner: { resume: 'Resume auto' },
  opp: { riichi: 'Riichi', tenpai: 'Tenpai', tenpaiNone: '—', high: 'high', mid: 'mid', low: 'low', melds: '{{n}} melds', score: '{{n}}' },
  timeline: { agree: 'Agree', differ: 'Differ', executed: 'Executed', recommended: 'Rec. {{what}}', empty: 'No decisions yet' },
  empty: {
    disconnected: { title: 'Waiting for the game', desc: 'Log in on the left to get started' },
    lobby: { title: 'In the lobby', desc: 'Recommendations appear in 4-player games' },
    sanma: { title: '3-player is not supported', desc: 'Recommendations and automation are disabled' },
    desynced: { title: 'Game state out of sync', desc: 'Recovers automatically next game', action: 'Resync' },
    noModel: { title: 'No model available', desc: 'Import a model to see recommendations', action: 'Import model' },
    modelError: { title: 'Model failed to load', desc: 'Error code {{code}}', action: 'Details' },
    coreDown: { title: 'Inference core is not running', desc: 'Trying to restart' }
  },
  dialog: { autoTitle: 'Enable automation', autoItems: ['Mouse clicks will be simulated on the game', 'Any anomaly pauses it immediately', 'There is a risk to your account'], cancel: 'Cancel', enable: 'Enable' },
  toast: { autoStopped: 'Automation stopped' },
  risk: { label: 'Danger {{n}}', hover: 'Discard this: q diff {{dq}} · danger {{risk}}' },
  tile: { suit: { m: ' man', p: ' pin', s: ' sou' }, num: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], honor: { E: 'East', S: 'South', W: 'West', N: 'North', P: 'White', F: 'Green', C: 'Red' }, red: 'Red ' },
  placeholder: { soon: 'This page is coming soon' },
  wizard: {
    title: 'Before you start',
    items: ['The app only reads page traffic; it never sends, modifies or drops data', 'Assist mode is the default: it only shows recommendations and click targets', 'Auto mode simulates mouse clicks and puts your account at risk; it must be re-enabled each launch', 'Login state and records live in the data folder and can be cleared any time'],
    start: 'Get started'
  },
  review: { title: 'Review', empty: 'No game records yet', emptyDesc: 'Finished games show up here', back: 'Back', agreeRate: 'AI agreement', decisions: 'Decisions', qLoss: 'q loss', mistakes: 'Top 5 mistakes', turns: 'Turns', yourChoice: 'You', recommended: 'Rec.', loss: 'Loss {{v}}', noMistakes: 'No notable mistakes', game: 'Game {{id}}', refresh: 'Refresh' },
  stats: { title: 'Stats', dist: 'Distribution', avgRank: 'Avg. rank', winRate: 'Win rate', dealInRate: 'Deal-in rate', agree: 'AI agreement', last20: 'Last 20 games', trend: 'Agreement trend', empty: 'Not enough data' },
  models: {
    title: 'Models', import: 'Import .pth', active: 'Active', activate: 'Use', size: '{{mb}} MB', imported: 'Imported {{date}}', device: 'Device {{d}}',
    steps: { copy: 'Copy', verify: 'Verify', load: 'Load test' }, importing: 'Importing', failed: 'Import failed: {{msg}}', pending: 'Takes effect next game', empty: 'No models imported yet', emptyDesc: 'Import a Mortal 4-player .pth file'
  },
  pts: {
    title: 'Value · Dama vs Riichi', sub: 'EV = win rate × average value',
    ron: 'Ron', tsumo: 'Tsumo', dama: 'Dama', riichi: 'Riichi', riichiDone: 'In riichi', open: 'Open', wait: 'Wait',
    noYaku: 'No yaku', winRate: 'Win rate', avg: 'Avg value', ev: 'EV', best: 'Best', warnLabel: 'Note',
    notes: {
      riichiBetter: 'Riichi adds a han (plus ippatsu and ura chances), raising the average from {{a}} to {{b}}. Others will defend and the win rate drops, but EV is still {{d}} higher.',
      damaBetter: 'Dama is already expensive enough: after riichi others defend, and the lost win rate outweighs the extra han (EV {{d}} lower).',
      yakulessDama: 'No yaku with dama, so you cannot ron; riichi is required to win.',
      close: 'Riichi is only {{d}} EV above dama, less than 10%: dama is steadier and keeps the option to fold, so dama is recommended.',
      noRiichi_no_points: 'Less than 1000 points: riichi is not allowed', noRiichi_no_draw: 'Less than one turn left in the wall: riichi is not allowed', noRiichi_four_riichi: 'The other three are in riichi; a fourth riichi aborts the round',
      onlyDama: ', so dama only.', onlyTsumo: ': no yaku with dama, closed tsumo only.',
      inRiichi: 'In riichi: tsumogiri only; the win rate already assumes others defend.', openHand: 'Open hand: no riichi option; value depends on existing yaku and dora.',
      furiten: 'Furiten: tsumo only; the win rate accounts for it.',
      stick: 'Riichi stick cost deducted: expected loss {{n}} (the 1000 is lost if you do not win).', pot: '{{n}} points of sticks on the table go to the winner and are included in EV.',
      model: 'Win-rate model: chance per draw = waits left / unseen tiles ({{u}}), about {{d}} draws left for you; also counts others discarding your wait and opponents winning first. Ura dora not included.'
    },
    warn: { zero_points: 'Riichi leaves you at 0: any ron or tsumo against you busts you', low_points: 'Only {{n}} left after riichi: dealing in or a tsumo may bust you', last_draws: 'At most {{n}} more draws after riichi, almost haitei only', chase: '{{n}} player(s) already in riichi: after chasing you cannot fold' }
  },
  bal: {
    gain: 'Win gain', loss: 'Deal-in loss', net: 'Net',
    note: 'Gain = EV (win rate × average value); loss = Σ deal-in chance × estimated opponent value (riichi 8000, dealer ×1.5).',
    notTenpai: '{{n}}-shanten: win gain is estimated from shanten, tile acceptance, draws left and opponent threat (striped green); the middle is the net.',
    notTenpaiNone: '{{n}}-shanten: no win gain estimate for this tile; the red bar is the deal-in loss only.'
  },
  vals: {
    title: 'Candidates · Gain vs Loss', sub: 'Same measure as the override', attack: 'Attack', loss: 'Loss', net: 'Net', model: 'AI top', pick: 'Played', riichi: 'Riichi',
    hint: 'Green = attack value (EV when tenpai, otherwise estimated from shanten and ukeire); red = deal-in loss (including placement in the last rounds); right = net, in points.'
  },
  know: {
    title: 'Good to know',
    k_furiten: 'Furiten: your waits ({{waits}}) include a tile you discarded, so you cannot ron, only tsumo. Consider changing the wait.',
    k_yakuless: 'Tenpai without yaku: a closed hand with no yaku can only win by tsumo with dama; riichi to be able to ron.',
    k_fold: '{{opp}} is in riichi and you are {{n}}-shanten: your win rate is usually below 10%, so fold and discard genbutsu first.',
    k_suji: 'Against {{opp}}: genbutsu is completely safe; suji only blocks two-sided waits. {{ends}}one-sided suji and non-suji 4–6 are the most dangerous.', k_suji_ends: 'Terminal suji like {{tiles}} are the safest; ',
    k_no_chance: 'No Chance: two-sided shapes for {{tiles}} are impossible, only tanki or shanpon can hit.',
    k_one_chance: 'One Chance: {{tiles}} have only one tile left for a two-sided shape, so they are relatively safe.',
    k_multi_wait: 'Multi-sided wait ({{waits}}): {{n}} tiles left. With a good wait, riichi usually has higher EV than dama.',
    k_riichi_ev: 'Riichi has {{d}} more EV than dama here (average {{a}} → {{b}}): for a good-shaped or cheap hand, the extra han pays off.',
    k_dama_ev: 'Dama has {{d}} more EV than riichi here: dama is already worth {{a}}, and riichi makes others defend.',
    k_ev_close: 'Riichi is only {{d}} EV above dama (average {{a}} → {{b}}), less than 10%: dama is steadier and keeps the option to fold.',
    k_not_max: 'Mortal did not discard {{best}} with the most ukeire ({{bn}}), but {{tile}} ({{n}}): it also weighs value, shape and safety, not just ukeire.',
    k_ukeire: 'Ukeire: tiles that advance your shanten. Compare shanten after the discard first, then the number of ukeire.'
  },
  settings: {
    title: 'Settings', general: 'General', language: 'Language', languageDesc: 'Interface language', theme: 'Theme', themeDesc: 'Dark by default', themeDark: 'Dark', themeLight: 'Light', themeSystem: 'System',
    auto: 'Automation', playStyle: 'Play style (dice · gamble · override)', playStyleDesc: 'Plays more like a person: roll between near-equal options, go for yakuman routes, and let the algorithm override clear losses. Turn off to always play the model\'s top choice: 100% agreement',
    agree: 'Expected AI agreement', agreeOn: 'About 80% when on: it only deviates when options are almost equally good, so the loss by the model\'s own values is small.', agreeOff: 'Off: every move is the model\'s top choice, 100% agreement.',
    style: {
      dice: 'Dice', diceDesc: 'Randomly pick among alternatives valued close to the top (not after riichi or when a win is available)',
      gamble: 'Gamble', gambleDesc: 'Kokushi, Suuankou, Daisangen, Suushii, Tsuuiisou, Chuuren: keep the route when close; not when leading in South 3/4',
      arb: 'Override', arbDesc: 'Override when the model hesitates and the algorithm likes another option, or the deal-in loss is clearly larger; skip a final-round win that still leaves you 4th'
    },
    delay: 'Think time', delayDesc: 'Automatic by confidence: quick when sure, longer when torn (at least 2s on a new round)', delayValue: '1.2–4.4 s', failPolicy: 'Failure policy', failPolicyDesc: 'Any anomaly pauses immediately', failPolicyValue: 'Pause on failure',
    display: 'Display', overlay: 'In-game highlight', overlayDesc: 'Mark where to click on the game screen', risk: 'Danger bars', riskDesc: 'Show deal-in danger under each tile', candidates: 'Candidates', candidatesDesc: 'Rows shown under the recommendation', tileSize: 'Tile size', tileSizeDesc: 'Maximum tile width in the hand row', sizeS: 'S', sizeM: 'M', sizeL: 'L',
    data: 'Data', openDir: 'Open folder', openDirDesc: 'App data, models and records live here', openDirBtn: 'Open', records: 'Save game records', recordsDesc: 'Used for review; can be turned off', clearLogin: 'Clear login', clearLoginDesc: 'Sign out and clear web data', clearRecords: 'Clear records', clearRecordsDesc: 'Delete all game records',
    clear: 'Clear', confirmTitle: 'Confirm', confirmLogin: 'This signs you out and clears web data.', confirmRecords: 'This deletes all game records permanently.',
    about: 'About', version: 'Version', license: 'License', licenseValue: 'GPL-3.0-or-later', thirdParty: 'Third-party notices', thirdPartyDesc: 'Mortal (AGPL-3.0) · MahjongCopilot (GPL-3.0) · MajsoulMax (GPL-3.0) · riichi-mahjong-tiles (CC0)',
    cancel: 'Cancel', diagnostics: 'Export diagnostics', diagnosticsDesc: 'Collects logs and version info; no account data', diagnosticsBtn: 'Export', languageValue: 'English'
  }
}
