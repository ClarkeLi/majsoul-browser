import unittest

from soul_core.game.hand_tracker import HandTracker, to_mjai_tile, to_server_tile


class TileNameTest(unittest.TestCase):
    def test_red_five(self):
        for s in 'mps':
            self.assertEqual(to_server_tile(f'5{s}r'), f'0{s}')
            self.assertEqual(to_server_tile(f'0{s}'), f'0{s}')
            self.assertEqual(to_server_tile(f'5{s}'), f'5{s}')
            self.assertEqual(to_mjai_tile(f'0{s}'), f'5{s}r')
            self.assertEqual(to_mjai_tile(f'5{s}'), f'5{s}')
        self.assertEqual(to_server_tile('E'), '1z')
        self.assertEqual(to_server_tile('C'), '7z')
        self.assertEqual(to_server_tile('1z'), '1z')
        self.assertEqual(to_mjai_tile('P'), 'P')


class HandTrackerTest(unittest.TestCase):
    def setUp(self):
        self.h = HandTracker()
        self.start = ['3m', '1m', '0m', '7m', '2p', '9p', '4s', '4s', '6s', '8s', '1z', '1z', '7z']
        self.h.reset(self.start)

    def test_reset_keeps_order(self):
        self.assertEqual(list(self.h.tiles), self.start)
        self.assertEqual(len(self.h.tiles), 13)

    def test_flow(self):
        self.h.draw('5p')
        self.assertEqual(self.h.last_drawn, '5p')
        self.assertEqual(self.h.index_of('5p'), 13)
        # 打赤五（mjai 写法）
        self.assertTrue(self.h.discard('5mr'))
        self.assertEqual(self.h.index_of('7m'), 2)
        self.assertIsNone(self.h.index_of('0m'))
        # 吃：用 1m 3m 吃别家的 2m
        self.assertTrue(self.h.call(['1m', '3m']))
        self.assertEqual(list(self.h.tiles),
                         ['7m', '2p', '9p', '4s', '4s', '6s', '8s', '1z', '1z', '7z', '5p'])
        self.assertEqual(self.h.index_of('7m'), 0)
        self.assertEqual(self.h.index_of('6s'), 5)
        self.assertEqual(self.h.index_of('5p'), 10)

    def test_duplicate_first_match(self):
        self.assertEqual(self.h.index_of('4s'), 6)
        self.h.discard('4s')
        self.assertEqual(self.h.index_of('4s'), 6)
        self.h.discard('4s')
        self.assertIsNone(self.h.index_of('4s'))

    def test_kan(self):
        self.assertTrue(self.h.kan(['E', 'E']))
        self.assertNotIn('E', self.h.tiles)

    def test_missing_returns_false(self):
        before = self.h.tiles
        self.assertFalse(self.h.discard('9s'))
        self.assertEqual(self.h.tiles, before)
        self.assertIsNone(self.h.index_of('9s'))

    def test_call_partial_failure(self):
        self.assertFalse(self.h.call(['1m', '9s']))

    def test_tiles_is_immutable_copy(self):
        self.assertIsInstance(self.h.tiles, tuple)


if __name__ == '__main__':
    unittest.main()
