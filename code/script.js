// Simple Rialo Runner (Dino-like) in vanilla JS
// Controls: Space / ArrowUp to jump, R to restart, Touch to jump

(function () {
  const gameEl = document.querySelector('.game');
  const playerEl = document.getElementById('player');
  const obstaclesEl = document.getElementById('obstacles');
  const scoreEl = document.getElementById('score');
  const messageEl = document.getElementById('message');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');

  // Game state
  let isRunning = false;
  let isGameOver = false;
  let lastTime = 0;
  let speed = 240; // px per second for obstacle movement (slower start)
  let spawnInterval = 1200; // ms between spawns (base)
  let spawnTimer = 0;
  let score = 0;
  const spacingMultiplier = 1.7; // increase obstacle spacing ~1.7x for more reaction room

  // Player physics
  const groundY = 6; // matches CSS .ground height
  const gravity = 2200; // px/s^2 (base upward gravity)
  const fallMultiplier = 2.6; // stronger gravity when falling for much faster drop
  const jumpVelocity = 820; // px/s
  let playerY = 0; // vertical position (px) from ground
  let velocityY = 0; // px/s
  let isOnGround = true;

  // Touch handling
  let touchStartY = 0;
  let touchStartTime = 0;

  // Helpers
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function setPlayerBottom(px) {
    playerEl.style.bottom = `${px + groundY}px`;
  }

  function startGame() {
    // Reset state
    isRunning = true;
    isGameOver = false;
    score = 0;
    speed = 240; // slower initial speed
    spawnInterval = 1200;
    spawnTimer = 0;
    lastTime = performance.now();
    playerY = 0;
    velocityY = 0;
    isOnGround = true;
    setPlayerBottom(playerY);
    scoreEl.textContent = '00000';
    messageEl.classList.add('hidden');
    if (startBtn) startBtn.classList.add('hidden');
    if (restartBtn) restartBtn.classList.add('hidden');
    obstaclesEl.innerHTML = '';
    requestAnimationFrame(loop);
  }

  function endGame() {
    isRunning = false;
    isGameOver = true;
    const finalScore = formatScore(score);
    messageEl.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Game Over</div><div style="margin-bottom:6px;">Score: ${finalScore}</div>`;
    messageEl.classList.add('hidden');
    if (restartBtn) restartBtn.classList.remove('hidden');
  }

  function formatScore(n) {
    return String(Math.floor(n)).padStart(5, '0');
  }

  function jump() {
    if (!isRunning) {
      startGame();
      return;
    }
    if (isGameOver) return;
    if (isOnGround) {
      velocityY = jumpVelocity;
      isOnGround = false;
    }
  }

  function spawnObstacle() {
    const img = document.createElement('img');
    img.src = '../picture/pic1.png';
    img.alt = 'Obstacle';
    img.className = 'obstacle';
    // randomize size with a lower maximum scale
    const baseH = 48;
    const h = baseH * (0.6 + Math.random() * 0.6); // 0.6x to 1.2x
    img.style.height = `${h}px`;
    img.style.right = '-100px';
    obstaclesEl.appendChild(img);
    return img;
  }

  function getRect(el) {
    return el.getBoundingClientRect();
  }

  function checkCollision(a, b) {
    const ra = getRect(a);
    const rb = getRect(b);
    return !(ra.right < rb.left || ra.left > rb.right || ra.bottom < rb.top || ra.top > rb.bottom);
  }

  function updatePlayer(dt) {
    // Apply stronger gravity when falling for snappier descent
    const g = velocityY < 0 ? gravity * fallMultiplier : gravity;
    velocityY -= g * dt;
    playerY += velocityY * dt;
    if (playerY <= 0) {
      playerY = 0;
      velocityY = 0;
      isOnGround = true;
    }
    setPlayerBottom(playerY);
  }

  function updateObstacles(dt) {
    const list = Array.from(obstaclesEl.querySelectorAll('.obstacle'));
    for (const ob of list) {
      const rightNow = parseFloat(ob.style.right || '0');
      ob.style.right = `${rightNow + speed * dt}px`;
      // remove if passed left side
      const obRect = ob.getBoundingClientRect();
      if (obRect.right < gameEl.getBoundingClientRect().left - 10) {
        ob.remove();
      }
      if (checkCollision(playerEl, ob)) {
        endGame();
      }
    }
  }

  function updateDifficulty(dt) {
    // Gradually increase horizontal speed (gentler ramp)
    speed += 5 * dt * 10;
    // Base target interval scales down with score, then expanded by spacing multiplier
    const baseTargetInterval = 1200 - score * 2.2; // ms
    const spacedTarget = baseTargetInterval * spacingMultiplier;
    // Enforce a minimum physical distance between obstacles based on current speed
    const desiredDistancePx = 320 * spacingMultiplier; // base pixel gap
    const minIntervalByDistance = (desiredDistancePx / Math.max(140, speed)) * 1000; // ms
    const target = Math.max(spacedTarget, minIntervalByDistance);
    spawnInterval = clamp(target, 380 * spacingMultiplier, 1300 * spacingMultiplier);
  }

  function loop(now) {
    if (!isRunning) return;
    const dt = Math.min(0.032, (now - lastTime) / 1000); // cap dt for stability
    lastTime = now;

    // Update systems
    updatePlayer(dt);
    updateObstacles(dt);
    updateDifficulty(dt);

    // Score
    score += dt * 100; // points per second
    scoreEl.textContent = formatScore(score);

    // Spawning
    spawnTimer += dt * 1000;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
    }

    if (!isGameOver) requestAnimationFrame(loop);
  }

  // Keyboard input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      jump();
    } else if (e.code === 'KeyR') {
      if (isGameOver || !isRunning) startGame();
    }
  });

  // Button controls
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (!isRunning || isGameOver) {
        startGame();
      } else {
        // If running, a Start click just triggers a jump
        jump();
      }
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startGame();
    });
  }

  // Initial UI state
  if (startBtn) startBtn.classList.remove('hidden');
  if (restartBtn) restartBtn.classList.add('hidden');
  if (messageEl) messageEl.classList.add('hidden');

  // Touch input
  gameEl.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length === 1) {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }
  }, { passive: false });

  gameEl.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const touchDuration = Date.now() - touchStartTime;
      const touchDistance = Math.abs(touch.clientY - touchStartY);
      
      // Simple tap detection (short duration, small movement)
      if (touchDuration < 300 && touchDistance < 20) {
        jump();
      }
    }
  }, { passive: false });

  // Mouse input (for desktop)
  gameEl.addEventListener('click', (e) => {
    e.preventDefault();
    jump();
  });

  // Resize handling keeps ground-collision consistent visually
  window.addEventListener('resize', () => {
    setPlayerBottom(playerY);
  });

  // Prevent context menu on long press
  gameEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Prevent scrolling on mobile
  document.addEventListener('touchmove', (e) => {
    if (e.target === gameEl) {
      e.preventDefault();
    }
  }, { passive: false });

})();
