class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.socket = io();
        
        this.players = {};
        this.currentPlayer = null;
        
        // Kontrola ruchu
        this.keys = {};
        this.moveSpeed = 3;
        
        this.setupSocketEvents();
        this.setupControls();
        this.setupJoystick();
        this.gameLoop();
        
        console.log('🎮 Gra Ugabooga uruchomiona!');
    }
    
    setupSocketEvents() {
        const statusElement = document.getElementById('connection-status');
        
        this.socket.on('connect', () => {
            console.log('Połączono z serwerem');
            statusElement.textContent = 'Połączono';
            statusElement.className = 'connected';
        });
        
        this.socket.on('disconnect', () => {
            console.log('Rozłączono z serwerem');
            statusElement.textContent = 'Rozłączono';
            statusElement.className = 'disconnected';
        });
        
        this.socket.on('currentPlayer', (player) => {
            this.currentPlayer = player;
            console.log('Otrzymano dane gracza:', player);
        });
        
        this.socket.on('allPlayers', (players) => {
            this.players = players;
            console.log('Otrzymano wszystkich graczy:', players);
        });
        
        this.socket.on('newPlayer', (player) => {
            this.players[player.id] = player;
            console.log('Nowy gracz dołączył:', player);
        });
        
        this.socket.on('playerMoved', (data) => {
            if (this.players[data.id]) {
                this.players[data.id].x = data.x;
                this.players[data.id].y = data.y;
            }
        });
        
        this.socket.on('playerDisconnected', (playerId) => {
            delete this.players[playerId];
            console.log('Gracz opuścił grę:', playerId);
        });
        
        this.socket.on('updatePlayerCount', (count) => {
            document.getElementById('player-count').textContent = `Gracze online: ${count}`;
        });
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupJoystick() {
        const joystickContainer = document.getElementById('joystick-container');
        if ('ontouchstart' in window) {
            joystickContainer.style.display = 'block';
        }
        
        this.joystick = new VirtualJoystick(
            document.getElementById('joystick-area'),
            (x, y) => this.handleJoystickMove(x, y)
        );
    }

    handleJoystickMove(x, y) {
        if (!this.currentPlayer) return;

        // Joystick już dostarcza wektor ruchu, więc go używamy
        // Prędkość jest mnożona, aby ruch był zauważalny
        const speed = 4;
        const newX = this.currentPlayer.x + (x * speed);
        const newY = this.currentPlayer.y + (y * speed);

        this.updatePlayerPosition(newX, newY);
    }
    
    handleKeyboardMovement() {
        if (!this.currentPlayer) return;
        
        let deltaX = 0;
        let deltaY = 0;
        
        if (this.keys['arrowleft'] || this.keys['a']) deltaX = -this.moveSpeed;
        if (this.keys['arrowright'] || this.keys['d']) deltaX = this.moveSpeed;
        if (this.keys['arrowup'] || this.keys['w']) deltaY = -this.moveSpeed;
        if (this.keys['arrowdown'] || this.keys['s']) deltaY = this.moveSpeed;

        if (deltaX !== 0 || deltaY !== 0) {
            const newX = this.currentPlayer.x + deltaX;
            const newY = this.currentPlayer.y + deltaY;
            this.updatePlayerPosition(newX, newY);
        }
    }
    
    updatePlayerPosition(newX, newY) {
        if (!this.currentPlayer) return;

        // Aktualizujemy pozycję lokalnie dla płynności
        this.currentPlayer.x = newX;
        this.currentPlayer.y = newY;
        
        // Wysyłamy nową pozycję do serwera
        this.socket.emit('playerMove', { x: newX, y: newY });
    }

    drawPlayer(player) {
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(player.id.substring(0, 4), player.x, player.y + player.size + 10);
    }
    
    gameLoop() {
        // Sprawdzanie ruchu z klawiatury w pętli gry
        this.handleKeyboardMovement();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.currentPlayer) {
            // Zapisujemy stan kontekstu (przed przesunięciem)
            this.ctx.save();
            
            // Przesuwamy cały świat (canvas) tak, aby gracz był na środku
            const cameraX = this.canvas.width / 2 - this.currentPlayer.x;
            const cameraY = this.canvas.height / 2 - this.currentPlayer.y;
            this.ctx.translate(cameraX, cameraY);

            // Rysujemy wszystkich graczy w ich globalnych koordynatach
            for (const id in this.players) {
                this.drawPlayer(this.players[id]);
            }
            
            // Przywracamy stan kontekstu (usuwamy przesunięcie)
            this.ctx.restore();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Uruchomienie gry
window.onload = () => new Game();
