import unittest

from soul_core.decision.validate import parse_operations, reaction_to_intent as map_reaction, LegalActions

HAND = ['1m', '2m', '3m', '4m', '0m', '5m', '6m', '7p', '7p', '7p', '9s', '9s', '1z', '2z']


def ops(*items, seat=0):
    return {'operation': {'seat': seat, 'operation_list': [
        {'type': t, 'combination': c} for t, c in items]}}


def parse(*items):
    return parse_operations(ops(*items), 0, 1.0)


class ParseTest(unittest.TestCase):
    def test_none_cases(self):
        self.assertIsNone(parse_operations({}, 0, 0))
        self.assertIsNone(parse_operations(ops((1, []), seat=2), 0, 0))

    def test_classify(self):
        lg = parse((1, []), (7, []), (4, ['0,1,2,3']), (6, ['4']))
        self.assertTrue(lg.can_dapai and lg.can_liqi)
        self.assertEqual(lg.can_an_gang, [(0, ['0', '1', '2', '3'])])
        self.assertEqual(lg.can_add_gang, [(0, ['4'])])
        self.assertFalse(lg.can_pass)
        self.assertEqual(lg.received_at, 1.0)

    def test_pass_and_empty_combo(self):
        lg = parse((2, ['3,4', '', '5,6']), (9, []))
        self.assertEqual(lg.can_chi, [(0, ['3', '4']), (2, ['5', '6'])])
        self.assertTrue(lg.can_pass and lg.can_rong)
        self.assertFalse(parse((8, [])).can_pass)


