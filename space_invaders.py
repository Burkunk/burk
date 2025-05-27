import pygame
import sys
import random

# Initialiseer Pygame
pygame.init()

# Constanten
SCHERM_BREEDTE = 800
SCHERM_HOOGTE = 600
SPELER_GROOTTE = 40
ALIEN_GROOTTE = 40
KOGEL_GROOTTE = 5
ALIEN_RIJEN = 5
ALIENS_PER_RIJ = 11

# Kleuren
WIT = (255, 255, 255)
GROEN = (0, 255, 0)
ROOD = (255, 0, 0)

# Scherm opzetten
scherm = pygame.display.set_mode((SCHERM_BREEDTE, SCHERM_HOOGTE))
pygame.display.set_caption("Space Invaders")

class Speler:
    def __init__(self):
        self.breedte = SPELER_GROOTTE
        self.hoogte = SPELER_GROOTTE
        self.x = SCHERM_BREEDTE // 2 - self.breedte // 2
        self.y = SCHERM_HOOGTE - self.hoogte - 10
        self.snelheid = 5
        self.kogels = []

    def beweeg(self, richting):
        if richting == 'links' and self.x > 0:
            self.x -= self.snelheid
        if richting == 'rechts' and self.x < SCHERM_BREEDTE - self.breedte:
            self.x += self.snelheid

    def schiet(self):
        if len(self.kogels) < 3:  # Maximum 3 kogels tegelijk
            kogel = pygame.Rect(
                self.x + self.breedte // 2 - KOGEL_GROOTTE // 2,
                self.y,
                KOGEL_GROOTTE,
                KOGEL_GROOTTE * 2
            )
            self.kogels.append(kogel)

    def update_kogels(self):
        for kogel in self.kogels[:]:
            kogel.y -= 7
            if kogel.y < 0:
                self.kogels.remove(kogel)

    def teken(self):
        # Teken driehoekig ruimteschip
        punten = [
            (self.x + self.breedte // 2, self.y),  # Top
            (self.x, self.y + self.hoogte),  # Linksonder
            (self.x + self.breedte, self.y + self.hoogte)  # Rechtsonder
        ]
        pygame.draw.polygon(scherm, GROEN, punten)
        # Teken kogels
        for kogel in self.kogels:
            pygame.draw.rect(scherm, GROEN, kogel)

class Alien:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.breedte = ALIEN_GROOTTE
        self.hoogte = ALIEN_GROOTTE
        self.richting = 1  # 1 voor rechts, -1 voor links

    def beweeg(self, snelheid):
        self.x += snelheid * self.richting

    def ga_omlaag(self):
        self.y += 20

    def teken(self):
        # Teken klassieke Space Invaders alien (vereenvoudigd)
        alien_rect = pygame.Rect(self.x, self.y, self.breedte, self.hoogte)
        pygame.draw.rect(scherm, ROOD, alien_rect)
        # Voeg "tentakels" toe voor klassieke look
        pygame.draw.rect(scherm, ROOD, (self.x + 10, self.y + self.hoogte, 5, 5))
        pygame.draw.rect(scherm, ROOD, (self.x + self.breedte - 15, self.y + self.hoogte, 5, 5))

class SpaceInvaders:
    def __init__(self):
        self.speler = Speler()
        self.aliens = []
        self.alien_snelheid = 1
        self.score = 0
        self.game_over = False
        self.maak_aliens()

    def maak_aliens(self):
        for rij in range(ALIEN_RIJEN):
            for kolom in range(ALIENS_PER_RIJ):
                x = 100 + kolom * (ALIEN_GROOTTE + 20)
                y = 50 + rij * (ALIEN_GROOTTE + 20)
                self.aliens.append(Alien(x, y))

    def update(self):
        if not self.game_over:
            # Update speler kogels
            self.speler.update_kogels()

            # Beweeg aliens
            moet_omlaag = False
            for alien in self.aliens:
                alien.beweeg(self.alien_snelheid)
                if (alien.x <= 0 and self.alien_snelheid < 0) or \
                   (alien.x + ALIEN_GROOTTE >= SCHERM_BREEDTE and self.alien_snelheid > 0):
                    moet_omlaag = True

            # Als aliens de rand raken, ga omlaag en verander richting
            if moet_omlaag:
                self.alien_snelheid *= -1
                for alien in self.aliens:
                    alien.ga_omlaag()

            # Check voor kollisies
            for kogel in self.speler.kogels[:]:
                for alien in self.aliens[:]:
                    alien_rect = pygame.Rect(alien.x, alien.y, ALIEN_GROOTTE, ALIEN_GROOTTE)
                    if kogel.colliderect(alien_rect):
                        if kogel in self.speler.kogels:
                            self.speler.kogels.remove(kogel)
                        if alien in self.aliens:
                            self.aliens.remove(alien)
                            self.score += 10

            # Check voor game over
            for alien in self.aliens:
                if alien.y + ALIEN_GROOTTE >= self.speler.y:
                    self.game_over = True

    def teken(self):
        scherm.fill((0, 0, 0))  # Maak scherm zwart
        
        # Teken score
        font = pygame.font.Font(None, 36)
        score_text = font.render(f'Score: {self.score}', True, WIT)
        scherm.blit(score_text, (10, 10))

        # Teken speler
        self.speler.teken()

        # Teken aliens
        for alien in self.aliens:
            alien.teken()

        # Teken game over tekst
        if self.game_over:
            game_over_text = font.render('GAME OVER', True, ROOD)
            text_rect = game_over_text.get_rect(center=(SCHERM_BREEDTE/2, SCHERM_HOOGTE/2))
            scherm.blit(game_over_text, text_rect)

        pygame.display.flip()

def main():
    klok = pygame.time.Clock()
    spel = SpaceInvaders()
    
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == pygame.KEYDOWN and not spel.game_over:
                if event.key == pygame.K_SPACE:
                    spel.speler.schiet()

        if not spel.game_over:
            toetsen = pygame.key.get_pressed()
            if toetsen[pygame.K_LEFT]:
                spel.speler.beweeg('links')
            if toetsen[pygame.K_RIGHT]:
                spel.speler.beweeg('rechts')

        spel.update()
        spel.teken()
        klok.tick(60)

if __name__ == '__main__':
    main() 