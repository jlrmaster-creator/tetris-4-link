import pygame
import random
import time

# --- Constantes y Configuración ---
CELL_SIZE = 30
COLS = 10
ROWS = 20
WIDTH = COLS * CELL_SIZE
HEIGHT = ROWS * CELL_SIZE
SIDE_PANEL_WIDTH = 250
SCREEN_WIDTH = WIDTH + SIDE_PANEL_WIDTH
SCREEN_HEIGHT = HEIGHT
FPS = 60

# Colores Vibrantes (Conecta 4)
COLORS = [
    (255, 50, 50),   # Rojo
    (50, 255, 50),   # Verde
    (50, 150, 255),  # Azul
    (255, 255, 50),  # Amarillo
    (255, 50, 255)   # Magenta
]

# Otros Colores
BLACK = (10, 10, 15)
WHITE = (240, 240, 240)
GRAY = (128, 128, 128)
GRID_COLOR = (40, 40, 50)
TEXT_COLOR = (200, 200, 200)

# Formas de Tetrominos Clásicos
SHAPES = [
    [[1, 1, 1, 1]], # I
    [[1, 1], [1, 1]], # O
    [[0, 1, 0], [1, 1, 1]], # T
    [[1, 0, 0], [1, 1, 1]], # L
    [[0, 0, 1], [1, 1, 1]], # J
    [[0, 1, 1], [1, 1, 0]], # S
    [[1, 1, 0], [0, 1, 1]]  # Z
]

# Power-ups
POWERUPS = ['B', 'A', 'M'] # Bomb, Arcoiris (Rainbow), Martillo (Hammer)

class Block:
    """Representa un bloque individual en el tablero o pieza."""
    def __init__(self, color, powerup=None):
        self.color = color
        self.powerup = powerup

class Piece:
    """Clase para manejar las piezas que caen."""
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.shape = random.choice(SHAPES)
        
        # Asignar colores aleatorios y posibles power-ups a cada bloque de la pieza
        self.blocks = []
        for row in self.shape:
            block_row = []
            for cell in row:
                if cell:
                    color = random.choice(COLORS)
                    # 10% de probabilidad de ser un Bloque Especial
                    powerup = None
                    if random.random() < 0.10:
                        powerup = random.choice(POWERUPS)
                    block_row.append(Block(color, powerup))
                else:
                    block_row.append(None)
            self.blocks.append(block_row)

    def rotate(self):
        """Rota la pieza en sentido horario."""
        self.blocks = [list(row) for row in zip(*self.blocks[::-1])]

