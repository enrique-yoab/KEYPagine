const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let stars = [];
let meteors = [];

// Paleta análoga-dividida: naranja dominante + ámbar análogo + cian acento
const NEON_COLORS = ['#ff6a00', '#ffb300', '#00e5ff'];

// ── Control de renderizado asíncrono ──
let lastTime = 0;
const TARGET_FPS = 60;
const FRAME_MS  = 1000 / TARGET_FPS;

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initSystem();
}

class Star {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.2 + 0.2;
        this.alpha = Math.random();
        this.dAlpha = (Math.random() * 0.012 + 0.003);
        this.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    }
    update(dt) {
        this.alpha += this.dAlpha * dt;
        if (this.alpha <= 0 || this.alpha >= 1) this.dAlpha *= -1;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2 + 1;
        const roll = Math.random();
        // 20% blanco, 25% cian acento, 30% ámbar análogo, 25% naranja dominante
        this.color = roll > 0.8 ? '#ffffff' : roll > 0.55 ? '#00e5ff' : roll > 0.25 ? '#ffb300' : '#ff6a00';
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Meteor {
    constructor() { this.spawn(); }
    spawn() {
        this.x = Math.random() * canvas.width * 0.6;
        this.y = Math.random() * canvas.height * 0.4;
        this.length = Math.random() * 100 + 60;
        this.speed = Math.random() * 5 + 4;
        this.alpha = 1;
        this.active = false;
        this.delay = (Math.random() * 400 + 150);
    }
    update(dt) {
        if (this.delay > 0) { this.delay -= dt; return; }
        if (!this.active) this.active = true;
        this.x += this.speed * dt;
        this.y += this.speed * 0.45 * dt;
        this.alpha -= 0.022 * dt;
        if (this.alpha <= 0 || this.x > canvas.width || this.y > canvas.height) this.spawn();
    }
    draw() {
        if (!this.active || this.alpha <= 0) return;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.length, this.y - this.length * 0.45);
        // Meteoros en ámbar dorado — análogo del naranja, distinto del canvas base
        grad.addColorStop(0, `rgba(255, 179, 0, ${this.alpha})`);
        grad.addColorStop(1, 'rgba(255, 106, 0, 0)');
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y - this.length * 0.45);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function initSystem() {
    particles = []; stars = []; meteors = [];
    const area = canvas.width * canvas.height;
    const particleCount = Math.min(Math.floor(area / 14000), 120);
    const starCount = Math.floor(area / 4000);
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    for (let i = 0; i < starCount; i++) stars.push(new Star());
    for (let i = 0; i < 3; i++) meteors.push(new Meteor());
}

function animate(timestamp) {
    requestAnimationFrame(animate);
    const elapsed = timestamp - lastTime;
    const dt = Math.min(elapsed, 100) / FRAME_MS;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => { s.update(dt); s.draw(); });
    meteors.forEach(m => { m.update(dt); m.draw(); });
    particles.forEach(p => { p.update(dt); p.draw(); });

    // ── Orquestación asíncrona de la conexión de red ──
    const D = 155;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < D) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 106, 0, ${(1 - d / D) * 0.3})`;
                ctx.lineWidth = 0.7;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
requestAnimationFrame(ts => { lastTime = ts; animate(ts); });

// ── Animación de Texto Glitch ──
const textElement = document.getElementById('text-display');
const typingContainer = document.getElementById('typing-container');
const phrases = ["KEYpagine"];
const DECODE_CHARS = '█▓▒░▄▀■□▪▫◆◇○●0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&?<>[]{}|/\\^*+-=_~';

let phraseIndex = 0, charIndex = 0;
let isTyping = false, passiveGlitchTimer = null, isTitleVisible = true;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        isTitleVisible = entry.isIntersecting;
        if (isTitleVisible) {
            typingContainer.classList.remove('render-paused');
            schedulePassiveGlitch();
        } else {
            typingContainer.classList.add('render-paused');
            clearTimeout(passiveGlitchTimer);
        }
    });
}, { threshold: 0 });

if (typingContainer) observer.observe(typingContainer);

function render(text, glitchIndices = new Set()) {
    const existingSpans = textElement.children;
    const needed = text.length;
    while (textElement.childElementCount > needed) textElement.removeChild(textElement.lastChild);
    while (textElement.childElementCount < needed) textElement.appendChild(document.createElement('span'));

    for (let i = 0; i < needed; i++) {
        const span = existingSpans[i];
        span.textContent = text[i];
        if (glitchIndices.has(i)) span.className = 'glitch-char';
        else if (phrases[phraseIndex].startsWith('KEYpagine') && i < 3) span.className = 'resolved-char key-highlight';
        else span.className = 'resolved-char';
    }
}

function runPassiveGlitch() {
    if (isTyping || !isTitleVisible) return;
    const currentText = phrases[phraseIndex].substring(0, charIndex);
    if (!currentText) return;

    const glitchDurationMs = Math.random() > 0.7 ? 300 : 120;
    const numberOfGlitchChars = Math.random() > 0.85 ? currentText.length : Math.min(currentText.length, Math.floor(Math.random() * 3) + 2);
    const glitchIndices = new Set();
    
    while (glitchIndices.size < numberOfGlitchChars) glitchIndices.add(Math.floor(Math.random() * currentText.length));

    const corruptText = currentText.split('');
    glitchIndices.forEach(idx => corruptText[idx] = DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)]);

    render(corruptText.join(''), glitchIndices);
    setTimeout(() => {
        if (!isTyping && isTitleVisible) render(currentText);
        schedulePassiveGlitch();
    }, glitchDurationMs);
}

function schedulePassiveGlitch() {
    clearTimeout(passiveGlitchTimer);
    if (isTitleVisible) passiveGlitchTimer = setTimeout(runPassiveGlitch, Math.random() * 1700 + 800);
}

function typeNext() {
    if (!isTitleVisible) return setTimeout(typeNext, 500);
    isTyping = true;
    clearTimeout(passiveGlitchTimer);

    const phrase = phrases[phraseIndex];
    if (charIndex < phrase.length) {
        let f = 0;
        const tick = setInterval(() => {
            f++;
            const textSoFar = phrase.substring(0, charIndex) + DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
            render(textSoFar, new Set([charIndex]));
            if (f >= 4) {
                clearInterval(tick);
                charIndex++;
                render(phrase.substring(0, charIndex));
                setTimeout(typeNext, Math.random() * 80 + 40);
            }
        }, 30);
    } else {
        isTyping = false;
        schedulePassiveGlitch();
        setTimeout(eraseNext, 6000);
    }
}

function eraseNext() {
    if (!isTitleVisible) return setTimeout(eraseNext, 500);
    isTyping = true;
    clearTimeout(passiveGlitchTimer);

    if (charIndex > 0) {
        const currentText = phrases[phraseIndex].substring(0, charIndex);
        let f = 0;
        const tick = setInterval(() => {
            f++;
            const textSoFar = currentText.substring(0, charIndex - 1) + DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
            render(textSoFar, new Set([charIndex - 1]));
            if (f >= 2) {
                clearInterval(tick);
                charIndex--;
                render(currentText.substring(0, charIndex));
                setTimeout(eraseNext, 30);
            }
        }, 25);
    } else {
        isTyping = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeNext, 800);
    }
}

setTimeout(typeNext, 500);

// ── Control de Navegación ──
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

if (hamburger && mobileMenu) {
    const toggleMenu = () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('open');
        mobileMenu.classList.toggle('open');
    };

    hamburger.addEventListener('click', toggleMenu);
    mobileMenu.querySelectorAll('a, .nav-cta-mobile').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('open');
            mobileMenu.classList.remove('open');
        });
    });
}

// ── Animación Interactiva para el Encabezado (Glitch por Toque/Click) ──
const headerLogo = document.querySelector('.neon-header .logo');

if (headerLogo) {
    const LOGO_TEXT = "KEYpagine";
    const LOGO_GLITCH_CHARS = '█▓▒░▄▀■□▪▫◆◇○●0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&?<>[]{}|/\\^*+-=_~';
    
    headerLogo.innerHTML = '';
    const logoSpans = [];
    
    // Inyección de nodos y protección del color base
    for (let i = 0; i < LOGO_TEXT.length; i++) {
        const span = document.createElement('span');
        span.textContent = LOGO_TEXT[i];
        
        if (i < 3) {
            // "KEY" en ámbar dorado — análogo del naranja, mayor jerarquía visual
            span.style.color = '#ffb300';
            span.style.textShadow = '0 0 4px #ffb300, 0 0 14px rgba(255, 179, 0, 0.7)';
        } else {
            // "pagine" en naranja dominante
            span.style.color = '#ff6a00';
            span.style.textShadow = '0 0 10px rgba(255, 106, 0, 0.45)';
        }
        
        headerLogo.appendChild(span);
        logoSpans.push(span);
    }

    // Feedback táctil: mostramos que es interactivo
    headerLogo.style.cursor = 'pointer';

    let isLogoGlitching = false;

    function triggerLogoGlitch() {
        // Bloqueo de concurrencia para evitar saturar el CPU si el usuario hace spam de clicks
        if (isLogoGlitching) return;
        isLogoGlitching = true;

        let frames = 0;
        const maxFrames = 8; // Duración de la distorsión (8 iteraciones)

        const glitchInterval = setInterval(() => {
            // 1. Restaurar todo a la normalidad en cada ciclo
            logoSpans.forEach((span, i) => {
                span.textContent = LOGO_TEXT[i];
                span.classList.remove('glitch-char');
            });

            // 2. Condición de salida: Si terminamos los frames, limpiamos y liberamos el bloqueo
            if (frames >= maxFrames) {
                clearInterval(glitchInterval);
                isLogoGlitching = false;
                return;
            }

            // 3. Corrupción aleatoria (1 a 3 caracteres)
            const numGlitch = Math.floor(Math.random() * 3) + 1;
            for (let k = 0; k < numGlitch; k++) {
                const idx = Math.floor(Math.random() * LOGO_TEXT.length);
                logoSpans[idx].textContent = LOGO_GLITCH_CHARS[Math.floor(Math.random() * LOGO_GLITCH_CHARS.length)];
                logoSpans[idx].classList.add('glitch-char');
            }

            frames++;
        }, 45); // Velocidad de la vibración (45ms por frame)
    }

    // Escucha unificada para ratón, lápiz y pantallas táctiles (Alto rendimiento)
    headerLogo.addEventListener('pointerdown', triggerLogoGlitch);
}

// ── Lógica del Slider de Proyectos ──
const track = document.getElementById('track');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const indicators = document.querySelectorAll('.indicator');

if (track && btnPrev && btnNext) {
    let currentIndex = 0;
    const totalCards = document.querySelectorAll('.step-card').length;

    function updateSlider() {
        // Mueve la pista basándose en el porcentaje
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Actualiza el estado de los botones
        btnPrev.disabled = currentIndex === 0;
        btnNext.disabled = currentIndex === totalCards - 1;

        // Actualiza los indicadores visuales
        indicators.forEach((ind, index) => {
            if (index === currentIndex) {
                ind.classList.add('active');
            } else {
                ind.classList.remove('active');
            }
        });
    }

    btnNext.addEventListener('click', () => {
        if (currentIndex < totalCards - 1) {
            currentIndex++;
            updateSlider();
        }
    });

    btnPrev.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
        }
    });

    // Inicialización del estado de los botones
    updateSlider();
}