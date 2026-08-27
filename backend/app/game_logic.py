from typing import List, Optional, Tuple, Dict, Any

BOARD_SIZE = 15

# Player 1 = Black (First move), Player 2 = White (Second move)
EMPTY = 0
BLACK = 1
WHITE = 2


class OmokGame:
    def __init__(self):
        self.board: List[List[int]] = [[EMPTY for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.current_turn: int = BLACK
        self.winner: Optional[int] = None
        self.winning_line: Optional[List[Tuple[int, int]]] = None
        self.move_history: List[Tuple[int, int, int]] = []  # (row, col, player)
        self.is_game_over: bool = False

    def reset(self):
        self.board = [[EMPTY for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.current_turn = BLACK
        self.winner = None
        self.winning_line = None
        self.move_history = []
        self.is_game_over = False

    def is_valid_move(self, row: int, col: int) -> bool:
        if self.is_game_over:
            return False
        if not (0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE):
            return False
        return self.board[row][col] == EMPTY

    def make_move(self, row: int, col: int, player: Optional[int] = None) -> bool:
        if player is None:
            player = self.current_turn

        if player != self.current_turn:
            return False

        if not self.is_valid_move(row, col):
            return False

        self.board[row][col] = player
        self.move_history.append((row, col, player))

        # Check win condition
        win_line = check_win(self.board, row, col, player)
        if win_line:
            self.winner = player
            self.winning_line = win_line
            self.is_game_over = True
        elif len(self.move_history) == BOARD_SIZE * BOARD_SIZE:
            self.winner = 0  # Draw
            self.is_game_over = True
        else:
            self.current_turn = WHITE if player == BLACK else BLACK

        return True

    def undo_move(self) -> Optional[Tuple[int, int, int]]:
        if not self.move_history or self.is_game_over:
            return None

        last_move = self.move_history.pop()
        row, col, player = last_move
        self.board[row][col] = EMPTY
        self.current_turn = player
        self.winner = None
        self.winning_line = None
        self.is_game_over = False
        return last_move

    def get_state(self) -> Dict[str, Any]:
        return {
            "board": self.board,
            "current_turn": self.current_turn,
            "winner": self.winner,
            "winning_line": self.winning_line,
            "move_history": self.move_history,
            "is_game_over": self.is_game_over
        }


def check_win(board: List[List[int]], row: int, col: int, player: int) -> Optional[List[Tuple[int, int]]]:
    """
    Checks if placing a stone at (row, col) results in 5 or more consecutive stones for 'player'.
    Returns the list of coordinates forming the winning line, or None if no win.
    """
    directions = [
        (0, 1),   # Horizontal
        (1, 0),   # Vertical
        (1, 1),   # Diagonal down-right
        (1, -1)   # Diagonal down-left
    ]

    for dr, dc in directions:
        line = [(row, col)]

        # Positive direction
        r, c = row + dr, col + dc
        while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == player:
            line.append((r, c))
            r += dr
            c += dc

        # Negative direction
        r, c = row - dr, col - dc
        while 0 <= r < BOARD_SIZE and 0 <= c < BOARD_SIZE and board[r][c] == player:
            line.append((r, c))
            r -= dr
            c -= dc

        if len(line) >= 5:
            # Sort coordinates for consistent display
            line.sort()
            return line

    return None
