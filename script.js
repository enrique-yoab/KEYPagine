/**
 * KEYpages — script.js
 * Lógica Vanilla JS altamente optimizada.
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
    const revealElements = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    revealElements.forEach(el => revealObserver.observe(el));

    // --- 3. RULETA DE CASINO (Navegación Circular Responsiva) ---
    const roulette = document.getElementById('menu-roulette');
    if (roulette) {
        const items = roulette.querySelectorAll('.roulette-item');
        const totalItems = items.length;
        
        // Radio dinámico: Más pequeño en celulares para evitar desbordes
        const radius = window.innerWidth < 450 ? 120 : 160; 
        let currentRotation = 0;
        let activeIndex = 0;

        // Posicionar elementos en círculo
        const positionItems = () => {
            items.forEach((item, index) => {
                const angle = (index / totalItems) * (2 * Math.PI);
                const x = Math.round(radius * Math.sin(angle));
                const y = Math.round(-radius * Math.cos(angle));
                
                item.style.transform = `translate(${x}px, ${y}px)`;
            });
        };

        const updateRoulette = (direction) => {
            items[activeIndex].classList.remove('active');

            // Calcular nuevo índice
            if (direction === 'right') {
                activeIndex = (activeIndex + 1) % totalItems;
                currentRotation -= (360 / totalItems);
            } else {
                activeIndex = (activeIndex - 1 + totalItems) % totalItems;
                currentRotation += (360 / totalItems);
            }

            items[activeIndex].classList.add('active');
            
            // Renderizado por GPU
            requestAnimationFrame(() => {
                roulette.style.transform = `rotate(${currentRotation}deg)`;
                
                // Contrarrestar la rotación para que el texto siga derecho
                items.forEach(item => {
                    const currentTransform = item.style.transform.replace(/rotate\(.*?\)/g, ''); 
                    item.style.transform = `${currentTransform} rotate(${-currentRotation}deg)`;
                });
            });
        };

        document.getElementById('btn-spin-left').addEventListener('click', () => updateRoulette('left'));
        document.getElementById('btn-spin-right').addEventListener('click', () => updateRoulette('right'));

        // Recalcular si voltean el celular
        window.addEventListener('resize', () => {
            requestAnimationFrame(positionItems);
        });

        // Inicializar
        positionItems();
    }
});