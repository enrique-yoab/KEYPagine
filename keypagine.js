'use strict';

(function () {
    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#@$%&!?/\\|<>';
    const rand = arr => arr[Math.floor(Math.random() * arr.length)];
    const wait = ms => new Promise(r => setTimeout(r, ms));

    // ── FUNCIÓN REUTILIZABLE DE GLITCH ──
    async function aplicarEfectoGlitch(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        const finalText = el.textContent.trim();

        /* 1. TYPING con glitch */
        async function typeWithGlitch() {
            el.textContent = '';
            for (let i = 0; i < finalText.length; i++) {
                for (let g = 0; g < 3; g++) {
                    el.textContent = finalText.slice(0, i) + rand(glitchChars);
                    await wait(35);
                }
                el.textContent = finalText.slice(0, i + 1);
                await wait(finalText[i] === ' ' ? 80 : 55);
            }
            await wait(400);
            await triggerRevealGlitch();
        }

        /* 2. GLITCH de revelación final */
        async function triggerRevealGlitch() {
            for (let round = 0; round < 5; round++) {
                el.textContent = [...finalText].map(c =>
                    c === ' ' ? ' ' : (Math.random() < 0.4 ? rand(glitchChars) : c)
                ).join('');
                el.style.textShadow = `
                    2px 0 6px var(--neon-magenta),
                    -2px 0 6px var(--neon-cyan),
                    0 0 20px var(--neon-cyan)
                `;
                await wait(60);
                el.textContent = finalText;
                el.style.textShadow = '';
                await wait(80);
            }
        }

        /* 3. GLITCH periódico leve */
        async function ambientGlitch() {
            while (true) {
                await wait(4000 + Math.random() * 6000);
                const iterations = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < iterations; i++) {
                    el.textContent = [...finalText].map(c =>
                        c === ' ' ? ' ' : (Math.random() < 0.25 ? rand(glitchChars) : c)
                    ).join('');
                    el.style.transform = `translateX(${Math.random() < 0.5 ? '-' : ''}${Math.random() * 3}px)`;
                    el.style.textShadow = `
                        ${(Math.random() - 0.5) * 6}px 0 var(--neon-magenta),
                        ${(Math.random() - 0.5) * 6}px 0 var(--neon-cyan)
                    `;
                    await wait(50);
                    el.textContent = finalText;
                    el.style.transform = '';
                    el.style.textShadow = '';
                    await wait(60);
                }
            }
        }

        typeWithGlitch().then(() => ambientGlitch());
    }

    // ── INICIALIZACIÓN DE LOS ELEMENTOS CON GLITCH ──
    aplicarEfectoGlitch('.titulo-pagina');
    aplicarEfectoGlitch('#principal .titulo-cabecera');

    // ── LÓGICA DEL BOTÓN MENÚ (ATAJO) ──
    const contenedorAtajo = document.querySelector('.contenedor-atajo');
    const botonMenu = document.querySelector('.boton-menu');
    const enlacesMenu = document.querySelectorAll('.menu-desplegable a');

    if (botonMenu && contenedorAtajo) {
        botonMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            contenedorAtajo.classList.toggle('abierto');
        });

        enlacesMenu.forEach(enlace => {
            enlace.addEventListener('click', () => {
                contenedorAtajo.classList.remove('abierto');
            });
        });

        document.addEventListener('click', (e) => {
            if (!contenedorAtajo.contains(e.target)) {
                contenedorAtajo.classList.remove('abierto');
            }
        });
    }
})();