'use strict';

(function () {
    /* ─────────────────────────────────────────
       UTILIDADES
    ───────────────────────────────────────── */
    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&!?/\\|<>█▓▒░';
    const rand    = arr => arr[Math.floor(Math.random() * arr.length)];
    const wait    = ms  => new Promise(r => setTimeout(r, ms));
    const qs      = s   => document.querySelector(s);
    const qsa     = s   => document.querySelectorAll(s);

    /* ─────────────────────────────────────────
       1. PARTÍCULAS DE FONDO
    ───────────────────────────────────────── */
    (function initParticulas() {
        const canvas = qs('#canvas-particulas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let W, H, particulas = [];
        const NUM = 60;

        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }

        function crearParticula() {
            return {
                x:   Math.random() * W,
                y:   Math.random() * H,
                vy:  -(0.2 + Math.random() * 0.4),
                vx:  (Math.random() - 0.5) * 0.15,
                r:   Math.random() * 1.2 + 0.3,
                a:   Math.random(),
                da:  (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
            };
        }

        function getCyan() {
            const s = getComputedStyle(document.body);
            return s.getPropertyValue('--neon-cyan').trim() || '#00f3ff';
        }

        function loop() {
            ctx.clearRect(0, 0, W, H);
            const cyan = getCyan();

            particulas.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.a += p.da;
                if (p.a < 0 || p.a > 1) p.da *= -1;
                if (p.y < -10) particulas[i] = { ...crearParticula(), y: H + 5 };

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = cyan;
                ctx.globalAlpha = p.a * 0.5;
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            requestAnimationFrame(loop);
        }

        resize();
        window.addEventListener('resize', resize);
        for (let i = 0; i < NUM; i++) particulas.push(crearParticula());
        loop();
    })();

    /* ─────────────────────────────────────────
       2. EFECTO GLITCH
       El texto se escribe/borra SOLO dentro del elemento.
       El bloque padre ya tiene min-height fijo en CSS,
       así el layout nunca se mueve.
    ───────────────────────────────────────── */
    async function aplicarEfectoGlitch(selector, conBorrado = true) {
        const el = qs(selector);
        if (!el) return;
        const finalText = el.textContent.trim();

        // Vaciar el nodo de texto pero dejar el pseudo-elemento ::after intacto
        // usando un nodo de texto hijo en lugar de textContent directamente,
        // para no remover otros nodos hijos si los hubiera.
        function setText(t) {
            // Buscar o crear el nodo de texto
            let nodo = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
            if (!nodo) {
                nodo = document.createTextNode('');
                el.insertBefore(nodo, el.firstChild);
            }
            nodo.nodeValue = t;
        }

        // Estado inicial: texto vacío, espacio reservado por CSS min-height
        setText('');

        async function typeWithGlitch() {
            setText('');
            for (let i = 0; i < finalText.length; i++) {
                for (let g = 0; g < 2; g++) {
                    setText(finalText.slice(0, i) + rand(glitchChars));
                    await wait(30);
                }
                setText(finalText.slice(0, i + 1));
                await wait(finalText[i] === ' ' ? 70 : 48);
            }
            await wait(350);
            await triggerRevealGlitch();
        }

        async function triggerRevealGlitch() {
            for (let round = 0; round < 4; round++) {
                setText([...finalText].map(c =>
                    c === ' ' ? ' ' : (Math.random() < 0.35 ? rand(glitchChars) : c)
                ).join(''));
                el.style.textShadow = `2px 0 6px var(--neon-magenta), -2px 0 6px var(--neon-cyan), 0 0 20px var(--neon-cyan)`;
                await wait(55);
                setText(finalText);
                el.style.textShadow = '';
                await wait(70);
            }
        }

        async function deleteText() {
            let t = finalText;
            while (t.length > 0) {
                t = t.slice(0, -1);
                setText(t + (Math.random() < 0.4 ? rand(glitchChars) : ''));
                await wait(35);
                setText(t);
                await wait(50);
            }
        }

        async function ambientGlitch() {
            while (true) {
                await wait(5000 + Math.random() * 7000);
                const iters = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < iters; i++) {
                    setText([...finalText].map(c =>
                        c === ' ' ? ' ' : (Math.random() < 0.2 ? rand(glitchChars) : c)
                    ).join(''));
                    el.style.transform = `translateX(${(Math.random() - 0.5) * 4}px)`;
                    el.style.textShadow = `${(Math.random() - 0.5) * 5}px 0 var(--neon-magenta), ${(Math.random() - 0.5) * 5}px 0 var(--neon-cyan)`;
                    await wait(45);
                    setText(finalText);
                    el.style.transform = '';
                    el.style.textShadow = '';
                    await wait(55);
                }
            }
        }

        if (conBorrado) {
            (async function loop() {
                while (true) {
                    await typeWithGlitch();
                    await wait(3000);
                    await deleteText();
                    await wait(400);
                }
            })();
        } else {
            typeWithGlitch().then(() => ambientGlitch());
        }
    }

    // Iniciar efectos de glitch
    aplicarEfectoGlitch('.titulo-texto', true);
    aplicarEfectoGlitch('#principal .titulo-cabecera', false);

    /* ─────────────────────────────────────────
       3. MENÚ MÓVIL
    ───────────────────────────────────────── */
    (function initMenu() {
        const botonMenu = qs('.boton-menu');
        if (!botonMenu) return;

        // Crear overlay dinámicamente
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);

        const menuDesplegable = qs('.menu-desplegable');
        if (menuDesplegable) menuDesplegable.setAttribute('aria-hidden', 'true');

        function abrirMenu() {
            document.body.classList.add('menu-abierto');
            overlay.style.display = 'block';
            requestAnimationFrame(() => { overlay.style.opacity = '1'; });
            botonMenu.setAttribute('aria-expanded', 'true');
            if (menuDesplegable) menuDesplegable.setAttribute('aria-hidden', 'false');

            // Animar líneas a X
            const lineas = botonMenu.querySelectorAll('.linea-menu');
            if (lineas[0]) { lineas[0].style.transform = 'translateY(5px) rotate(45deg)'; lineas[0].style.background = 'var(--neon-magenta)'; }
            if (lineas[1]) { lineas[1].style.opacity = '0'; lineas[1].style.transform = 'scaleX(0)'; }
            if (lineas[2]) { lineas[2].style.transform = 'translateY(-5px) rotate(-45deg)'; lineas[2].style.background = 'var(--neon-magenta)'; }
        }

        function cerrarMenu() {
            document.body.classList.remove('menu-abierto');
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = ''; }, 300);
            botonMenu.setAttribute('aria-expanded', 'false');
            if (menuDesplegable) menuDesplegable.setAttribute('aria-hidden', 'true');

            // Restaurar líneas
            const lineas = botonMenu.querySelectorAll('.linea-menu');
            lineas.forEach(l => { l.style.transform = ''; l.style.opacity = ''; l.style.background = ''; });
        }

        botonMenu.addEventListener('click', () => {
            document.body.classList.contains('menu-abierto') ? cerrarMenu() : abrirMenu();
        });

        overlay.addEventListener('click', cerrarMenu);

        qsa('.menu-item').forEach(enlace => {
            enlace.addEventListener('click', cerrarMenu);
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && document.body.classList.contains('menu-abierto')) cerrarMenu();
        });
    })();

    /* ─────────────────────────────────────────
       4. CAMBIO DE TEMA (3 temas cíclicos)
    ───────────────────────────────────────── */
    (function initTema() {
        const botonTema = qs('.boton-tema');
        if (!botonTema) return;

        const temas = [
            { clase: '',       label: 'SYS_COLOR', icon: '◐' },
            { clase: 'tema-2', label: 'MATRIX',    icon: '◑' },
            { clase: 'tema-3', label: 'CRIMSON',   icon: '●' },
        ];

        let temaActual = 0;

        const temaLabel = botonTema.querySelector('.tema-label');
        const temaIcon  = botonTema.querySelector('.tema-icon');

        function aplicarTema(idx) {
            // Efecto de destello
            document.body.classList.add('tema-transicion');

            setTimeout(() => {
                // Quitar todos los temas
                temas.forEach(t => { if (t.clase) document.body.classList.remove(t.clase); });

                // Aplicar el nuevo
                if (temas[idx].clase) document.body.classList.add(temas[idx].clase);

                // Actualizar UI del botón
                if (temaLabel) temaLabel.textContent = temas[idx].label;
                if (temaIcon)  temaIcon.textContent  = temas[idx].icon;

                document.body.classList.remove('tema-transicion');
            }, 100);
        }

        botonTema.addEventListener('click', () => {
            temaActual = (temaActual + 1) % temas.length;
            aplicarTema(temaActual);
        });
    })();

    /* ─────────────────────────────────────────
       5. ANIMACIONES EN SCROLL (Intersection Observer)
    ───────────────────────────────────────── */
    (function initScrollAnim() {
        const targets = qsa('.modulo-interno, .modulo-completo-problema, .bloque-contenido-problema, .solucion-banner');

        // Estilos iniciales
        targets.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(24px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });

        const obs = new IntersectionObserver((entries) => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, i * 80);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(el => obs.observe(el));
    })();

    /* ─────────────────────────────────────────
       6. GLITCH EN HOVER DE LOS STATS
    ───────────────────────────────────────── */
    (function initStatGlitch() {
        qsa('.modulo-stat-value').forEach(el => {
            const original = el.textContent;
            let timeout;

            el.parentElement.addEventListener('mouseenter', async () => {
                clearTimeout(timeout);
                for (let i = 0; i < 3; i++) {
                    el.textContent = [...original].map(c =>
                        Math.random() < 0.4 ? rand(glitchChars.slice(0, 36)) : c
                    ).join('');
                    await wait(50);
                    el.textContent = original;
                    await wait(40);
                }
            });
        });
    })();

})();