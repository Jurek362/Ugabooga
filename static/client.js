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
        this.isMoving = false;
        
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
        // Kontrolki klawiatury
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupJoystick() {
        const joystickContainer = document.getElementById('joystick-container');
        
        // Pokaż joystick na urządzeniach dotykowych
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
        
        const speed = 4;
        const newX = this.currentPlayer.x + (x * speed);
        const newY = this.currentPlayer.y + (y * speed);
        
        this.updatePlayerPosition(newX, newY);
    }
    
    handleKeyboardMovement() {
        if (!this.currentPlayer) return;
        
        let deltaX = 0;
        let deltaY = 0;
        
        // Strzałki i WASD
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
    
    updatePlayerPosition(x, y) {
        // Ograniczenia granic
        x = Math.max(15, Math.min(785, x));
        y = Math.max(15, Math.min(585, y));
        
        if (this.currentPlayer.x !== x || this.currentPlayer.y !== y) {
            this.currentPlayer.x = x;
            this.currentPlayer.y = y;
            
            // Wyślij nową pozycję do serwera
            this.socket.emit('playerMovement', { x: x, y: y });
        }
    }
    
    render() {
        // Wyczyść canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Narysuj tło siatki
        this.drawGrid();
        
        // Narysuj wszystkich graczy
        Object.values(this.players).forEach(player => {
            this.drawPlayer(player, player.id === (this.currentPlayer?.id));
        });
        
        // Narysuj informacje o grze
        this.drawGameInfo();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#34495E';
        this.ctx.lineWidth = 1;
        
        // Pionowe linie
        for (let x = 0; x < this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Poziome linie
        for (let y = 0; y < this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer(player, isCurrentPlayer) {
        const radius = isCurrentPlayer ? 20 : 15;
        
        // Cień gracza
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(player.x + 2, player.y + 2, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Główne koło gracza
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Obramowanie
        this.ctx.strokeStyle = isCurrentPlayer ? '#FFD700' : '#FFFFFF';
        this.ctx.lineWidth = isCurrentPlayer ? 3 : 2;
        this.ctx.stroke();
        
        // Napis "TY" dla obecnego gracza
        if (isCurrentPlayer) {
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TY', player.x, player.y + 4);
        }
        
        // ID gracza nad kółkiem
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`#${player.id.slice(-4)}`, player.x, player.y - radius - 5);
    }
    
    drawGameInfo() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Gracze: ${Object.keys(this.players).length}`, 10, 25);
        
        if (this.currentPlayer) {
            this.ctx.fillText(`Pozycja: ${Math.round(this.currentPlayer.x)}, ${Math.round(this.currentPlayer.y)}`, 10, 45);
        }
    }
    
    gameLoop() {
        this.handleKeyboardMovement();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Uruchom grę po załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
