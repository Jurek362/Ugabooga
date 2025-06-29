class VirtualJoystick {
    constructor(container, callback) {
        this.container = container;
        this.knob = container.querySelector('.joystick-knob');
        this.callback = callback;
        
        this.centerX = 0;
        this.centerY = 0;
        this.maxDistance = 35; // Maksymalna odległość od środka
        
        this.isActive = false;
        this.currentX = 0;
        this.currentY = 0;
        
        this.setupEventListeners();
        this.updateCenter();
    }
    
    updateCenter() {
        const rect = this.container.getBoundingClientRect();
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
    }
    
    setupEventListeners() {
        // Touch events
        this.knob.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleEnd.bind(this));
        
        // Mouse events
        this.knob.addEventListener('mousedown', this.handleStart.bind(this));
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        
        // Zapobieganie przewijaniu strony
        this.container.addEventListener('touchstart', (e) => e.preventDefault());
        this.container.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    handleStart(event) {
        this.isActive = true;
        this.updateCenter();
        event.preventDefault();
    }
    
    handleMove(event) {
        if (!this.isActive) return;
        
        event.preventDefault();
        
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        
        const rect = this.container.getBoundingClientRect();
        const x = clientX - rect.left - this.centerX;
        const y = clientY - rect.top - this.centerY;
        
        const distance = Math.sqrt(x * x + y * y);
        
        if (distance <= this.maxDistance) {
            this.currentX = x;
            this.currentY = y;
        } else {
            const angle = Math.atan2(y, x);
            this.currentX = Math.cos(angle) * this.maxDistance;
            this.currentY = Math.sin(angle) * this.maxDistance;
        }
        
        // Aktualizuj pozycję gałki
        this.knob.style.transform = `translate(${this.currentX}px, ${this.currentY}px)`;
        
        // Wywołaj callback z normalizowanymi wartościami (-1 do 1)
        const normalizedX = this.currentX / this.maxDistance;
        const normalizedY = this.currentY / this.maxDistance;
        
        this.callback(normalizedX, normalizedY);
    }
    
    handleEnd() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.currentX = 0;
        this.currentY = 0;
        
        // Przywróć gałkę do środka
        this.knob.style.transform = 'translate(0px, 0px)';
        
        // Zatrzymaj ruch
        this.callback(0, 0);
    }
}