class MapTest(unittest.TestCase):
    def test_dapai(self):
        lg = parse((1, []))
        r = map_reaction(lg, {'type': 'dahai', 'pai': '5mr', 'tsumogiri': False}, HAND, None)
        self.assertEqual(r, {'kind': 'dapai', 'type': 1,
                             'index': 4, 'tile': '0m', 'moqie': False})
        r = map_reaction(lg, {'type': 'dahai', 'pai': '2z', 'tsumogiri': True}, HAND, None)
        self.assertEqual((r['index'], r['moqie']), (13, True))

    def test_tsumogiri_duplicate_points_to_last(self):
        lg = parse((1, []))
        hand = ['1m', '2m', '9s', '3m', '4m', '5m', '6m', '7m', '8m', '1p', '2p', '3p', '4p', '9s']
        r = map_reaction(lg, {'type': 'dahai', 'pai': '9s', 'tsumogiri': True}, hand, None)
        self.assertEqual((r['index'], r['moqie']), (13, True))
        r = map_reaction(lg, {'type': 'dahai', 'pai': '9s', 'tsumogiri': False}, hand, None)
        self.assertEqual((r['index'], r['moqie']), (2, False))

    def test_dapai_invalid(self):
        lg = parse((1, []))
        self.assertIsNone(map_reaction(lg, {'type': 'dahai', 'pai': '9p'}, HAND, None))
        self.assertIsNone(map_reaction(lg, {'type': 'dahai'}, HAND, None))
        self.assertIsNone(map_reaction(parse((7, [])), {'type': 'dahai', 'pai': '1m'}, HAND, None))

    def test_chi_two_combos(self):
        lg = parse((2, ['3,4', '5,6']))  # 4m0m / 5m6m
        r = map_reaction(lg, {'type': 'chi', 'pai': '3m', 'consumed': ['4m', '5mr']}, HAND, '3m')
        self.assertEqual(r, {'kind': 'chi', 'type': 2, 'index': 0})
        r = map_reaction(lg, {'type': 'chi', 'pai': '4m', 'consumed': ['5m', '6m']}, HAND, '4m')
        self.assertEqual(r['index'], 1)
        # pai 与 last_discard 不符 / 组合不在 legal
        self.assertIsNone(map_reaction(lg, {'type': 'chi', 'pai': '3m', 'consumed': ['4m', '5mr']}, HAND, '4m'))
        self.assertIsNone(map_reaction(lg, {'type': 'chi', 'pai': '3m', 'consumed': ['1m', '2m']}, HAND, '3m'))
        self.assertIsNone(map_reaction(lg, {'type': 'chi', 'pai': '3m', 'consumed': ['4m', '5mr']}, HAND, None))

    def test_pon(self):
        lg = parse((3, ['7,8']))
        r = map_reaction(lg, {'type': 'pon', 'pai': '7p', 'consumed': ['7p', '7p']}, HAND, '7p')
        self.assertEqual(r, {'kind': 'peng', 'type': 3, 'index': 0})

    def test_daiminkan(self):
        lg = parse((5, ['7,8,9']))
        r = map_reaction(lg, {'type': 'daiminkan', 'pai': '7p', 'consumed': ['7p'] * 3}, HAND, '7p')
        self.assertEqual((r['kind'], r['type'], r['index']), ('kan', 5, 0))
        self.assertIsNone(map_reaction(lg, {'type': 'daiminkan', 'pai': '7p', 'consumed': ['7p'] * 2}, HAND, '7p'))

    def test_ankan(self):
        hand = HAND[:7] + ['7p'] * 4 + ['9s', '9s', '1z']
        lg = parse((4, ['7,8,9,10']))
        r = map_reaction(lg, {'type': 'ankan', 'consumed': ['7p'] * 4}, hand, None)
        self.assertEqual((r['kind'], r['type'], r['index']), ('kan', 4, 0))
        self.assertIsNone(map_reaction(lg, {'type': 'ankan', 'consumed': ['9s'] * 4}, hand, None))

    def test_kakan(self):
        lg = parse((6, ['7']))
        r = map_reaction(lg, {'type': 'kakan', 'pai': '7p', 'consumed': ['7p'] * 3}, HAND, None)
        self.assertEqual((r['kind'], r['type'], r['index']), ('kan', 6, 0))
        self.assertIsNone(map_reaction(lg, {'type': 'kakan', 'pai': '9s'}, HAND, None))

    def test_reach(self):
        lg = parse((1, []), (7, []))
        r = map_reaction(lg, {'type': 'reach', 'actor': 0}, HAND, None)
        self.assertEqual(r, {'kind': 'liqi', 'type': 7,
                             'index': 0, 'tile': '', 'needs_discard': True})
        r = map_reaction(lg, {'type': 'reach', 'tsumogiri': True}, HAND, None, discard_tile='5mr')
        self.assertEqual((r['kind'], r['type'], r['index'], r['tile'], r['moqie']),
                         ('liqi', 7, 4, '0m', True))
        self.assertIsNone(map_reaction(parse((1, [])), {'type': 'reach'}, HAND, None))
        self.assertIsNone(map_reaction(lg, {'type': 'reach'}, HAND, None, discard_tile='9p'))

    def test_hora(self):
        r = map_reaction(parse((8, [])), {'type': 'hora', 'actor': 0, 'target': 0}, HAND, None)
        self.assertEqual((r['kind'], r['type']), ('hora', 8))
        r = map_reaction(parse((9, [])), {'type': 'hora', 'actor': 0, 'target': 2}, HAND, '1m')
        self.assertEqual((r['kind'], r['type']), ('hora', 9))
        self.assertIsNone(map_reaction(parse((8, [])), {'type': 'hora', 'actor': 0, 'target': 2}, HAND, '1m'))
        self.assertIsNone(map_reaction(parse((1, [])), {'type': 'hora', 'actor': 0, 'target': 0}, HAND, None))

    def test_jiuzhong(self):
        r = map_reaction(parse((10, [])), {'type': 'ryukyoku'}, HAND, None)
        self.assertEqual((r['kind'], r['type']), ('jiuzhong', 10))
        self.assertIsNone(map_reaction(parse((1, [])), {'type': 'ryukyoku'}, HAND, None))

    def test_pass(self):
        r = map_reaction(parse((3, ['7,8']), (9, [])), {'type': 'none'}, HAND, '7p')
        self.assertEqual(r, {'kind': 'pass', 'type': 0, 'index': 0})
        self.assertIsNone(map_reaction(parse((1, [])), {'type': 'none'}, HAND, None))

    def test_garbage(self):
        lg = parse((1, []))
        for bad in (None, {}, {'type': 'zzz'}, {'type': 'chi'}, 'x', {'type': 'kakan'}):
            self.assertIsNone(map_reaction(lg, bad, HAND, None) if bad != {} else
                              map_reaction(parse((1, [])), bad, HAND, None))
        self.assertIsNone(map_reaction(None, {'type': 'dahai', 'pai': '1m'}, HAND, None))
        bad_legal = LegalActions(seat=0, can_chi=[(0, ['99'])])
        self.assertIsNone(map_reaction(bad_legal, {'type': 'chi', 'pai': '3m', 'consumed': ['4m']}, HAND, '3m'))

