/**
 * KEYpages — script.js
 * Totalmente optimizado para móviles. Evita layout thrashing y usa aceleración nativa.
 */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* ============================================================
       1. REVEAL ON SCROLL (Intersection Observer) - Optimizado
    ============================================================ */
    const revealEls = document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("active");
                        obs.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add("active"));
    }

    /* ============================================================
       2. PILA DE CARTAS: Máquina de Estados sin Reflows (Suave)
    ============================================================ */
    const cartas = document.querySelectorAll(".flotante");
    let ordenCartas = Array.from(cartas);
    let pilaAnimando = false;

    ordenCartas.forEach((carta, index) => {
        carta.classList.add(`card-pos-${index}`);
    });

    const rotarPila = (cartaActiva) => {
        if (cartaActiva !== ordenCartas[0] || pilaAnimando) return;
        pilaAnimando = true;

        // 1. La carta frontal sale
        cartaActiva.classList.remove('card-pos-0');
        cartaActiva.classList.add('card-out');

        // 2. Rotamos el arreglo lógico
        const cartaSaliente = ordenCartas.shift();
        ordenCartas.push(cartaSaliente);

        // 3. Avanzamos las cartas restantes inmediatamente
        ordenCartas[0].classList.remove('card-pos-1');
        ordenCartas[0].classList.add('card-pos-0');
        
        ordenCartas[1].classList.remove('card-pos-2');
        ordenCartas[1].classList.add('card-pos-1');

        // 4. Reposicionar la carta saliente de forma fluida (doble rAF en lugar de reflow forzado)
        setTimeout(() => {
            cartaSaliente.style.transition = 'none'; // Apagamos transición
            cartaSaliente.classList.remove('card-out');
            cartaSaliente.classList.add('card-pos-2'); // La mandamos al fondo

            // Dejamos que el navegador renderice el frame sin transición antes de restaurarla
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cartaSaliente.style.transition = ''; // Limpiamos el style inline para que recupere la de CSS
                    pilaAnimando = false;
                });
            });
        }, 400); // Sincronizado con la transición CSS de .card-out
    };

    cartas.forEach(carta => {
        carta.addEventListener("click", () => rotarPila(carta));
        carta.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                rotarPila(carta);
            }
        });
    });

    /* ============================================================
       3. COMPARATIVA: TABS
    ============================================================ */
    const bloques = document.querySelectorAll(".bloque-enfoque");

    bloques.forEach(bloque => {
        const activar = () => {
            if (bloque.classList.contains("seleccionado")) return;
            bloques.forEach(b => {
                b.classList.remove("seleccionado");
                b.setAttribute("aria-selected", "false");
            });
            bloque.classList.add("seleccionado");
            bloque.setAttribute("aria-selected", "true");
        };

        bloque.addEventListener("click", activar);
        bloque.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activar();
            }
        });
    });

    /* ============================================================
       4. CARRUSEL: Gestión Inteligente (Lerp Desktop / Nativo Móvil)
    ============================================================ */
    const carrusel = document.querySelector(".carrusel-horizontal");
    if (!carrusel) return;

    const esMovil = window.matchMedia("(max-width: 768px)").matches;
    const tarjetasOrig = Array.from(carrusel.querySelectorAll(".tarjeta-proceso"));
    const dots = document.querySelectorAll(".indicador-carrusel .dot");

    // Para mantener el rendimiento impecable en móviles, desactivamos los cálculos
    // JS pesados por frame y el loop infinito que causa saltos de scroll.
    if (!esMovil) {
        // Clones solo en Desktop para loop visual
        const clone = (el, pos) => {
            const c = el.cloneNode(true);
            c.setAttribute("aria-hidden", "true");
            c.classList.add("clon");
            if (pos === "start") carrusel.insertBefore(c, carrusel.firstChild);
            else carrusel.appendChild(c);
        };
        clone(tarjetasOrig[tarjetasOrig.length - 1], "start");
        clone(tarjetasOrig[0], "end");

        const anchoTarjeta = () => (tarjetasOrig[0]?.offsetWidth || 290) + parseFloat(getComputedStyle(carrusel).gap || "20");

        const posInicial = () => {
            carrusel.style.scrollBehavior = "auto";
            carrusel.scrollLeft = anchoTarjeta();
        };

        window.addEventListener("load", posInicial);
        window.addEventListener("resize", () => {
            if(!window.matchMedia("(max-width: 768px)").matches) posInicial();
        });
        setTimeout(posInicial, 30);
    }

    // Actualizador de Puntos (Dots) - Funciona tanto en móvil como en escritorio
    const updateDots = () => {
        const gap = (tarjetasOrig[0]?.offsetWidth || 290) + parseFloat(getComputedStyle(carrusel).gap || "20");
        // Ajuste matemático dependiendo de si hay clones (desktop) o no (móvil)
        const relScroll = esMovil ? carrusel.scrollLeft : carrusel.scrollLeft - gap; 
        const idx = Math.round(relScroll / gap);
        const clamped = Math.min(Math.max(idx, 0), tarjetasOrig.length - 1);
        dots.forEach((d, i) => d.classList.toggle("activo", i === clamped));
    };

    carrusel.addEventListener("scroll", () => {
        requestAnimationFrame(updateDots); // rAF previene saturación en scroll
    });
});