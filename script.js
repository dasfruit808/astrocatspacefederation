// --- Constants ---
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 22;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const ALIEN_CONFIG = {
  rows: 4,
  cols: 7,
  width: 24,
  height: 18,
  padding: 42,
  yStart: 62,
  speed: 2,
  fireRate: 0.45,
  bulletSpeed: 5,
};
const PARTICLE_COUNT = 28;

// --- Canvas and Sounds ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let assets = {}; // asset images + sounds

function loadAssets(callback) {
  let loaded = 0;
  const needLoad = [
    {name:'player',src:'assets/player.png'},
    {name:'alien',src:'assets/alien.png'},
    {name:'alien2',src:'assets/alien2.png'},
    {name:'bullet',src:'assets/bullet.png'},
    {name:'abullet',src:'assets/abullet.png'},
    {name:'explosion',src:'assets/explosion.png'}
  ];
  const allAudios = [
    {name:'shoot',src:'assets/shoot.wav'},
    {name:'explosion',src:'assets/explosion.wav'},
    {name:'gameover',src:'assets/gameover.wav'}
  ];

  needLoad.forEach(res => {
    let img = new Image();
    img.src = res.src;
    img.onload = img.onerror = () => { assets[res.name]=img; loaded++; if(loaded===needLoad.length+allAudios.length) callback();}
    img.crossOrigin = 'anonymous';
  });
  allAudios.forEach(res => {
    let audio = new Audio(res.src); audio.volume = 0.18;
    audio.oncanplaythrough = audio.onerror = () => { assets[res.name]=audio; loaded++; if(loaded===needLoad.length+allAudios.length) callback();}
  });
}

// --- Game State ---
let keys = {};
let player, bullets, aliens, abullets, particles, score, lives, gameOver, restartHeld;
let frame = 0;

// --- Entities ---
function resetGame() {
  player = {x:40, y:CANVAS_HEIGHT-64, w:PLAYER_WIDTH, h:PLAYER_HEIGHT, vx:0};
  bullets = [];
  abullets = [];
  particles = [];
  aliens = [];
  score = 0;
  lives = 3;
  gameOver = false;
  restartHeld = false;
  spawnAliens();
}

function spawnAliens() {
  aliens = [];
  for(let r=0;r<ALIEN_CONFIG.rows;r++)
    for(let c=0;c<ALIEN_CONFIG.cols;c++) {
      let t = r%2;
      aliens.push({
        x:CANVAS_WIDTH+c*ALIEN_CONFIG.padding+20,
        y:ALIEN_CONFIG.yStart+r*40+8,
        w:ALIEN_CONFIG.width,
        h:ALIEN_CONFIG.height,
        vx:-ALIEN_CONFIG.speed*(1+(score/1000)),
        alive:true,
        type:t,
        fireDelay:Math.random()*50+30
      });
    }
}

// --- Drawing ---
function draw() {
  // BG
  ctx.fillStyle = '#191f33';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Starfield
  for(let i=0;i<40;i++) {
    ctx.fillStyle = '#eecb5c22';
    ctx.fillRect((i*i*52+frame*2)%canvas.width, (i*i*31+frame*3)%canvas.height, 2, 2);
  }
  // Score, Lives
  ctx.fillStyle = '#fefefe';
  ctx.font = '19px monospace';
  ctx.fillText('SCORE '+score, 16, 33);
  ctx.fillText('LIVES '+lives, CANVAS_WIDTH-124, 33);

  // Player
  if(!gameOver) ctx.drawImage(assets.player, player.x, player.y, player.w, player.h);

  // Bullets
  bullets.forEach(b=>ctx.drawImage(assets.bullet, b.x, b.y, b.w, b.h));
  abullets.forEach(ab=>ctx.drawImage(assets.abullet, ab.x, ab.y, ab.w, ab.h));

  // Aliens
  aliens.forEach(a=>a.alive && ctx.drawImage(a.type ? assets.alien2 : assets.alien, a.x, a.y, a.w, a.h));

  // Explosions (particles)
  particles.forEach(p=>{
    ctx.save();
    ctx.globalAlpha = p.life/14;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,7);
    ctx.fill();
    ctx.restore();
  });

  // Game Over
  if(gameOver) {
    ctx.globalAlpha=0.75;
    ctx.fillStyle='#222f';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha=1;
    ctx.font='bold 42px monospace';
    ctx.fillStyle='#e74c3c';
    ctx.fillText('GAME OVER', 92, 248);
    ctx.font='21px monospace';
    ctx.fillStyle='#fefefe';
    ctx.fillText('Tap/Ctrl/Space to Restart', 60, 300);
    ctx.font='bold 29px monospace';
    ctx.fillStyle='#eecb5c';
    ctx.fillText('Score: '+score, 120, 354);
  }
}

