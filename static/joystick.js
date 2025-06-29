/**
 * Nowa, ulepszona implementacja wirtualnego joysticka.
 * Jest bardziej zwięzła i obsługuje zarówno mysz, jak i dotyk w sposób zunifikowany.
 */
class VirtualJoystick {
    constructor(container, callback) {
        this.container = container;
        this.knob = container.querySelector('.joystick-knob');
        this.callback = callback;

        this.isActive = false;
        this.center = { x: 0, y: 0 };
        this.maxDistance = 0; // Obliczymy to dynamicznie

        this.updateDimensions();
        this.addEventListeners();
    }

    /**
     * Oblicza i aktualizuje kluczowe wymiary joysticka.
     * Wywoływane przy inicjalizacji i przy zmianie rozmiaru okna.
     */
    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        this.center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
        };
        this.maxDistance = this.container.offsetWidth / 2;
    }

    /**
     * Dodaje nasłuchiwanie na zdarzenia myszy, dotyku i zmiany rozmiaru okna.
     */
    addEventListeners() {
        // Zdarzenia startowe
        this.container.addEventListener('mousedown', (e) => this.handleStart(e));
        this.container.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });

        // Zdarzenia ruchu
        window.addEventListener('mousemove', (e) => this.handleMove(e));
        window.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });

        // Zdarzenia końcowe
        window.addEventListener('mouseup', () => this.handleEnd());
        window.addEventListener('touchend', () => this.handleEnd());
        
        // Aktualizacja wymiarów przy zmianie rozmiaru okna
        window.addEventListener('resize', () => this.updateDimensions());
    }

    handleStart(event) {
        event.preventDefault();
        this.isActive = true;
        this.knob.style.transition = 'none'; // Wyłącz animację podczas przeciągania
        this.updateDimensions(); // Upewnij się, że wymiary są aktualne
    }

    handleMove(event) {
        if (!this.isActive) return;
        event.preventDefault();

        // Ujednolicenie danych wejściowych z myszy i dotyku
        const currentPos = event.touches ? event.touches[0] : event;
        const x = currentPos.clientX - this.center.x;
        const y = currentPos.clientY - this.center.y;

        const distance = Math.sqrt(x * x + y * y);
        const angle = Math.atan2(y, x);

        let knobX, knobY;

        if (distance > this.maxDistance) {
            // Utrzymuj gałkę na krawędzi joysticka
            knobX = Math.cos(angle) * this.maxDistance;
            knobY = Math.sin(angle) * this.maxDistance;
        } else {
            knobX = x;
            knobY = y;
        }

        // Aktualizuj pozycję wizualną gałki
        this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Wywołaj callback z normalizowanymi wartościami (-1 do 1)
        const normalizedX = knobX / this.maxDistance;
        const normalizedY = knobY / this.maxDistance;
        this.callback(normalizedX, normalizedY);
    }

    handleEnd() {
        if (!this.isActive) return;
        this.isActive = false;

        // Przywróć gałkę do środka z animacją
        this.knob.style.transition = 'transform 0.2s ease-out';
        this.knob.style.transform = 'translate(0, 0)';

        // Wywołaj callback z wartościami zerowymi, aby zatrzymać ruch
        this.callback(0, 0);
    }
}
