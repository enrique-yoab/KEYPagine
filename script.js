/**
 * KEYpages — script.js
 * Lógica Vanilla JS altamente optimizada. Ruleta adaptada al portafolio de servicios.
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

    // --- 3. RULETA DE PORTAFOLIO (Navegación Circular Elástica) ---
    const roulette = document.getElementById('menu-roulette');
    if (roulette) {
        const items = roulette.querySelectorAll('.roulette-item');
        const totalItems = items.length;
        let currentRotation = 0;
        let activeIndex = 0;

        // Función para posicionar elementos con radio dinámico según viewport
        const positionItems = () => {
            const screenWidth = window.innerWidth;
            let radius = 160; // Desktop
            
            // Ajuste hiper-dinámico para pantallas móviles
            if (screenWidth < 380) {
                radius = 105; // Ajustado ligeramente para acomodar los nuevos textos
            } else if (screenWidth < 480) {
                radius = 135; 
            }

            items.forEach((item, index) => {
                const angle = (index / totalItems) * (2 * Math.PI);
                const x = Math.round(radius * Math.sin(angle));
                const y = Math.round(-radius * Math.cos(angle));
                
                // Mantenemos la contra-rotación actual
                item.style.transform = `translate(${x}px, ${y}px) rotate(${-currentRotation}deg)`;
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
                
                // Contrarrestar la rotación del padre para legibilidad de texto
                items.forEach(item => {
                    const currentTransform = item.style.transform.replace(/rotate\(.*?\)/g, '').trim(); 
                    item.style.transform = `${currentTransform} rotate(${-currentRotation}deg)`;
                });
            });
        };

        document.getElementById('btn-spin-left').addEventListener('click', () => updateRoulette('left'));
        document.getElementById('btn-spin-right').addEventListener('click', () => updateRoulette('right'));

        // Recalcular dimensiones si el usuario redimensiona o rota el dispositivo
        window.addEventListener('resize', () => {
            requestAnimationFrame(positionItems);
        });

        // Inicialización
        positionItems();
    }
});