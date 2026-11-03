import type { Messages } from './zh-CN'

export const de: Messages = {
  app: { name: 'Majsoul-Browser' },
  bars: {
    summary: 'Shanten / Ukeire', after: 'Nach Abwurf von {{tile}}', now: 'Aktuelle Hand', tenpai: 'Tenpai', n: '{{n}}-Shanten', total: '{{n}} nützliche Steine', done: 'fertig',
    kind: {
      run: 'Sequenz', triplet: 'Drilling', head: 'Paar (Atama)', ryanmen: 'Beidseitig', kanchan: 'Kanchan', penchan: 'Penchan', pair: 'Paar', isolated: 'Einzelstein'
    },
    need: { ryanmen: 'braucht', kanchan: 'braucht', penchan: 'braucht', pair: 'Pon' },
    form: { chiitoi: 'Sieben Paare ist näher', kokushi: 'Kokushi ist näher' },
    ukeire: 'Ukeire', left: '{{n}} übrig', safest: 'Sicherster', noGroups: 'Nach deinem Zug sichtbar', round: '{{wind}}{{kyoku}}'
  },
  tips: {
    title: 'Warum',
    why_closer: '{{tile}} abzuwerfen ist besser als {{alt}}: Du bist dann {{a}}, näher am Sieg als mit {{alt}} ({{b}}).',
    why_more: 'Mit {{tile}} und {{alt}} bist du beide Male {{a}}, aber {{tile}} lässt mehr nützliche Steine zu: {{an}} gegen {{bn}}.',
    close_call: '{{tile}} und {{alt}} liegen sehr dicht beieinander ({{a}}·{{an}} gegen {{b}}·{{bn}}); das Modell bevorzugt knapp {{tile}}.',
    tenpai: 'Tenpai! Du wartest auf {{waits}}, noch {{total}} verfügbar. Je mehr übrig, desto leichter der Sieg.',
    furiten: 'Furiten: Du hast einen eigenen Wartestein abgeworfen, also kannst du nur per Tsumo gewinnen, nicht per Ron.',
    safe_tiles: '{{opp}} ist gefährlich. Sicherste Steine in deiner Hand: {{list}}.',
    fold: '{{opp}} ist gefährlich und deine Hand ist weit vom Sieg entfernt. Überlege zu folden; wirf zuerst ab: {{list}}.',
    riichi_rule: 'Riichi: Ansage mit geschlossener Tenpai-Hand; danach kannst du sie nicht mehr ändern. +1 Han und Ura-Dora, kostet aber einen 1000-Punkte-Stab.',
    call_rule_chi: 'Chii: nur vom Spieler zu deiner Linken. Öffnet die Hand (kein Riichi, -1 Han), ist aber schneller.',
    call_rule_pon: 'Pon: Jeden Abwurf kannst du zum Drilling pon\'en. Öffnet die Hand, aber Yakuhai-Drillinge geben ein Yaku.',
    call_rule_daiminkan: 'Offenes Kan: Ein Kan auf den Abwurf eines anderen deckt ein zusätzliches Dora auf, für alle.',
    kyuushu_rule: 'Neun Terminals: Mit 9+ verschiedenen Terminals/Ehrensteinen in der Starthand darfst du die Runde abbrechen.',
    pass_rule: 'Passen: Ansagen öffnet die Hand und senkt ihren Wert; diese Ansage bringt keinen klaren Vorteil, bleib also geschlossen.',
    win_rule: 'Du kannst gewinnen! Bestätige und prüfe Yaku und Punkte.',
    k_ukeire: 'Begriffe: Shanten = Schritte bis Tenpai; Ukeire = Steine, die deine Hand voranbringen. Mehr ist besser.',
    k_pushfold: 'Begriffe: Push = weiter angreifen, Fold = verteidigen. Push mit guter Hand; Fold, wenn ein Gegner gefährlich ist und du weit weg bist.',
    safe: 'Sicher', opp: '{{seat}}', and: ', ',
    why: {
      genbutsu: 'Genbutsu: wurde von ihm abgeworfen', suji: 'Suji: nach Riichi sicherer', half_suji: 'Halb-Suji: etwas sicher', nochance: 'No-Chance-Kabe: wirft fast nie ein',
      onechance: 'One-Chance-Kabe: ziemlich sicher', honor: 'Ehrenstein: ungesehen, noch riskant', honor_seen: 'Ehrenstein: 2+ schon gesehen', seen4: 'alle 4 gesehen: kann nicht einwerfen', none: 'kein Suji: gefährlich'
    }
  },
  automatch: {
    label: 'Auto-Match', hint: 'Im Auto-Modus: nach einem Spiel Ergebnisse wegklicken und Nochmal spielen drücken',
    desc: 'Im Auto-Modus klickt es nach jedem Spiel durch die Ergebnisbildschirme und reiht sich für den zuletzt gespielten Raum ein. Bleibt es hängen, stoppt es und meldet sich',
    stuck: 'Auto-Match konnte nicht weitermachen; behebe es von Hand und schalte Auto-Match dann um, um vom aktuellen Bildschirm fortzufahren',
    s: { off: 'inaktiv', playing: 'im Spiel', scanning: 'liest Bildschirm', joining: 'tritt bei', waiting: 'startet', queued: 'in Warteschlange', stuck: 'gestoppt' }
  },
  yaku: { 0: 'Menzen Tsumo', 1: 'Riichi', 2: 'Offenes Riichi', 3: 'Ippatsu', 4: 'Chankan', 5: 'Rinshan', 6: 'Haitei', 7: 'Houtei', 8: 'Doppel-Riichi', 9: 'Doppel-Offenes-Riichi', 10: 'Nagashi Mangan', 11: 'Renhou', 12: 'Pinfu', 13: 'Tanyao', 14: 'Iipeikou', 15: 'Haku', 16: 'Hatsu', 17: 'Chun', 18: 'Platzwind Ost', 19: 'Platzwind Süd', 20: 'Platzwind West', 21: 'Platzwind Nord', 22: 'Rundenwind Ost', 23: 'Rundenwind Süd', 24: 'Rundenwind West', 25: 'Rundenwind Nord', 26: 'Sanshoku', 27: 'Ittsu', 28: 'Chanta', 29: 'Honroutou', 30: 'Toitoi', 31: 'Sanankou', 32: 'Sankantsu', 33: 'Sanshoku Doukou', 34: 'Chiitoitsu', 35: 'Shousangen', 36: 'Honitsu', 37: 'Junchan', 38: 'Ryanpeikou', 39: 'Chinitsu', 100: 'Kokushi', 101: 'Chuuren', 102: 'Suuankou', 103: 'Daisangen', 104: 'Shousuushii', 105: 'Ryuuiisou', 106: 'Suukantsu', 107: 'Tsuuiisou', 108: 'Chinroutou', 109: 'Daisharin', 110: 'Daichisei', 111: 'Daisuushii', 112: 'Kokushi 13-seitig', 113: 'Suuankou Tanki', 114: 'Junsei Chuuren', 115: 'Tenhou', 116: 'Chiihou', 117: 'Renhou', 120: 'Dora', 121: 'Rotes Dora', 122: 'Ura-Dora' },
  coach: {
    title: 'Coach', yourTurn: 'Du bist dran', statTitle: 'Wie oft deine Wahl in diesem Spiel zur KI passte',
    agreeStat: 'Treffer {{a}}/{{n}}', practice: 'Übung', practiceOn: 'Übe', practiceTip: 'Übungsmodus: Die Antwort bleibt verborgen, bis du gespielt hast, dann vergleichst du mit der KI',
    agreeShort: 'Treffer', last: 'Letzter Zug', agree: 'wie die KI', youPlayed: 'Du', aiPick: 'KI', aiProb: 'KI {{p}}%', riichiMark: 'Riichi', loss: 'Verlust {{v}}',
    think: 'Entscheide diesen Zug selbst. Direkt nach deinem Zug siehst du, was die KI denkt.',
    thinkHint: 'Methode: Shanten zählen, dann Ukeire vergleichen, dann im Tenpai auf gute Form achten; bei gegnerischem Riichi zuerst Genbutsu und Suji suchen. Fahre über deine Hand, um die Gefahr jedes Steins zu sehen.',
    hiddenBar: 'Übung: Denk zuerst selbst. Nach der Auflösung siehst du hier Handgruppen und Ukeire.',
    reveal: 'Antwort zeigen', tenpaiNow: 'Tenpai', noRec: 'Warte auf deinen Zug', confTitle: 'Wie sicher sich die KI ist',
    adviceChip: { push: 'Push: weiter angreifen', balance: 'Ausgewogen', fold: 'Fold: verteidigen' },
    waitLeft: '{{n}} Gewinnsteine übrig',
    col: { cand: 'Option', ai: 'KI', after: 'Shanten', ukeire: 'Ukeire', risk: 'Risiko' },
    mistakes: 'Fehler in diesem Spiel', lossSum: 'Gesamtverlust {{v}}', noMistakes: 'Noch keine Fehler',
    opps: 'Gegner · Defensive', noSafe: 'Kein Stein in deiner Hand ist gegen sie sicher',
    reason: { riichi: 'Riichi (angesagt in Zug {{n}})', riichiNoTurn: 'Riichi', melds: '{{n}} Ansagen, wohl schnell unterwegs', closed: 'Geschlossen, kein Riichi' },
    level: { high: 'Tenpai-Chance hoch', mid: 'Tenpai-Chance mittel', low: 'Tenpai-Chance niedrig' },
    why: { genbutsu: 'Genbutsu', suji: 'Suji (er warf {{basis}} ab)', half_suji: 'Halb-Suji (er warf {{basis}} ab)', honor_seen: 'Ehrenstein, {{n}} gesehen' },
    whyShort: { genbutsu: 'Genbutsu', suji: 'Suji', half_suji: 'Halb-Suji', honor_seen: '{{n}} gesehen' },
    basisLine: 'Grundlage: nach Abwurf {{sh}} · Deal-in {{risk}}% · größte Gefahr {{who}} {{th}}%',
    hand: { risk: 'Deal-in {{v}}%', vs: 'vor allem gegen {{who}}', after: 'Abwerfen: {{sh}}, Ukeire {{n}}', ai: 'KI wählt es zu {{p}}%' },
    place: {
      rank: 'Platz {{n}}', rankShort: 'Platz', up: '{{v}} hinter dem Nächsten', down: '{{v}} vor dem Nächsten', allLast: 'All Last',
      need: 'Zum Aufstieg: {{tier}} ({{pts}} per Tsumo oder Ron von anderen), per Ron von {{who}} nur {{direct}}.',
      needAny: 'Honba und Riichi-Stäbchen decken die Lücke schon: Jeder Sieg bringt dich nach oben.',
      advice: {
        lead_safe: 'Du bist 1.: Ohne Deal-in gewinnst du. Zuerst verteidigen, mit schneller Hand beenden.',
        last_must_win: 'Du bist 4.: Du musst gewinnen, um nicht Letzter zu werden, Wert zuerst.',
        avoid_fourth: 'Nah am 4. Platz: Vermeide vor allem den letzten Platz, wirf nicht an die Hinteren ein.',
        chase: 'Du kannst den nächsten Platz einholen: Prüfe, wie große Hand du brauchst, und entscheide dann Push oder Fold.'
      }
    },
    tier: { '1han': '1 Han', '2han': '2 Han', '3han': '3 Han', mangan: 'Mangan', haneman: 'Haneman', baiman: 'Baiman', sanbaiman: 'Sanbaiman', yakuman: 'Yakuman', impossible: 'mit einem Sieg nicht erreichbar' },
    ron: 'Ron', tsumo: 'Tsumo', ifRiichi: 'Mit Riichi', noYaku: 'Kein Yaku: kein Ron', han: 'H', fu: 'Fu ',
    level2: { mangan: 'Mangan', haneman: 'Haneman', baiman: 'Baiman', sanbaiman: 'Sanbaiman', yakuman: 'Yakuman' },
    lesson: 'Lernen', prev: 'Zurück', next: 'Weiter'
  },
  gloss: {
    shanten: { t: 'Shanten', a: 'Shanten', d: 'Wie viele Schritte bis Tenpai. 0 = Tenpai; 1 = ein nützlicher Zug entfernt. Erste Abwurfregel: Shanten so niedrig wie möglich halten.' },
    ukeire: { t: 'Ukeire', a: 'Ukeire', d: 'Steine, die dein Shanten senken, gezählt nach noch ungesehenen Exemplaren. Bei gleichem Shanten bedeutet mehr Ukeire schnelleres Tenpai.' },
    tenpai: { t: 'Tenpai', a: 'Tenpai', d: 'Ein Stein vom Sieg entfernt. Bei einem Remis zahlen die anderen Tenpai-Spielern Strafpunkte.' },
    ryanmen: { t: 'Ryanmen', a: 'Ryanmen|beidseitiges Warten', d: 'Zwei aufeinanderfolgende Steine (34) warten auf beide Enden (2 oder 5): bis zu 8 Steine, die beste Form.' },
    kanchan: { t: 'Kanchan', a: 'Kanchan', d: 'Lücke in der Mitte (46 wartet auf 5): nur 4 Steine, schlechter als Ryanmen.' },
    penchan: { t: 'Penchan', a: 'Penchan', d: '12 wartet auf 3, oder 89 wartet auf 7: nur 4 Steine und schwer zu verbessern; wird meist zuerst aufgelöst.' },
    head: { t: 'Paar (Atama)', a: 'Paar|Atama', d: 'Das Paar, das eine Gewinnhand braucht. Standardhand = 4 Sets + 1 Paar.' },
    taatsu: { t: 'Taatsu', a: 'Taatsu', d: 'Zwei Steine, ein Stein von einem Set entfernt: Ryanmen, Kanchan, Penchan oder ein Paar. Bei zu vielen das schlechteste auflösen.' },
    isolated: { t: 'Einzelstein', a: 'Einzelstein', d: 'Ein Stein, der mit nichts verbunden ist. Ehrensteine und Terminals zuerst abwerfen, mittlere Steine behalten.' },
    goodshape: { t: 'Gute Form', a: 'gute Form|schlechte Form', d: 'Gute Form = viele Gewinnsteine (Ryanmen oder mehrseitig). Schlechte Form = Kanchan, Penchan, Tanki. Riichi mit guter Form gewinnt deutlich öfter.' },
    genbutsu: { t: 'Genbutsu', a: 'Genbutsu', d: 'Ein Stein, den dieser Spieler schon abgeworfen hat. Wegen Furiten kann er bei ihm nie einwerfen. Erste Wahl in der Defensive.' },
    suji: { t: 'Suji', a: 'Suji', d: 'Hat er die 4 abgeworfen, ist ein Ryanmen-Warten 1-4 oder 4-7 unmöglich (1-4-7, 2-5-8, 3-6-9). Sicherer als Nicht-Suji, aber Kanchan und Tanki treffen weiterhin.' },
    kabe: { t: 'Kabe (Wand)', a: 'Kabe|No Chance|One Chance', d: 'Sind alle 4 eines Steins sichtbar, kann es kein Ryanmen-Warten mit ihm geben (No Chance). 3 sichtbar = One Chance, ziemlich sicher.' },
    furiten: { t: 'Furiten', a: 'Furiten', d: 'Ein Gewinnstein liegt in deinen eigenen Abwürfen (oder du hast ihn gerade durchgelassen): Du kannst nur per Tsumo gewinnen, nicht per Ron.' },
    riichi: { t: 'Riichi', a: 'Riichi', d: 'Ansage mit geschlossener Tenpai-Hand gegen 1000 Punkte: +1 Han, Chance auf Ippatsu und Ura-Dora, aber du kannst Hand und Defensive nicht mehr ändern.' },
    ippatsu: { t: 'Ippatsu', a: 'Ippatsu', d: 'Sieg innerhalb einer Runde nach Riichi ohne Ansagen dazwischen: +1 Han.' },
    pushfold: { t: 'Push / Fold', a: 'Push|Fold', d: 'Push = weiter angreifen, Fold = verteidigen. Wäge Tempo und Wert gegen die Gefahr ab: gute Hände pushen, schlechte gegen Riichi folden.' },
    menzen: { t: 'Geschlossene Hand', a: 'geschlossen', d: 'Eine Hand ohne Chii, Pon oder offenes Kan. Nur geschlossene Hände können Riichi ansagen oder per Menzen Tsumo gewinnen.' },
    yaku: { t: 'Yaku', a: 'Yaku', d: 'Ein Sieg braucht mindestens 1 Yaku; Dora sind keine Yaku. Viele Yaku entfallen nach Ansagen.' },
    dora: { t: 'Dora', a: 'Dora', d: 'Der Stein nach dem Indikator ist Dora: je +1 Han, aber kein Yaku. Rote Fünfen zählen auch.' },
    honba: { t: 'Honba', a: 'Honba', d: 'Zähler, der bei Dealer-Wiederholungen und Remis steigt; jeder erhöht einen Sieg um 300.' },
    kyotaku: { t: 'Riichi-Stäbchen', a: 'Riichi-Stäbchen', d: '1000-Punkte-Stäbchen auf dem Tisch, die der nächste Gewinner bekommt.' },
    tsumogiri: { t: 'Tsumogiri', a: 'Tsumogiri', d: 'Den gerade gezogenen Stein abwerfen. Wiederholtes Tsumogiri deutet auf eine fertige oder Tenpai-Hand hin.' },
    avoid4: { t: '4. Platz vermeiden', a: 'Letzten vermeiden|4. Platz vermeiden', d: 'Im Ranglistenspiel verliert der 4. Platz weit mehr Punkte als alles andere. Der höchste Rang hängt vor allem davon ab, selten Letzter zu werden.' },
    allLast: { t: 'All Last', a: 'All Last', d: 'Die letzte Hand. Nur die Endplatzierung zählt, entscheide also danach, wie viele Punkte du zum Aufstieg oder zum Vermeiden des 4. Platzes brauchst.' },
    placement: { t: 'Platzierung', a: 'Platzierung|aufsteigen', d: 'Die Endplatzierung bestimmt die Rangpunkte. Die Abstände zu den Spielern über und unter dir zählen mehr als die Punkte einer einzelnen Hand.' }
  },
  fx: {
    glyph: { tenpai: '聴', agree: '良', combo: '連', miss: '惜', riichi: '立', rankUp: '昇', rankDown: '落' },
    tenpai: 'TENPAI!', tenpaiSub: '{{n}} Waits · {{left}} Steine übrig',
    agree: 'TREFFER!', agreeSub: 'Wie die KI', combo: 'COMBO', comboSub: '{{n}} in Folge wie die KI',
    miss: 'Neu denken', youPlayed: 'Du', aiPick: 'KI', loss: 'Wertlücke {{v}}',
    riichi: '{{who}} RIICHI!', riichiSafe: 'Am sichersten gegen ihn', riichiNoSafe: 'Kein Genbutsu oder Suji auf der Hand: Fold erwägen',
    rankUp: 'Auf Platz {{n}}!', rankDown: 'Ab auf Platz {{n}}',
    rankSub1: 'Führung sichern: nicht einwerfen', rankSub2: 'Platz 1 ist nah: such den richtigen Moment', rankSub3: 'Zuerst den 4. Platz vermeiden', rankSub4: 'Du brauchst Wert: strebe eine große Hand an',
    risk: 'Deal-in', danger: 'Riichi ×{{n}}', sync: 'Sync', streak: 'Serie', best: 'Best {{n}}',
    track: 'Shanten', now: 'jetzt', after: 'danach', win: 'Sieg', tenpaiShort: 'T', race: 'Kandidaten', gauge: { fold: 'Fold', balance: 'Mix', push: 'Push' }
  },
  hud: {
    badge: { discard: '打', riichi: '立', call: '鳴', win: '和', kyuushu: '流', pass: '過', think: '考', idle: '待', opps: '守' },
    pickCombo: 'Diesen wählen',
    bal: { title: 'Push/Fold', sub: 'Gewinn vs Verlust', net: 'Netto', empty: 'In deinem Zug zeigt hier jeder Kandidat seinen Siegesgewinn (grün) und Deal-in-Verlust (rot).', hidden: 'Übungsmodus: Gewinne und Verluste erscheinen nach deinem Zug.' },
    title: 'Infoebene im Spiel', desc: 'Zeige Empfehlungen, Effizienz, Gefahr und Lerntipps direkt auf dem Spielbildschirm (ohne Tisch, Buttons oder Hand zu verdecken)',
    scale: 'Ebenengröße', scaleDesc: 'Skaliert mit dem Fenster; hier feinjustieren', small: 'S', mid: 'M', large: 'L',
    side: 'Position', sideDesc: 'Auf welcher Seite des Bildschirms die Panels sind', both: 'Beide', left: 'Links', right: 'Rechts',
    teach: 'Lerntipps', teachDesc: 'Erklärt, warum ein Zug gespielt wird, und lehrt Begriffe',
    reserve: 'Infoleisten reservieren', reserveDesc: 'Lässt über und unter dem Spiel einen Streifen frei für Handgruppen, Ukeire, Punkte und sichere Steine', dock: 'Leistenposition', dockDesc: 'Wie der freie Platz aufgeteilt wird', dockSplit: 'Geteilt', dockBottom: 'Unten', bars: 'Handgefahr-Balken', barsDesc: 'Markiert das Deal-in-Risiko über jedem Stein',
    practice: 'Übungsmodus', practiceDesc: 'Verbirgt die KI-Antwort, bis du gespielt hast, dann Vergleich; erfasst Treffer und Fehler in diesem Spiel',
    toggleHint: 'Infoebene ein-/ausblenden'
  },
  hero: {
    sides: '{{n}}-seitig', waiting: 'Warte auf ein Spiel', conf: 'Konf.', tsumogiri: 'Tsumogiri', after: 'Danach', ukeire: '{{n}} Steine zur Verbesserung', waits: 'Waits', left: '{{n}} übrig',
    risk: 'Deal-in {{v}}%', think: 'Denkt {{s}}s',
    arbSoft: 'Override · Modell zögerte (Top {{m}}), netto +{{g}}', arbHard: 'Veto · Modell-Top {{m}} riskiert zu viel, netto +{{g}}', arbVeto: 'Platzierungs-Skip · Sieg mit {{p}} lässt dich trotzdem 4. und beendet das Spiel',
    styleDice: 'Würfel · Modell bevorzugt {{m}}', styleGamble: 'Gamble · {{route}}, {{n}} entfernt · Modell bevorzugt {{m}}',
    act: { pass: 'Passen', reach: 'Riichi', pon: 'Pon', chi: 'Chii', hora: 'Sieg' },
    route: { kokushi: 'Kokushi', suuankou: 'Suuankou', daisangen: 'Daisangen', suushi: 'Suushii', tsuuiisou: 'Tsuuiisou', chuuren: 'Chuuren' },
    eyebrow: { discard: 'ABWURF', riichi: 'RIICHI', call: 'ANSAGE', win: 'SIEG', kyuushu: 'ABBRUCH', pass: 'KEINE ANSAGE' }
  },
  shanten: { tenpai: 'Tenpai', n: '{{n}}-Shanten', furiten: 'Furiten', turn: 'Zug {{n}}', seatWind: 'Platz {{w}}', leftShort: '{{n}} übrig', honbaShort: '{{n}} Honba' },
  verdict: { push: 'Push', balance: 'Balance', fold: 'Fold', riskOf: 'Deal-in-Risiko dieses Steins', threatOf: 'Größte Gefahr am Tisch', pushDesc: 'Ertrag überwiegt Risiko: weiter angreifen', balanceDesc: 'Flexibel bleiben, sichere Steine im Blick', foldDesc: 'Gegnerische Gefahr hoch: Fold erwägen' },
  cards: {
    eff: 'Kandidaten · Effizienz', effSub: 'Shanten und Steine nach Abwurf', hand: 'Hand · Gefahr', handSub: 'Längerer Balken = riskanter', waits: 'Tenpai · Waits', waitsAfter: 'Waits nach Abwurf',
    verdict: 'Push / Fold', opps: 'Gegner · Gefahr', scores: 'Punkte', log: 'Log', map: 'Gefahrenkarte', mapSub: 'Gesamt-Deal-in',
    ic: { tips: 'L', eff: 'E', hand: 'H', waits: 'T', verdict: 'U', opps: 'G', scores: 'P', log: 'V', map: 'K', points: 'W', values: 'B', know: 'I' },
    expand: 'Ausklappen', collapse: 'Einklappen'
  },
  tier: { 0: 'Sicher', 1: 'Niedrig', 2: 'Mittel', 3: 'Hoch', 4: 'Kritisch' },
  eff: { shanten: 'Shanten', ukeire: 'Ukeire', total: '{{n}} Steine', tenpaiAfter: 'Tenpai', cnt: '{{n}}-Shanten', noData: 'Nach deinem Zug sichtbar' },
  scoreCard: { diff: '{{v}}', dealer: 'D', you: 'Du', riichi: 'Riichi' },
  oppRow: { threat: 'Gefahr', closed: 'Geschlossen', melds1: '1 Meld', melds2: '2 Melds', melds3: '3 Melds', riichi: 'Riichi', levelHigh: 'hoch', levelMid: 'mittel', levelLow: 'niedrig', river: 'Fluss' },
  topbar: { connected: 'Verbunden', lobby: 'Lobby', disconnected: 'Getrennt', model: '{{name}} · {{ms}}ms', modelNone: 'Kein Modell', settings: 'Einstellungen', stop: 'Stopp', stopHint: 'Notstopp' },
  mode: { label: 'Modus', off: 'Aus', assist: 'Assist', auto: 'Auto' },
  tabs: { match: 'Spiel', review: 'Review', stats: 'Statistik', models: 'Modelle' },
  sidebar: { collapse: 'Seitenleiste einklappen', expand: 'Seitenleiste ausklappen', resize: 'Ziehen, um die Seitenleiste zu skalieren' },
  status: { frames: 'Frames {{n}}', decisions: 'Entscheidungen {{n}}', agree: 'Treffer {{v}}', dataDir: 'Daten {{path}}', info: 'Info' },
  round: { label: '{{wind}}{{kyoku}} · {{honba}} Honba', kyotaku: 'Riichi-Stäbchen {{n}}', left: 'Mauer {{n}}', dora: 'Dora', dealer: 'Dealer ▸ {{seat}}' },
  seat: { self: 'Du', next: 'Rechts', across: 'Gegenüber', prev: 'Links' },
  wind: { E: 'Ost ', S: 'Süd ', W: 'West ', N: 'Nord ' },
  rec: { title: 'Empfehlung', confidence: 'Sicherheit {{v}}%', candidates: 'Kandidaten', hand: 'Hand', opponents: 'Gegner', log: 'Log', recent: 'Letzte {{n}}', tsumogiri: 'Tsumogiri', none: '—' },
  action: { discard: 'Abwerfen', riichi: 'Riichi', chi: 'Chii', pon: 'Pon', daiminkan: 'Kan', kakan: 'Shouminkan', ankan: 'Ankan', ron: 'Ron', tsumo: 'Tsumo', kyuushu: 'Abbruch', kyuushuNote: 'Neun Terminals', pass: 'Passen' },
  exec: { idle: 'Warte auf dich', thinking: 'Denkt', scheduled: 'Aktion in {{s}}s', executing: 'Führt aus', confirmed: 'Bestätigt', paused: 'Pausiert: {{reason}}', failed: 'Fehlgeschlagen: {{reason}}', assistMode: 'Assist-Modus', autoMode: 'Auto-Modus', offMode: 'Aus' },
  reason: { minimized: 'Fenster minimiert', unconfirmed: 'Klick vom Spiel nicht bestätigt', click_failed: 'Klick fehlgeschlagen', mismatch: 'Aktion passte nicht', model_failed: 'Modell wiederholt fehlgeschlagen', manual: 'Manuelle Aktion erkannt', desync: 'Spielstatus nicht synchron', paused: 'Pausiert', hotkey: 'Hotkey', user: 'Von dir gestoppt' },
  banner: { resume: 'Auto fortsetzen' },
  opp: { riichi: 'Riichi', tenpai: 'Tenpai', tenpaiNone: '—', high: 'hoch', mid: 'mittel', low: 'niedrig', melds: '{{n}} Melds', score: '{{n}}' },
  timeline: { agree: 'Gleich', differ: 'Anders', executed: 'Ausgeführt', recommended: 'Empf. {{what}}', empty: 'Noch keine Entscheidungen' },
  empty: {
    disconnected: { title: 'Warte auf das Spiel', desc: 'Melde dich links an, um zu starten' },
    lobby: { title: 'In der Lobby', desc: 'Empfehlungen erscheinen in 4-Spieler-Partien' },
    sanma: { title: '3-Spieler wird nicht unterstützt', desc: 'Empfehlungen und Automatik sind deaktiviert' },
    desynced: { title: 'Spielstatus nicht synchron', desc: 'Erholt sich im nächsten Spiel automatisch', action: 'Neu syncen' },
    noModel: { title: 'Kein Modell verfügbar', desc: 'Importiere ein Modell, um Empfehlungen zu sehen', action: 'Modell importieren' },
    modelError: { title: 'Modell konnte nicht geladen werden', desc: 'Fehlercode {{code}}', action: 'Details' },
    coreDown: { title: 'Inferenzkern läuft nicht', desc: 'Versuche Neustart' }
  },
  dialog: { autoTitle: 'Automatik aktivieren', autoItems: ['Mausklicks werden im Spiel simuliert', 'Jede Auffälligkeit pausiert sofort', 'Es besteht ein Risiko für dein Konto'], cancel: 'Abbrechen', enable: 'Aktivieren' },
  toast: { autoStopped: 'Automatik gestoppt' },
  risk: { label: 'Gefahr {{n}}', hover: 'Diesen abwerfen: q-Diff {{dq}} · Gefahr {{risk}}' },
  tile: { suit: { m: ' Man', p: ' Pin', s: ' Sou' }, num: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], honor: { E: 'Ost', S: 'Süd', W: 'West', N: 'Nord', P: 'Weiß', F: 'Grün', C: 'Rot' }, red: 'Rote ' },
  placeholder: { soon: 'Diese Seite kommt bald' },
  wizard: {
    title: 'Bevor du startest',
    items: ['Die App liest nur den Seitenverkehr; sie sendet, ändert oder verwirft nie Daten', 'Assist-Modus ist Standard: Er zeigt nur Empfehlungen und Klickziele', 'Der Auto-Modus simuliert Mausklicks und gefährdet dein Konto; er muss bei jedem Start neu aktiviert werden', 'Login-Status und Aufzeichnungen liegen im Datenordner und können jederzeit gelöscht werden'],
    start: 'Los geht\'s'
  },
  review: { title: 'Review', empty: 'Noch keine Spielaufzeichnungen', emptyDesc: 'Beendete Spiele erscheinen hier', back: 'Zurück', agreeRate: 'KI-Treffer', decisions: 'Entscheidungen', qLoss: 'q-Verlust', mistakes: 'Top 5 Fehler', turns: 'Züge', yourChoice: 'Du', recommended: 'Empf.', loss: 'Verlust {{v}}', noMistakes: 'Keine nennenswerten Fehler', game: 'Spiel {{id}}', refresh: 'Aktualisieren' },
  stats: { title: 'Statistik', dist: 'Verteilung', avgRank: 'Ø Platz', winRate: 'Siegquote', dealInRate: 'Deal-in-Quote', agree: 'KI-Treffer', last20: 'Letzte 20 Spiele', trend: 'Trefferverlauf', empty: 'Zu wenig Daten' },
  models: {
    title: 'Modelle', import: '.pth importieren', active: 'Aktiv', activate: 'Nutzen', size: '{{mb}} MB', imported: 'Importiert {{date}}', device: 'Gerät {{d}}',
    steps: { copy: 'Kopieren', verify: 'Prüfen', load: 'Ladetest' }, importing: 'Importiere', failed: 'Import fehlgeschlagen: {{msg}}', pending: 'Gilt ab dem nächsten Spiel', empty: 'Noch keine Modelle importiert', emptyDesc: 'Importiere eine Mortal-4-Spieler-.pth-Datei'
  },
  pts: {
    title: 'Wert · Dama vs Riichi', sub: 'EV = Siegquote × Ø Wert',
    ron: 'Ron', tsumo: 'Tsumo', dama: 'Dama', riichi: 'Riichi', riichiDone: 'Im Riichi', open: 'Offen', wait: 'Wait',
    noYaku: 'Kein Yaku', winRate: 'Siegquote', avg: 'Ø Wert', ev: 'EV', best: 'Beste', warnLabel: 'Hinweis',
    notes: {
      riichiBetter: 'Riichi bringt ein Han (plus Ippatsu- und Ura-Chancen) und hebt den Durchschnitt von {{a}} auf {{b}}. Die anderen verteidigen und die Siegquote sinkt, aber der EV ist trotzdem {{d}} höher.',
      damaBetter: 'Dama ist schon teuer genug: Nach Riichi verteidigen die anderen, und die verlorene Siegquote wiegt mehr als das zusätzliche Han (EV {{d}} niedriger).',
      yakulessDama: 'Kein Yaku mit Dama, also kein Ron; Riichi ist nötig, um zu gewinnen.',
      close: 'Riichi liegt nur {{d}} EV über Dama, unter 10%: Dama ist stabiler und lässt die Option zum Folden, daher wird Dama empfohlen.',
      noRiichi_no_points: 'Weniger als 1000 Punkte: Riichi nicht erlaubt', noRiichi_no_draw: 'Weniger als ein Zug in der Mauer: Riichi nicht erlaubt', noRiichi_four_riichi: 'Die anderen drei sind im Riichi; ein viertes Riichi bricht die Runde ab',
      onlyDama: ', also nur Dama.', onlyTsumo: ': kein Yaku mit Dama, nur geschlossenes Tsumo.',
      inRiichi: 'Im Riichi: nur Tsumogiri; die Siegquote geht bereits davon aus, dass die anderen verteidigen.', openHand: 'Offene Hand: keine Riichi-Option; der Wert hängt von vorhandenen Yaku und Dora ab.',
      furiten: 'Furiten: nur Tsumo; die Siegquote berücksichtigt das.',
      stick: 'Kosten des Riichi-Stabs abgezogen: erwarteter Verlust {{n}} (die 1000 sind weg, wenn du nicht gewinnst).', pot: '{{n}} Punkte an Stäbchen auf dem Tisch gehen an den Gewinner und sind im EV enthalten.',
      model: 'Siegquoten-Modell: Chance pro Zug = übrige Waits / ungesehene Steine ({{u}}), etwa {{d}} Züge bleiben dir; zählt auch Abwürfe anderer auf deinen Wait und Gegner, die zuerst gewinnen. Ura-Dora nicht enthalten.'
    },
    warn: { zero_points: 'Riichi lässt dich bei 0: Jedes Ron oder Tsumo gegen dich schickt dich pleite', low_points: 'Nach Riichi nur noch {{n}}: Deal-in oder Tsumo kann dich pleite schicken', last_draws: 'Nach Riichi höchstens noch {{n}} Züge, fast nur Haitei', chase: '{{n}} Spieler schon im Riichi: Nach dem Nachziehen kannst du nicht mehr folden' }
  },
  bal: {
    gain: 'Siegesgewinn', loss: 'Deal-in-Verlust', net: 'Netto',
    note: 'Gewinn = EV (Siegquote × Ø Wert); Verlust = Σ Deal-in-Chance × geschätzter Gegnerwert (Riichi 8000, Dealer ×1,5).',
    notTenpai: '{{n}}-Shanten: Der Siegesgewinn wird aus Shanten, Steinannahme, übrigen Zügen und Gegnergefahr geschätzt (grün gestreift); die Mitte ist das Netto.',
    notTenpaiNone: '{{n}}-Shanten: keine Gewinnschätzung für diesen Stein; der rote Balken ist nur der Deal-in-Verlust.'
  },
  vals: {
    title: 'Kandidaten · Gewinn vs Verlust', sub: 'Gleiches Maß wie beim Override', attack: 'Angriff', loss: 'Verlust', net: 'Netto', model: 'KI-Top', pick: 'Gespielt', riichi: 'Riichi',
    hint: 'Grün = Angriffswert (EV im Tenpai, sonst aus Shanten und Ukeire geschätzt); rot = Deal-in-Verlust (inkl. Platzierung in den letzten Runden); rechts = Netto, in Punkten.'
  },
  know: {
    title: 'Gut zu wissen',
    k_furiten: 'Furiten: Deine Waits ({{waits}}) enthalten einen Stein, den du abgeworfen hast, also kein Ron, nur Tsumo. Überlege, den Wait zu ändern.',
    k_yakuless: 'Tenpai ohne Yaku: Eine geschlossene Hand ohne Yaku gewinnt als Dama nur per Tsumo; sag Riichi an, um Ron zu können.',
    k_fold: '{{opp}} ist im Riichi und du bist {{n}}-Shanten: Deine Siegquote liegt meist unter 10%, also folde und wirf zuerst Genbutsu ab.',
    k_suji: 'Gegen {{opp}}: Genbutsu ist völlig sicher; Suji blockt nur beidseitige Waits. {{ends}}Einseitiges Suji und Nicht-Suji 4–6 sind am gefährlichsten.', k_suji_ends: 'Terminal-Suji wie {{tiles}} sind am sichersten; ',
    k_no_chance: 'No Chance: Beidseitige Formen für {{tiles}} sind unmöglich, nur Tanki oder Shanpon können treffen.',
    k_one_chance: 'One Chance: Für {{tiles}} ist nur noch ein Stein für eine beidseitige Form übrig, daher relativ sicher.',
    k_multi_wait: 'Mehrseitiger Wait ({{waits}}): {{n}} Steine übrig. Mit gutem Wait hat Riichi meist höheren EV als Dama.',
    k_riichi_ev: 'Riichi hat hier {{d}} mehr EV als Dama (Ø {{a}} → {{b}}): Bei guter Form oder billiger Hand lohnt sich das zusätzliche Han.',
    k_dama_ev: 'Dama hat hier {{d}} mehr EV als Riichi: Dama ist schon {{a}} wert, und Riichi lässt die anderen verteidigen.',
    k_ev_close: 'Riichi liegt nur {{d}} EV über Dama (Ø {{a}} → {{b}}), unter 10%: Dama ist stabiler und lässt die Option zum Folden.',
    k_not_max: 'Mortal warf nicht {{best}} mit dem meisten Ukeire ({{bn}}) ab, sondern {{tile}} ({{n}}): Es wägt auch Wert, Form und Sicherheit ab, nicht nur Ukeire.',
    k_ukeire: 'Ukeire: Steine, die dein Shanten voranbringen. Vergleiche zuerst das Shanten nach dem Abwurf, dann die Anzahl der Ukeire.'
  },
  settings: {
    title: 'Einstellungen', general: 'Allgemein', language: 'Sprache', languageDesc: 'Sprache der Oberfläche', theme: 'Design', themeDesc: 'Standardmäßig dunkel', themeDark: 'Dunkel', themeLight: 'Hell', themeSystem: 'System',
    auto: 'Automatik', playStyle: 'Spielstil (Würfel · Gamble · Override)', playStyleDesc: 'Spielt menschlicher: würfelt zwischen fast gleichwertigen Optionen, verfolgt Yakuman-Routen und lässt den Algorithmus klare Verluste überstimmen. Ausschalten, um immer die Top-Wahl des Modells zu spielen: 100% Treffer',
    agree: 'Erwarteter KI-Treffer', agreeOn: 'Etwa 80% bei Ein: Es weicht nur ab, wenn Optionen fast gleich gut sind, der Verlust nach den eigenen Werten des Modells ist also klein.', agreeOff: 'Aus: Jeder Zug ist die Top-Wahl des Modells, 100% Treffer.',
    style: {
      dice: 'Würfel', diceDesc: 'Wählt zufällig unter Alternativen mit ähnlichem Wert wie die Top-Wahl (nicht nach Riichi oder bei möglichem Sieg)',
      gamble: 'Gamble', gambleDesc: 'Kokushi, Suuankou, Daisangen, Suushii, Tsuuiisou, Chuuren: Route behalten, wenn nah dran; nicht bei Führung in Süd 3/4',
      arb: 'Override', arbDesc: 'Überstimmen, wenn das Modell zögert und der Algorithmus eine andere Option mag oder der Deal-in-Verlust klar größer ist; überspringt einen Sieg in der letzten Runde, der dich trotzdem 4. lässt'
    },
    delay: 'Denkzeit', delayDesc: 'Automatisch nach Sicherheit: schnell bei Sicherheit, länger bei Zweifel (mindestens 2s in einer neuen Runde)', delayValue: '1,2–4,4 s', failPolicy: 'Fehlerverhalten', failPolicyDesc: 'Jede Auffälligkeit pausiert sofort', failPolicyValue: 'Bei Fehler pausieren',
    display: 'Anzeige', overlay: 'Highlight im Spiel', overlayDesc: 'Markiert auf dem Spielbildschirm, wo geklickt wird', risk: 'Gefahrbalken', riskDesc: 'Zeigt das Deal-in-Risiko unter jedem Stein', candidates: 'Kandidaten', candidatesDesc: 'Zeilen unter der Empfehlung', tileSize: 'Steingröße', tileSizeDesc: 'Maximale Steinbreite in der Handreihe', sizeS: 'S', sizeM: 'M', sizeL: 'L',
    data: 'Daten', openDir: 'Ordner öffnen', openDirDesc: 'App-Daten, Modelle und Aufzeichnungen liegen hier', openDirBtn: 'Öffnen', records: 'Spielaufzeichnungen speichern', recordsDesc: 'Für das Review; kann ausgeschaltet werden', clearLogin: 'Login löschen', clearLoginDesc: 'Abmelden und Webdaten löschen', clearRecords: 'Aufzeichnungen löschen', clearRecordsDesc: 'Alle Spielaufzeichnungen löschen',
    clear: 'Löschen', confirmTitle: 'Bestätigen', confirmLogin: 'Das meldet dich ab und löscht die Webdaten.', confirmRecords: 'Das löscht alle Spielaufzeichnungen dauerhaft.',
    about: 'Info', version: 'Version', license: 'Lizenz', licenseValue: 'GPL-3.0-or-later', thirdParty: 'Hinweise zu Drittanbietern', thirdPartyDesc: 'Mortal (AGPL-3.0) · MahjongCopilot (GPL-3.0) · MajsoulMax (GPL-3.0) · riichi-mahjong-tiles (CC0)',
    cancel: 'Abbrechen', diagnostics: 'Diagnose exportieren', diagnosticsDesc: 'Sammelt Logs und Versionsinfo; keine Kontodaten', diagnosticsBtn: 'Export', languageValue: 'Deutsch'
  }
}
