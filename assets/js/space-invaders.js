(() => {
    const canvas = document.getElementById('space-invaders-canvas');
    const ctx = canvas?.getContext('2d');
    const scoreElement = document.getElementById('score');
    const statusElement = document.getElementById('status');
    const yearElement = document.getElementById('year');

    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }

    if (!canvas || !ctx || !scoreElement || !statusElement) {
        console.warn('Space Invaders elementen niet gevonden.');
        return;
    }

    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;

    const COLORS = {
        background: '#050714',
        player: '#7dffb7',
        bullet: '#7dffb7',
        alien: '#ff7e79',
        alienAccent: '#ffb199',
        text: '#ffffff',
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 48;
            this.height = 42;
            this.x = (GAME_WIDTH - this.width) / 2;
            this.y = GAME_HEIGHT - this.height - 20;
            this.speed = 360; // pixels per seconde
            this.fireCooldown = 0;
            this.fireRate = 0.25; // seconden
            this.maxBullets = 3;
        }

        update(delta) {
            if (this.game.controls.left) {
                this.x -= this.speed * delta;
            }
            if (this.game.controls.right) {
                this.x += this.speed * delta;
            }

            this.x = clamp(this.x, 0, GAME_WIDTH - this.width);

            if (this.fireCooldown > 0) {
                this.fireCooldown -= delta;
            }

            if (this.game.controls.shoot) {
                this.tryShoot();
            }
        }

        tryShoot() {
            if (this.fireCooldown > 0) return;
            if (this.game.bullets.length >= this.maxBullets) return;

            const bulletX = this.x + this.width / 2 - 3;
            const bulletY = this.y - 12;
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY));
            this.fireCooldown = this.fireRate;
        }

        draw(context) {
            context.save();
            context.fillStyle = COLORS.player;
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y);
            context.lineTo(this.x, this.y + this.height);
            context.lineTo(this.x + this.width, this.y + this.height);
            context.closePath();
            context.fill();

            // cabine
            context.fillStyle = '#2b3045';
            context.beginPath();
            context.moveTo(this.x + this.width / 2, this.y + this.height * 0.35);
            context.lineTo(this.x + this.width * 0.35, this.y + this.height);
            context.lineTo(this.x + this.width * 0.65, this.y + this.height);
            context.closePath();
            context.fill();
            context.restore();
        }
    }

    class Bullet {
        constructor(game, x, y) {
            this.game = game;
            this.width = 6;
            this.height = 16;
            this.x = x;
            this.y = y;
            this.speed = 540;
        }

        update(delta) {
            this.y -= this.speed * delta;
        }

        get isOffScreen() {
            return this.y + this.height < 0;
        }

        draw(context) {
            context.fillStyle = COLORS.bullet;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    class Alien {
        constructor(game, x, y) {
            this.game = game;
            this.width = 44;
            this.height = 32;
            this.x = x;
            this.y = y;
        }

        draw(context) {
            context.save();
            context.fillStyle = COLORS.alien;
            context.fillRect(this.x + 6, this.y, this.width - 12, this.height - 6);

            // ogen
            context.fillStyle = '#050714';
            context.fillRect(this.x + 12, this.y + 8, 6, 6);
            context.fillRect(this.x + this.width - 18, this.y + 8, 6, 6);

            // armen en poten
            context.fillStyle = COLORS.alienAccent;
            context.fillRect(this.x, this.y + 10, 8, 10);
            context.fillRect(this.x + this.width - 8, this.y + 10, 8, 10);
            context.fillRect(this.x + 10, this.y + this.height - 6, 8, 6);
            context.fillRect(this.x + this.width - 18, this.y + this.height - 6, 8, 6);
            context.restore();
        }

        get bounds() {
            return {
                left: this.x,
                right: this.x + this.width,
                top: this.y,
                bottom: this.y + this.height,
            };
        }
    }

    class Game {
        constructor(context) {
            this.ctx = context;
            this.controls = {
                left: false,
                right: false,
                shoot: false,
            };
            this.baseAlienSpeed = 38;
            this.alienSpeed = this.baseAlienSpeed;
            this.alienDirection = 1;
            this.alienDropDistance = 28;
            this.lastTime = performance.now();
            this.maxDelta = 0.05;
            this.stars = this.createStarfield(55);
            this.reset();
            this.loop = this.loop.bind(this);
            requestAnimationFrame(this.loop);
        }

        reset() {
            this.player = new Player(this);
            this.bullets = [];
            this.aliens = this.createAlienFormation();
            this.initialAlienCount = this.aliens.length;
            this.alienDirection = 1;
            this.alienSpeed = this.baseAlienSpeed;
            this.score = 0;
            this.gameOver = false;
            this.player.fireCooldown = 0;
            this.lastTime = performance.now();
            this.stars = this.createStarfield(this.stars?.length || 55);
            this.updateScoreboard();
            this.setStatus('Gebruik ← → om te bewegen en spatie of ⨀ om te schieten.');
        }

        createStarfield(amount) {
            return Array.from({ length: amount }, () => ({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                size: Math.random() * 1.8 + 0.4,
                alpha: 0.35 + Math.random() * 0.45,
                speed: 12 + Math.random() * 18,
            }));
        }

        createAlienFormation() {
            const formation = [];
            const rows = 5;
            const cols = 11;
            const horizontalSpacing = 14;
            const verticalSpacing = 16;
            const startX = 80;
            const startY = 70;

            for (let row = 0; row < rows; row += 1) {
                for (let col = 0; col < cols; col += 1) {
                    const x = startX + col * (horizontalSpacing + 44);
                    const y = startY + row * (verticalSpacing + 32);
                    formation.push(new Alien(this, x, y));
                }
            }

            return formation;
        }

        loop(currentTime) {
            const delta = Math.min((currentTime - this.lastTime) / 1000, this.maxDelta);
            this.lastTime = currentTime;

            this.update(delta);
            this.draw();

            requestAnimationFrame(this.loop);
        }

        update(delta) {
            if (this.gameOver) {
                return;
            }

            this.player.update(delta);

            this.bullets = this.bullets.filter((bullet) => {
                bullet.update(delta);
                return !bullet.isOffScreen;
            });

            this.updateStarfield(delta);

            let shouldDrop = false;
            const leftBoundary = 20;
            const rightBoundary = GAME_WIDTH - 20;

            for (const alien of this.aliens) {
                alien.x += this.alienDirection * this.alienSpeed * delta;
                if (alien.x <= leftBoundary || alien.x + alien.width >= rightBoundary) {
                    shouldDrop = true;
                }
            }

            if (shouldDrop) {
                this.alienDirection *= -1;
                for (const alien of this.aliens) {
                    alien.y += this.alienDropDistance;
                }
            }

            this.handleCollisions();
            this.updateScoreboard();

            for (const alien of this.aliens) {
                if (alien.y + alien.height >= this.player.y) {
                    this.finishGame(false);
                    break;
                }
            }

            if (!this.gameOver && this.aliens.length === 0) {
                this.finishGame(true);
            }
        }

        handleCollisions() {
            for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
                const bullet = this.bullets[i];
                let bulletRemoved = false;

                for (let j = this.aliens.length - 1; j >= 0; j -= 1) {
                    const alien = this.aliens[j];
                    if (this.intersects(bullet, alien)) {
                        this.bullets.splice(i, 1);
                        this.aliens.splice(j, 1);
                        this.score += 10;
                        this.alienSpeed = this.baseAlienSpeed + (this.initialAlienCount - this.aliens.length) * 2.4;
                        bulletRemoved = true;
                        break;
                    }
                }

                if (bulletRemoved) {
                    continue;
                }
            }
        }

        intersects(rectA, rectB) {
            return (
                rectA.x < rectB.x + rectB.width &&
                rectA.x + rectA.width > rectB.x &&
                rectA.y < rectB.y + rectB.height &&
                rectA.y + rectA.height > rectB.y
            );
        }

        finishGame(victory) {
            this.gameOver = true;
            const message = victory
                ? 'Gewonnen! Alle aliens zijn verslagen.'
                : 'Game over! De aliens hebben de aarde bereikt.';
            const hint = ' Druk op Enter of tik op ⨀ om opnieuw te starten.';
            this.setStatus(message + hint);
        }

        updateScoreboard() {
            scoreElement.textContent = `Score: ${this.score}`;
        }

        setStatus(message) {
            statusElement.textContent = message;
        }

        updateStarfield(delta) {
            if (!this.stars) {
                return;
            }
            for (const star of this.stars) {
                star.y += star.speed * delta;
                if (star.y > GAME_HEIGHT) {
                    star.y -= GAME_HEIGHT;
                    star.x = Math.random() * GAME_WIDTH;
                }
            }
        }

        draw() {
            this.ctx.fillStyle = COLORS.background;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            this.drawBackdrop();
            this.player.draw(this.ctx);

            for (const bullet of this.bullets) {
                bullet.draw(this.ctx);
            }

            for (const alien of this.aliens) {
                alien.draw(this.ctx);
            }

            if (this.gameOver) {
                this.drawOverlay();
            }
        }

        drawBackdrop() {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
            gradient.addColorStop(0, 'rgba(14, 19, 45, 0.95)');
            gradient.addColorStop(1, 'rgba(3, 5, 18, 0.98)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            if (!this.stars) {
                return;
            }

            this.ctx.save();
            for (const star of this.stars) {
                this.ctx.globalAlpha = star.alpha;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            }
            this.ctx.restore();
        }

        drawOverlay() {
            this.ctx.save();
            this.ctx.fillStyle = 'rgba(5, 7, 20, 0.75)';
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.fillStyle = COLORS.text;
            this.ctx.font = 'bold 42px "Segoe UI", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SPACE INVADERS', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            this.ctx.font = '24px "Segoe UI", sans-serif';
            this.ctx.fillText('Druk op Enter of tik op ⨀ om opnieuw te starten', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
            this.ctx.restore();
        }
    }

    const game = new Game(ctx);

    function restartIfNeeded() {
        if (!game.gameOver) return;
        game.reset();
    }

    document.addEventListener('keydown', (event) => {
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
            game.controls.left = true;
            event.preventDefault();
        }
        if (event.code === 'ArrowRight' || event.code === 'KeyD') {
            game.controls.right = true;
            event.preventDefault();
        }
        if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
            game.controls.shoot = true;
            event.preventDefault();
            if (game.gameOver) {
                restartIfNeeded();
            }
        }
        if (event.code === 'Enter') {
            event.preventDefault();
            restartIfNeeded();
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
            game.controls.left = false;
        }
        if (event.code === 'ArrowRight' || event.code === 'KeyD') {
            game.controls.right = false;
        }
        if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
            game.controls.shoot = false;
        }
    });

    const touchControls = document.querySelectorAll('.touch-controls button');

    touchControls.forEach((button) => {
        const action = button.dataset.action;
        const setActive = (active) => {
            button.dataset.active = active ? 'true' : 'false';
            switch (action) {
                case 'left':
                    game.controls.left = active;
                    break;
                case 'right':
                    game.controls.right = active;
                    break;
                case 'shoot':
                    if (active && game.gameOver) {
                        restartIfNeeded();
                    }
                    game.controls.shoot = active;
                    break;
                default:
                    break;
            }
        };

        const start = (event) => {
            event.preventDefault();
            setActive(true);
            button.setPointerCapture?.(event.pointerId);
        };

        const end = (event) => {
            setActive(false);
            button.releasePointerCapture?.(event.pointerId);
        };

        button.addEventListener('pointerdown', start);
        button.addEventListener('pointerup', end);
        button.addEventListener('pointercancel', end);
        button.addEventListener('pointerleave', () => setActive(false));
    });

    window.addEventListener('blur', () => {
        game.controls.left = false;
        game.controls.right = false;
        game.controls.shoot = false;
    });
})();