class TileNameTest(unittest.TestCase):
    def test_parse_names(self):
        lg = parse((2, ['4m|6m', '0m,6m']), (3, ['5p|5p']), (5, ['7s|7s|7s']),
                   (4, ['1z|1z|1z|1z']), (6, ['3m', 'zz']))
        self.assertEqual(lg.can_chi, [(0, ['4m', '6m']), (1, ['0m', '6m'])])
        self.assertEqual(lg.can_peng, [(0, ['5p', '5p'])])
        self.assertEqual(lg.can_ming_gang, [(0, ['7s'] * 3)])
        self.assertEqual(lg.can_an_gang, [(0, ['1z'] * 4)])
        self.assertEqual(lg.can_add_gang, [(0, ['3m'])])

    def test_discard_honor_mjai_name(self):
        lg = parse((1, []))
        hand = ['1m', '1z', '5z', '9p']
        for mjai, server, idx in (('E', '1z', 1), ('P', '5z', 2)):
            r = map_reaction(lg, {'type': 'dahai', 'pai': mjai, 'tsumogiri': False}, hand, None)
            self.assertEqual((r['tile'], r['index']), (server, idx))

    def test_chi_names_red(self):
        lg = parse((2, ['4m|6m', '0m|6m']))
        r = map_reaction(lg, {'type': 'chi', 'pai': '7m', 'consumed': ['5mr', '6m']}, HAND, '7m')
        self.assertEqual(r, {'kind': 'chi', 'type': 2, 'index': 1})
        r = map_reaction(lg, {'type': 'chi', 'pai': '5m', 'consumed': ['4m', '6m']}, HAND, '5m')
        self.assertEqual(r['index'], 0)
        self.assertIsNone(map_reaction(lg, {'type': 'chi', 'pai': '7m', 'consumed': ['5m', '6m']}, HAND, '7m'))

    def test_pon_kan_names(self):
        r = map_reaction(parse((3, ['5p|5p'])), {'type': 'pon', 'pai': '5p', 'consumed': ['5p', '5p']}, HAND, '5p')
        self.assertEqual((r['kind'], r['type'], r['index']), ('peng', 3, 0))
        r = map_reaction(parse((5, ['7s|7s|7s'])), {'type': 'daiminkan', 'pai': '7s', 'consumed': ['7s'] * 3}, HAND, '7s')
        self.assertEqual((r['kind'], r['type']), ('kan', 5))
        r = map_reaction(parse((4, ['1z|1z|1z|1z'])), {'type': 'ankan', 'consumed': ['1z'] * 4}, HAND, None)
        self.assertEqual((r['kind'], r['type']), ('kan', 4))
        lg = parse((6, ['3m', '0m']))
        r = map_reaction(lg, {'type': 'kakan', 'pai': '5mr'}, HAND, None)
        self.assertEqual((r['type'], r['index']), (6, 1))
        self.assertIsNone(map_reaction(lg, {'type': 'kakan', 'pai': '9m'}, HAND, None))


if __name__ == '__main__':
    unittest.main()
