class Player {
    constructor(canvasWidth, canvasHeight) {
        this.width = 50;
        this.height = 30;
        this.x = (canvasWidth - this.width) / 2;
        this.y = canvasHeight - this.height - 10;
        this.speed = 5;
        this.bullets = [];
    }

    move(left) {
        if (left && this.x > 0) {
            this.x -= this.speed;
        } else if (!left && this.x < canvas.width - this.width) {
            this.x += this.speed;
        }
    }

    shoot() {
        const bullet = new Bullet(this.x + this.width / 2, this.y);
        this.bullets.push(bullet);
    }

    update() {
        this.bullets.forEach(bullet => bullet.update());
        this.bullets = this.bullets.filter(bullet => bullet.y > 0);
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 7;
        this.radius = 5;
    }

    update() {
        this.y -= this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Alien {
    constructor(x, y) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.speed = 1;
    }

    move() {
        this.x += this.speed;
        if (this.x + this.width > canvas.width || this.x < 0) {
            this.speed *= -1;
            this.y += this.height;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(this.canvas.width, this.canvas.height);
        this.aliens = [];
        this.score = 0;
        this.gameOver = false;
        this.init();
    }

    init() {
        for (let i = 0; i < 5; i++) {
            this.aliens.push(new Alien(i * 60, 30));
        }
        this.bindEvents();
        this.loop();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            if (e.code === 'ArrowLeft') this.player.move(true);
            if (e.code === 'ArrowRight') this.player.move(false);
            if (e.code === 'Space') this.player.shoot();
        });
    }

    update() {
        this.player.update();
        this.aliens.forEach(alien => {
            alien.move();
            if (this.checkCollision(alien)) {
                this.gameOver = true;
            }
        });
    }

    checkCollision(alien) {
        return this.player.bullets.some(bullet => {
            return bullet.x > alien.x && bullet.x < alien.x + alien.width &&
                   bullet.y > alien.y && bullet.y < alien.y + alien.height;
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.ctx);
        this.aliens.forEach(alien => alien.draw(this.ctx));
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
        if (this.gameOver) {
            this.ctx.fillText('Game Over', this.canvas.width / 2 - 30, this.canvas.height / 2);
        }
    }

    loop() {
        if (!this.gameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.loop());
        }
    }
}

window.onload = () => {
    new Game();
};