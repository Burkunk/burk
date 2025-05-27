import sys
import pygame

# Game settings
SCREEN_WIDTH = 448
SCREEN_HEIGHT = 496
TILE_SIZE = 16
FPS = 60

# Colors
BLACK = (0, 0, 0)
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)


class Pacman:
    def __init__(self):
        self.rect = pygame.Rect(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE)
        self.direction = pygame.Vector2(0, 0)
        self.speed = 2

    def update(self):
        self.rect.move_ip(self.direction * self.speed)
        self.rect.clamp_ip(pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT))

    def draw(self, screen):
        pygame.draw.circle(screen, YELLOW, self.rect.center, TILE_SIZE // 2)


def main():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    clock = pygame.time.Clock()

    pacman = Pacman()

    dots = []
    for y in range(TILE_SIZE, SCREEN_HEIGHT, TILE_SIZE * 2):
        for x in range(TILE_SIZE, SCREEN_WIDTH, TILE_SIZE * 2):
            dots.append(pygame.Rect(x, y, 4, 4))

    score = 0
    running = True

    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    pacman.direction = pygame.Vector2(-1, 0)
                elif event.key == pygame.K_RIGHT:
                    pacman.direction = pygame.Vector2(1, 0)
                elif event.key == pygame.K_UP:
                    pacman.direction = pygame.Vector2(0, -1)
                elif event.key == pygame.K_DOWN:
                    pacman.direction = pygame.Vector2(0, 1)

        pacman.update()

        for dot in dots[:]:
            if pacman.rect.colliderect(dot):
                dots.remove(dot)
                score += 10

        screen.fill(BLACK)
        for dot in dots:
            pygame.draw.rect(screen, WHITE, dot)
        pacman.draw(screen)

        pygame.display.flip()
        pygame.display.set_caption(f"Pacman - Score: {score}")
        clock.tick(FPS)

    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
