/**
 * KEYpages — script.js
 * Optimizado para rendimiento extremo (Lerp, Reflow forzado, State Machine).
 */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* ============================================================
       1. REVEAL ON SCROLL (Intersection Observer)
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
            { threshold: 0.12 }
        );
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add("active"));
    }


    /* ============================================================
       2. PILA DE CARTAS: Máquina de Estados de GPU
    ============================================================ */
    const cartas = document.querySelectorAll(".flotante");
    let ordenCartas = Array.from(cartas);
    let pilaAnimando = false;

    // Inicializamos las clases de estado (0 es el frente)
    ordenCartas.forEach((carta, index) => {
        carta.classList.add(`card-pos-${index}`);
    });

    const rotarPila = (cartaActiva) => {
        if (cartaActiva !== ordenCartas[0] || pilaAnimando) return;
        pilaAnimando = true;

        // 1. La carta frontal sale
        cartaActiva.classList.replace('card-pos-0', 'card-out');

        // 2. Actualizamos el orden lógico
        const cartaSaliente = ordenCartas.shift();
        ordenCartas.push(cartaSaliente);

        // 3. Las cartas traseras avanzan inmediatamente
        ordenCartas[0].classList.replace('card-pos-1', 'card-pos-0');
        ordenCartas[1].classList.replace('card-pos-2', 'card-pos-1');

        // 4. Una vez completada la salida, la colocamos atrás en silencio
        setTimeout(() => {
            cartaSaliente.classList.add('no-transition');
            cartaSaliente.classList.replace('card-out', 'card-pos-2');
            
            // Reflow forzado para aplicar posición sin transición
            void cartaSaliente.offsetWidth; 
            
            cartaSaliente.classList.remove('no-transition');
            pilaAnimando = false;
        }, 400); // Sincronizado con la transición CSS
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
       4. CARRUSEL: Lerp (Interpolación) y Loop
    ============================================================ */
    const carrusel = document.querySelector(".carrusel-horizontal");
    if (!carrusel) return;

    const tarjetasOrig = Array.from(carrusel.querySelectorAll(".tarjeta-proceso"));

    // Clones para loop infinito
    const clone = (el, pos) => {
        const c = el.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.classList.add("clon");
        if (pos === "start") carrusel.insertBefore(c, carrusel.firstChild);
        else carrusel.appendChild(c);
    };

    clone(tarjetasOrig[tarjetasOrig.length - 1], "start");
    clone(tarjetasOrig[0], "end");

    const todasLasTarjetas = () => carrusel.querySelectorAll(".tarjeta-proceso");
    const anchoTarjeta = () => (tarjetasOrig[0]?.offsetWidth || 290) + parseFloat(getComputedStyle(carrusel).gap || "20");

    const posInicial = () => {
        carrusel.style.scrollBehavior = "auto";
        carrusel.scrollLeft = anchoTarjeta();
    };

    window.addEventListener("load", posInicial);
    window.addEventListener("resize", posInicial);
    setTimeout(posInicial, 30);

    const checkBucle = () => {
        const gap = anchoTarjeta();
        const maxScroll = carrusel.scrollWidth - carrusel.clientWidth;
        if (carrusel.scrollLeft <= 2) {
            carrusel.style.scrollBehavior = "auto";
            carrusel.scrollLeft = maxScroll - gap - 2;
        } else if (carrusel.scrollLeft >= maxScroll - 2) {
            carrusel.style.scrollBehavior = "auto";
            carrusel.scrollLeft = gap + 2;
        }
    };

    // Variables de Física
    let isDragging = false;
    let startX, startScroll, targetScroll;
    let velX = 0, lastX = 0, lastT = 0;
    let rafId, rafIdDrag;

    // Loop de renderizado para arrastre ultra fluido (Lerp)
    const dragLoop = () => {
        if (!isDragging) return;
        carrusel.scrollLeft += (targetScroll - carrusel.scrollLeft) * 0.4;
        checkBucle();
        rafIdDrag = requestAnimationFrame(dragLoop);
    };

    const inertia = () => {
        if (Math.abs(velX) > 0.3) {
            carrusel.scrollLeft -= velX;
            velX *= 0.93; // Fricción
            checkBucle();
            rafId = requestAnimationFrame(inertia);
        } else {
            carrusel.style.scrollBehavior = "smooth";
            updateDots();
        }
    };

    // Eventos (Se ejecutan primariamente en Desktop)
    carrusel.addEventListener("mousedown", e => {
        isDragging = true;
        carrusel.classList.add("dragging");
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(rafIdDrag);
        
        carrusel.style.scrollBehavior = "auto";
        startX = e.pageX - carrusel.offsetLeft;
        startScroll = carrusel.scrollLeft;
        targetScroll = startScroll;
        lastX = e.pageX;
        lastT = performance.now();
        velX = 0;
        
        rafIdDrag = requestAnimationFrame(dragLoop); 
    });

    carrusel.addEventListener("mousemove", e => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - carrusel.offsetLeft;
        
        // El ratón actualiza la meta, la GPU la persigue
        targetScroll = startScroll - (x - startX) * 1.5; 
        
        const now = performance.now();
        const dt = now - lastT;
        if (dt > 0) velX = ((e.pageX - lastX) / dt) * 16;
        lastX = e.pageX;
        lastT = now;
    });

    const endDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        carrusel.classList.remove("dragging");
        cancelAnimationFrame(rafIdDrag); 
        rafId = requestAnimationFrame(inertia); 
    };

    carrusel.addEventListener("mouseup", endDrag);
    carrusel.addEventListener("mouseleave", endDrag);

    carrusel.addEventListener("scroll", () => {
        if (!isDragging) {
            checkBucle();
            updateDots();
        }
    });

    // Puntos indicadores
    const dots = document.querySelectorAll(".indicador-carrusel .dot");
    const updateDots = () => {
        const gap = anchoTarjeta();
        const rel = carrusel.scrollLeft - gap;
        const idx = Math.round(rel / gap);
        const clamped = Math.min(Math.max(idx, 0), tarjetasOrig.length - 1);
        dots.forEach((d, i) => d.classList.toggle("activo", i === clamped));
    };

    // Efecto visual para móvil al hacer scroll (Intersección)
    if (window.innerWidth <= 768 && "IntersectionObserver" in window) {
        const ioCards = new IntersectionObserver(
            entries => {
                entries.forEach(e => {
                    e.target.classList.toggle("activa", e.isIntersecting);
                });
            },
            { root: carrusel, threshold: 0.65 }
        );
        todasLasTarjetas().forEach(t => ioCards.observe(t));
    }

});