/**
 * KEYpages — script.js
 * Optimizado para rendimiento en móviles (60FPS) y accesibilidad en Desktop.
 */
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // --- 1. NAVBAR STICKY & SCROLL EFFECT ---
    const navbar = document.getElementById("navbar");
    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    };
    window.addEventListener("scroll", () => requestAnimationFrame(handleScroll), { passive: true });

    // --- 2. REVEAL ANIMATIONS (Intersection Observer) ---
    // Usamos rootMargin para que se animen un poco antes de aparecer
    const revealElements = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target); // Dejar de observar una vez animado
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- 3. PILA DE CARTAS (Card Stack) ---
    // Mantenemos la lógica de estado sin Reflows pesados
    const stackCards = document.querySelectorAll(".stack-card");
    if (stackCards.length > 0) {
        let cardOrder = Array.from(stackCards);
        let isAnimating = false;

        // Inicializar clases
        cardOrder.forEach((card, index) => card.classList.add(`pos-${index}`));

        const rotateStack = (clickedCard) => {
            // Solo permitir clic en la primera carta y si no hay animación en curso
            if (clickedCard !== cardOrder[0] || isAnimating) return;
            isAnimating = true;

            // Animar salida
            clickedCard.classList.remove('pos-0');
            clickedCard.classList.add('out');

            // Reorganizar el Array
            const outgoingCard = cardOrder.shift();
            cardOrder.push(outgoingCard);

            // Actualizar las que quedan
            cardOrder[0].classList.replace('pos-1', 'pos-0');
            cardOrder[1].classList.replace('pos-2', 'pos-1');

            // Reposicionar la que salió (usando requestAnimationFrame en vez de timers fijos donde sea posible)
            setTimeout(() => {
                outgoingCard.style.transition = 'none'; // Quitar transición para teletransporte
                outgoingCard.classList.remove('out');
                outgoingCard.classList.add('pos-2'); // Mandar al fondo

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        outgoingCard.style.transition = ''; // Restaurar transición CSS
                        isAnimating = false;
                    });
                });
            }, 400); // 400ms empata con el CSS de la clase .out
        };

        stackCards.forEach(card => {
            card.addEventListener("click", () => rotateStack(card));
            card.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    rotateStack(card);
                }
            });
        });
    }

    // --- 4. CARRUSEL NATIVO (Mobile & Desktop) ---
    const track = document.getElementById("process-carousel");
    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");
    const dotsContainer = document.getElementById("carousel-dots");
    
    if (track) {
        const cards = track.querySelectorAll(".carousel-card");
        
        // Crear dots
        cards.forEach((_, i) => {
            const dot = document.createElement("div");
            dot.classList.add("dot");
            if(i === 0) dot.classList.add("active");
            dotsContainer.appendChild(dot);
        });
        const dots = dotsContainer.querySelectorAll(".dot");

        // Lógica de Scroll suave
        const getCardWidth = () => cards[0].offsetWidth + parseInt(window.getComputedStyle(track).gap || 0);

        btnNext.addEventListener("click", () => {
            track.scrollBy({ left: getCardWidth(), behavior: "smooth" });
        });

        btnPrev.addEventListener("click", () => {
            track.scrollBy({ left: -getCardWidth(), behavior: "smooth" });
        });

        // Actualizar dots en base al scroll
        track.addEventListener("scroll", () => {
            requestAnimationFrame(() => {
                const scrollPos = track.scrollLeft;
                const cardWidth = getCardWidth();
                // Calcular qué tarjeta está más cerca del centro
                const activeIndex = Math.round(scrollPos / cardWidth);
                
                dots.forEach((dot, index) => {
                    dot.classList.toggle("active", index === activeIndex);
                });
            });
        }, { passive: true });
    }
});