import random
from typing import List, Tuple, Optional
from backend.app.game_logic import BOARD_SIZE, EMPTY, BLACK, WHITE, check_win

# Score constants
WIN_SCORE = 100000
FOUR_SCORE = 10000
OPEN_THREE_SCORE = 2000
THREE_SCORE = 500
TWO_SCORE = 50


class OmokAI:
    def __init__(self, ai_player: int = WHITE):
        self.ai_player = ai_player
        self.opponent = BLACK if ai_player == WHITE else WHITE

    def get_best_move(self, board: List[List[int]], difficulty: str = "medium") -> Tuple[int, int]:
        candidates = self._get_candidate_moves(board)
        if not candidates:
            # If board is empty, place near the center (7, 7)
            return (7, 7)

        if difficulty == "easy":
            return self._get_easy_move(board, candidates)
        elif difficulty == "hard":
            return self._get_hard_move(board, candidates)
        else:
            # medium
            return self._get_medium_move(board, candidates)

    def _get_candidate_moves(self, board: List[List[int]]) -> List[Tuple[int, int]]:
        """Returns empty positions that are within distance 2 of existing stones."""
        candidates = set()
        has_stones = False

        for r in range(BOARD_SIZE):
            for c in range(BOARD_SIZE):
                if board[r][c] != EMPTY:
                    has_stones = True
                    # Add neighboring cells
                    for dr in range(-2, 3):
                        for dc in range(-2, 3):
                            nr, nc = r + dr, c + dc
                            if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE and board[nr][nc] == EMPTY:
                                candidates.add((nr, nc))

        if not has_stones:
            return [(7, 7)]

        return list(candidates)

    def _get_easy_move(self, board: List[List[int]], candidates: List[Tuple[int, int]]) -> Tuple[int, int]:

        # 1. Instant win if possible
        for r, c in candidates:
            if check_win(board, r, c, self.ai_player):
                return (r, c)

        # 2. Instant block if opponent can win
        for r, c in candidates:
            if check_win(board, r, c, self.opponent):
                return (r, c)

        # Otherwise pick randomly among candidates with decent score
        scored = [(self._evaluate_position(board, r, c, self.ai_player), (r, c)) for r, c in candidates]
        scored.sort(key=lambda x: x[0], reverse=True)

        top_count = min(5, len(scored))
        return random.choice([move for _, move in scored[:top_count]])

    def _get_medium_move(self, board: List[List[int]], candidates: List[Tuple[int, int]]) -> Tuple[int, int]:

        # 1. Instant win
        for r, c in candidates:
            if check_win(board, r, c, self.ai_player):
                return (r, c)

        # 2. Instant block
        for r, c in candidates:
            if check_win(board, r, c, self.opponent):
                return (r, c)

        # 3. Best heuristic move considering attack and defense
        best_score = -1
        best_move = candidates[0]

        for r, c in candidates:
            attack_score = self._evaluate_position(board, r, c, self.ai_player)
            defense_score = self._evaluate_position(board, r, c, self.opponent)

            # Defensive moves weighted slightly higher if opponent has strong shape
            combined_score = attack_score + int(defense_score * 1.2)

            if combined_score > best_score:
                best_score = combined_score
                best_move = (r, c)

        return best_move

    def _get_hard_move(self, board: List[List[int]], candidates: List[Tuple[int, int]]) -> Tuple[int, int]:

        # Minimax with alpha-beta depth 2
        best_val = -float('inf')
        best_move = candidates[0]

        # Prioritize candidates using heuristic score for fast pruning
        candidates_scored = []
        for r, c in candidates:
            score = self._evaluate_position(board, r, c, self.ai_player) + self._evaluate_position(board, r, c, self.opponent)
            candidates_scored.append((score, r, c))
        candidates_scored.sort(key=lambda x: x[0], reverse=True)

        # Take top 15 candidates to keep response time fast
        top_candidates = [(r, c) for _, r, c in candidates_scored[:15]]

        for r, c in top_candidates:
            # Check instant win
            if check_win(board, r, c, self.ai_player):
                return (r, c)

            board[r][c] = self.ai_player
            val = self._min_node(board, depth=1, alpha=-float('inf'), beta=float('inf'), last_move=(r, c))
            board[r][c] = EMPTY

            if val > best_val:
                best_val = val
                best_move = (r, c)

        return best_move

    def _min_node(self, board: List[List[int]], depth: int, alpha: float, beta: float, last_move: Tuple[int, int]) -> float:
        r_last, c_last = last_move
        if check_win(board, r_last, c_last, self.ai_player):
            return WIN_SCORE

        if depth == 0:
            return self._evaluate_board(board)

        candidates = self._get_candidate_moves(board)
        min_val = float('inf')

        for r, c in candidates[:10]:
            if check_win(board, r, c, self.opponent):
                return -WIN_SCORE

            board[r][c] = self.opponent
            val = self._max_node(board, depth - 1, alpha, beta, (r, c))
            board[r][c] = EMPTY

            min_val = min(min_val, val)
            beta = min(beta, min_val)
            if beta <= alpha:
                break

        return min_val

    def _max_node(self, board: List[List[int]], depth: int, alpha: float, beta: float, last_move: Tuple[int, int]) -> float:
        r_last, c_last = last_move
        if check_win(board, r_last, c_last, self.opponent):
            return -WIN_SCORE

        if depth == 0:
            return self._evaluate_board(board)

        candidates = self._get_candidate_moves(board)
        max_val = -float('inf')

        for r, c in candidates[:10]:
            if check_win(board, r, c, self.ai_player):
                return WIN_SCORE

            board[r][c] = self.ai_player
            val = self._min_node(board, depth - 1, alpha, beta, (r, c))
            board[r][c] = EMPTY

            max_val = max(max_val, val)
            alpha = max(alpha, max_val)
            if beta <= alpha:
                break

        return max_val

    def _evaluate_position(self, board: List[List[int]], row: int, col: int, player: int) -> int:

        directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
        total_score = 0

        for dr, dc in directions:
            count = 1
            open_ends = 0

            # Forward
            r, c = row + dr, col + dc
            while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == player:
                count += 1
                r += dr
                c += dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == EMPTY:
                open_ends += 1

            # Backward
            r, c = row - dr, col - dc
            while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == player:
                count += 1
                r -= dr
                c -= dc
            if 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == EMPTY:
                open_ends += 1

            if count >= 5:
                total_score += WIN_SCORE
            elif count == 4:
                total_score += FOUR_SCORE if open_ends > 0 else FOUR_SCORE // 2
            elif count == 3:
                total_score += OPEN_THREE_SCORE if open_ends == 2 else THREE_SCORE
            elif count == 2:
                total_score += TWO_SCORE * open_ends

        return total_score

    def _evaluate_board(self, board: List[List[int]]) -> float:

        score = 0
        for r in range(BOARD_SIZE):
            for c in range(BOARD_SIZE):
                if board[r][c] == self.ai_player:
                    score += self._evaluate_position(board, r, c, self.ai_player)
                elif board[r][c] == self.opponent:
                    score -= self._evaluate_position(board, r, c, self.opponent)
        return score