class Board:
    """Gestiona el tablero, colisiones y lógicas de eliminación (Tetris y Conecta 4)."""
    def __init__(self):
        self.grid = [[None for _ in range(COLS)] for _ in range(ROWS)]

    def is_valid_pos(self, piece, offset_x=0, offset_y=0):
        """Verifica si la pieza puede moverse a la posición indicada."""
        for y, row in enumerate(piece.blocks):
            for x, block in enumerate(row):
                if block:
                    new_x = piece.x + x + offset_x
                    new_y = piece.y + y + offset_y
                    if new_x < 0 or new_x >= COLS or new_y >= ROWS:
                        return False
                    if new_y >= 0 and self.grid[new_y][new_x]:
                        return False
        return True

    def lock_piece(self, piece):
        """Bloquea la pieza en el tablero (grid)."""
        for y, row in enumerate(piece.blocks):
            for x, block in enumerate(row):
                if block:
                    new_y = piece.y + y
                    new_x = piece.x + x
                    if new_y >= 0:
                        self.grid[new_y][new_x] = block

    def check_powerups_landing(self, piece):
        """Activa Bomba y Martillo tras aterrizar la pieza."""
        destroy_positions = set()
        for y, row in enumerate(piece.blocks):
            for x, block in enumerate(row):
                if block:
                    py = piece.y + y
                    px = piece.x + x
                    if py >= 0 and 0 <= px < COLS:
                        if block.powerup == 'B':
                            # Bomba: área 3x3
                            for dy in range(-1, 2):
                                for dx in range(-1, 2):
                                    if 0 <= py+dy < ROWS and 0 <= px+dx < COLS:
                                        destroy_positions.add((px+dx, py+dy))
                        elif block.powerup == 'M':
                            # Martillo: fila y columna
                            for c in range(COLS):
                                destroy_positions.add((c, py))
                            for r in range(ROWS):
                                destroy_positions.add((px, r))
        
        points = 0
        if destroy_positions:
            for (px, py) in destroy_positions:
                if self.grid[py][px] is not None:
                    self.grid[py][px] = None
                    points += 20 # puntos por destrucción de power-up
            return points, True
        return 0, False

    def clear_lines(self):
        """Mecánica Tetris: Limpia líneas completas."""
        lines_cleared = 0
        new_grid = []
        for row in self.grid:
            if all(cell is not None for cell in row):
                lines_cleared += 1
            else:
                new_grid.append(row)
        
        # Rellenar con filas vacías por arriba
        while len(new_grid) < ROWS:
            new_grid.insert(0, [None for _ in range(COLS)])
            
        self.grid = new_grid
        return lines_cleared

    def check_connect4(self):
        """Mecánica Conecta 4: Busca 4+ bloques del mismo color."""
        to_remove = set()
        
        def is_match(c1, c2):
            if c1 is None or c2 is None: return False
            # El comodín Arcoíris ('A') encaja con cualquier color
            if getattr(c1, 'powerup', None) == 'A' or getattr(c2, 'powerup', None) == 'A':
                return True
            return c1.color == c2.color

        for y in range(ROWS):
            for x in range(COLS):
                if self.grid[y][x] is not None:
                    # Direcciones: Horizontal, Vertical, Diagonal Derecha, Diagonal Izquierda
                    directions = [(1,0), (0,1), (1,1), (1,-1)]
                    for dx, dy in directions:
                        match_coords = [(x, y)]
                        curr_x, curr_y = x + dx, y + dy
                        while 0 <= curr_x < COLS and 0 <= curr_y < ROWS:
                            # Comparar con el anterior en la cadena para soportar comodines
                            prev_cell = self.grid[match_coords[-1][1]][match_coords[-1][0]]
                            curr_cell = self.grid[curr_y][curr_x]
                            if is_match(prev_cell, curr_cell):
                                match_coords.append((curr_x, curr_y))
                                curr_x += dx
                                curr_y += dy
                            else:
                                break
                        
                        if len(match_coords) >= 4:
                            for coord in match_coords:
                                to_remove.add(coord)

        points = len(to_remove) * 100
        for px, py in to_remove:
            self.grid[py][px] = None
            
        return points, len(to_remove) > 0

    def apply_cascade_gravity(self):
        """Efecto Cascada: Hace caer los bloques que queden en el aire."""
        moved_any = False
        for x in range(COLS):
            # Recorrer de abajo hacia arriba para soltar los que tienen espacio debajo
            for y in range(ROWS - 2, -1, -1):
                if self.grid[y][x] is not None:
                    curr_y = y
                    while curr_y < ROWS - 1 and self.grid[curr_y + 1][x] is None:
                        self.grid[curr_y + 1][x] = self.grid[curr_y][x]
                        self.grid[curr_y][x] = None
                        curr_y += 1
                        moved_any = True
        return moved_any