// --- Update ---
function update() {
  if(gameOver) {
    if(keys.space || keys.Enter || keys.restart) {
      if(!restartHeld) { assets.gameover.currentTime=0; assets.gameover.play(); resetGame(); }
      restartHeld=true;
    } else restartHeld=false;
    return;
  }
  frame++;
  // Player movement
  let mobileSpeed = 0;
  if(keys.ArrowLeft||keys.left) mobileSpeed -= PLAYER_SPEED;
  if(keys.ArrowRight||keys.right) mobileSpeed += PLAYER_SPEED;

  player.x += mobileSpeed;
  player.x = Math.max(2, Math.min(CANVAS_WIDTH-player.w-2, player.x));

  // Shoot
  if((keys.space||keys.shoot)&&!player.shootHeld) {
    bullets.push({x:player.x+PLAYER_WIDTH/2-5, y:player.y-8, w:7, h:15, vy:-BULLET_SPEED});
    player.shootHeld = true;
    assets.shoot.currentTime=0; assets.shoot.play();
  }
  if(!(keys.space||keys.shoot)) player.shootHeld=false;

  // Bullets movement
  bullets.forEach(b=>b.y+=b.vy);
  bullets = bullets.filter(b=>b.y>-40);

  // Alien Bullets
  abullets.forEach(ab=>ab.y+=ab.vy);
  abullets = abullets.filter(ab=>ab.y<CANVAS_HEIGHT+50);

  // Aliens movement and random shooting
  aliens.forEach(a=>{
    if(!a.alive) return;
    a.x += a.vx;
    if(a.x<8) a.alive=false;
    // Random shooting
    a.fireDelay--;
    if(a.fireDelay<=0 && Math.random() < ALIEN_CONFIG.fireRate/60) {
      abullets.push({x:a.x+ALIEN_CONFIG.width/2-3, y:a.y+ALIEN_CONFIG.height+2, w:7, h:15, vy:ALIEN_CONFIG.bulletSpeed});
      a.fireDelay = Math.random()*80+25;
    }
  });

  // Bullet / Alien collision
  bullets.forEach(b=>{
    aliens.forEach(a=>{
      if(a.alive && collides(b,a)) {
        score+=100;
        a.alive=false;
        addExplosion(a.x+a.w/2, a.y+a.h/2, '#eecb5c');
        assets.explosion.currentTime=0; assets.explosion.play();
        b.y = -999;
      }
    });
  });

  // Alien bullet / player collision
  abullets.forEach(ab=>{
    if(collides(player, ab)) {
      lives--;
      addExplosion(player.x+player.w/2, player.y+player.h/2, '#e74c3c');
      assets.explosion.currentTime=0; assets.explosion.play();
      ab.y = CANVAS_HEIGHT+999;
      if(lives<=0) {
        gameOver=true;
        assets.gameover.currentTime=0; assets.gameover.play();
      }
    }
  });

  // Remove dead aliens
  aliens = aliens.filter(a=>a.alive && a.x>-ALIEN_CONFIG.width);

  // New wave if none left
  if(aliens.length === 0) spawnAliens();

  // Particles (explosions)
  particles.forEach(p=>{
    p.x+=p.vx;
    p.y+=p.vy;
    p.life--;
  });
  particles = particles.filter(p=>p.life>0);
}

// --- Utility ---
function collides(a,b) {
  return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y;
}

function addExplosion(x,y,col) {
  for(let i=0;i<PARTICLE_COUNT;i++)
    particles.push({
      x:x, y:y,
      vx:(Math.random()-0.5)*5,
      vy:(Math.random()-0.5)*5,
      r:Math.random()*4+2,
      color:col,
      life:14+Math.random()*8
    });
}

// --- Input ---
window.addEventListener('keydown', e=>{
  keys[e.code]=true;
  if(e.code==='Enter') keys.Enter=true;
  if(e.code==='Space') keys.space=true;
  if(e.code==='ArrowLeft') keys.ArrowLeft=true;
  if(e.code==='ArrowRight') keys.ArrowRight=true;
});
window.addEventListener('keyup', e=>{
  keys[e.code]=false;
  if(e.code==='Enter') keys.Enter=false;
  if(e.code==='Space') keys.space=false;
  if(e.code==='ArrowLeft') keys.ArrowLeft=false;
  if(e.code==='ArrowRight') keys.ArrowRight=false;
});

window.addEventListener('touchstart', e=>{
  for(let t of e.touches) {
    if(t.target.id==='left-btn') keys.left=true;
    if(t.target.id==='right-btn') keys.right=true;
    if(t.target.id==='shoot-btn') keys.shoot=true;
  }
}, {passive:true});
window.addEventListener('touchend', e=>{
  keys.left=false; keys.right=false; keys.shoot=false;
}, {passive:true});

// --- Mobile Buttons ---
document.getElementById('left-btn').addEventListener('touchstart', ()=>keys.left=true);
document.getElementById('left-btn').addEventListener('touchend', ()=>keys.left=false);
document.getElementById('right-btn').addEventListener('touchstart', ()=>keys.right=true);
document.getElementById('right-btn').addEventListener('touchend', ()=>keys.right=false);
document.getElementById('shoot-btn').addEventListener('touchstart', ()=>keys.shoot=true);
document.getElementById('shoot-btn').addEventListener('touchend', ()=>keys.shoot=false);

// --- Main Loop ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// --- Start ---
loadAssets(()=>{
  resetGame();
  loop();
});