class GameManager:
    """Clase principal que maneja el loop de juego, rendering e input."""
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Tetris-4-Link")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("Arial", 24, bold=True)
        self.small_font = pygame.font.SysFont("Arial", 16)
        
        self.board = Board()
        self.current_piece = self.get_new_piece()
        self.next_piece = self.get_new_piece()
        self.score = 0
        self.fall_time = 0
        self.fall_speed = 1000 # Empieza en 1000ms
        self.game_over = False

    def get_new_piece(self):
        return Piece(COLS // 2 - 2, -2)

    def draw_grid(self):
        for x in range(0, WIDTH + 1, CELL_SIZE):
            pygame.draw.line(self.screen, GRID_COLOR, (x, 0), (x, HEIGHT))
        for y in range(0, HEIGHT + 1, CELL_SIZE):
            pygame.draw.line(self.screen, GRID_COLOR, (0, y), (WIDTH, y))

    def draw_block(self, surface, x, y, block):
        rect = pygame.Rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        pygame.draw.rect(surface, block.color, rect)
        
        # Sombreado interno para efecto "bloque"
        inner_rect = pygame.Rect(x * CELL_SIZE + 3, y * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6)
        pygame.draw.rect(surface, (min(255, block.color[0]+30), min(255, block.color[1]+30), min(255, block.color[2]+30)), inner_rect)
        pygame.draw.rect(surface, BLACK, rect, 1) # Borde
        
        if block.powerup:
            text = self.font.render(block.powerup, True, WHITE)
            text_rect = text.get_rect(center=rect.center)
            # Delineado negro para el texto
            outline = self.font.render(block.powerup, True, BLACK)
            surface.blit(outline, text_rect.move(2, 2))
            surface.blit(text, text_rect)

    def draw(self):
        self.screen.fill(BLACK)
        self.draw_grid()
        
        # Tablero
        for y in range(ROWS):
            for x in range(COLS):
                block = self.board.grid[y][x]
                if block:
                    self.draw_block(self.screen, x, y, block)
                    
        # Pieza Actual
        if self.current_piece:
            for y, row in enumerate(self.current_piece.blocks):
                for x, block in enumerate(row):
                    if block and self.current_piece.y + y >= 0:
                        self.draw_block(self.screen, self.current_piece.x + x, self.current_piece.y + y, block)
                        
        # Panel Lateral UI
        panel_rect = pygame.Rect(WIDTH, 0, SIDE_PANEL_WIDTH, SCREEN_HEIGHT)
        pygame.draw.rect(self.screen, (25, 25, 30), panel_rect)
        pygame.draw.line(self.screen, GRAY, (WIDTH, 0), (WIDTH, SCREEN_HEIGHT), 2)
        
        score_text = self.font.render(f"Puntuación: {self.score}", True, WHITE)
        self.screen.blit(score_text, (WIDTH + 20, 20))
        
        # Velocidad aumenta cada 500 puntos
        nivel = (self.score // 500) + 1
        speed_text = self.font.render(f"Nivel/Vel: {nivel}", True, WHITE)
        self.screen.blit(speed_text, (WIDTH + 20, 60))
        
        next_text = self.font.render("Siguiente Pieza:", True, WHITE)
        self.screen.blit(next_text, (WIDTH + 20, 120))
        
        if self.next_piece:
            offset_x = WIDTH + 60
            offset_y = 160
            for y, row in enumerate(self.next_piece.blocks):
                for x, block in enumerate(row):
                    if block:
                        self.draw_block(self.screen, offset_x // CELL_SIZE + x, offset_y // CELL_SIZE + y, block)
                        # Dibujarlo manualmente sin alinear al grid global estricto
                        rect = pygame.Rect(offset_x + x * CELL_SIZE, offset_y + y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
                        pygame.draw.rect(self.screen, block.color, rect)
                        inner = pygame.Rect(offset_x + x*CELL_SIZE + 3, offset_y + y*CELL_SIZE + 3, CELL_SIZE-6, CELL_SIZE-6)
                        pygame.draw.rect(self.screen, (min(255, block.color[0]+30), min(255, block.color[1]+30), min(255, block.color[2]+30)), inner)
                        pygame.draw.rect(self.screen, BLACK, rect, 1)
                        if block.powerup:
                            p_text = self.font.render(block.powerup, True, WHITE)
                            p_rect = p_text.get_rect(center=rect.center)
                            out = self.font.render(block.powerup, True, BLACK)
                            self.screen.blit(out, p_rect.move(2, 2))
                            self.screen.blit(p_text, p_rect)

        # Instrucciones
        inst_y = 350
        instructions = [
            "Controles:",
            "  -> Flechas: Mover / Rotar",
            "  -> Espacio: Hard Drop",
            "",
            "Power-ups (10% prob):",
            "  [B] Bomba: Destruye 3x3",
            "  [M] Martillo: Fila y Columna",
            "  [A] Arcoíris: Comodín Conecta-4",
            "",
            "Mecánicas:",
            "  - Combina 4+ colores iguales",
            "  - Completa líneas horizontales",
            "  - Los bloques sin soporte caen!"
        ]
        for line in instructions:
            inst_text = self.small_font.render(line, True, TEXT_COLOR)
            self.screen.blit(inst_text, (WIDTH + 15, inst_y))
            inst_y += 20

        if self.game_over:
            # Fondo semi-transparente
            s = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
            s.set_alpha(150)
            s.fill((0, 0, 0))
            self.screen.blit(s, (0, 0))
            go_text = self.font.render("GAME OVER", True, (255, 50, 50))
            self.screen.blit(go_text, (SCREEN_WIDTH // 2 - go_text.get_width() // 2, HEIGHT // 2))

        pygame.display.flip()

    def handle_lock_sequence(self):
        """Ejecuta la secuencia de validación al aterrizar una pieza."""
        self.board.lock_piece(self.current_piece)
        
        # 1. Ejecutar Bomba y Martillo
        p_points, triggered = self.board.check_powerups_landing(self.current_piece)
        self.score += p_points
        if triggered:
            self.draw()
            pygame.time.delay(300)
            self.board.apply_cascade_gravity()
            self.draw()
            pygame.time.delay(200)

        # 2. Bucle de Resolución: Cascada -> Tetris -> Conecta 4 -> Repetir si hay cambios
        while True:
            lines = self.board.clear_lines()
            if lines > 0:
                self.score += [0, 100, 300, 500, 800][lines] # Puntos tipo Tetris
                self.draw()
                pygame.time.delay(200)
                
            c4_points, c4_triggered = self.board.check_connect4()
            if c4_triggered:
                self.score += c4_points
                self.draw()
                pygame.time.delay(200)
                
            if lines > 0 or c4_triggered:
                moved = self.board.apply_cascade_gravity()
                if moved:
                    self.draw()
                    pygame.time.delay(200)
            else:
                break

        # Aumento de velocidad cada 500 puntos (Mínimo de 100ms)
        self.fall_speed = max(100, 1000 - (self.score // 500) * 100)
        
        # Siguiente pieza
        self.current_piece = self.next_piece
        self.next_piece = self.get_new_piece()
        
        # Comprobar Game Over (Si la nueva pieza no cabe)
        if not self.board.is_valid_pos(self.current_piece):
            self.game_over = True

    def hard_drop(self):
        """Baja la pieza instantáneamente al fondo."""
        while self.board.is_valid_pos(self.current_piece, offset_y=1):
            self.current_piece.y += 1
        self.handle_lock_sequence()

    def run(self):
        """Bucle principal de Pygame."""
        while True:
            dt = self.clock.tick(FPS)
            self.fall_time += dt
            
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    return
                if event.type == pygame.KEYDOWN and not self.game_over:
                    if event.key == pygame.K_LEFT:
                        if self.board.is_valid_pos(self.current_piece, offset_x=-1):
                            self.current_piece.x -= 1
                    elif event.key == pygame.K_RIGHT:
                        if self.board.is_valid_pos(self.current_piece, offset_x=1):
                            self.current_piece.x += 1
                    elif event.key == pygame.K_DOWN:
                        if self.board.is_valid_pos(self.current_piece, offset_y=1):
                            self.current_piece.y += 1
                    elif event.key == pygame.K_UP:
                        old_blocks = self.current_piece.blocks
                        self.current_piece.rotate()
                        if not self.board.is_valid_pos(self.current_piece):
                            self.current_piece.blocks = old_blocks # Deshacer si choca
                    elif event.key == pygame.K_SPACE:
                        self.hard_drop()

            if not self.game_over and self.fall_time >= self.fall_speed:
                self.fall_time = 0
                if self.board.is_valid_pos(self.current_piece, offset_y=1):
                    self.current_piece.y += 1
                else:
                    self.handle_lock_sequence()
                    
            self.draw()

if __name__ == "__main__":
    game = GameManager()
    game.run()
