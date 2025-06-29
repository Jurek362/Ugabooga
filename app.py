from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'ugabooga_secret_key_2024'
socketio = SocketIO(app, cors_allowed_origins="*")

# Przechowywanie graczy
players = {}

# Kolory dla graczy
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    player_id = request.sid
    print(f'Gracz połączony: {player_id}')
    
    # Nowy gracz dołącza
    color = random.choice(colors)
    players[player_id] = {
        'id': player_id,
        'x': random.randint(25, 775),  # Losowa pozycja startowa
        'y': random.randint(25, 575),
        'color': color,
        'name': f'Gracz{len(players)}'
    }
    
    # Wyślij obecnego gracza do klienta
    emit('currentPlayer', players[player_id])
    
    # Wyślij wszystkich graczy do nowego gracza
    emit('allPlayers', players)
    
    # Powiadom innych o nowym graczu
    emit('newPlayer', players[player_id], broadcast=True, include_self=False)
    
    # Zaktualizuj liczbę graczy
    emit('updatePlayerCount', len(players), broadcast=True)

@socketio.on('playerMovement')
def handle_player_movement(data):
    player_id = request.sid
    if player_id in players:
        # Ograniczenia granic planszy
        x = max(15, min(785, data['x']))
        y = max(15, min(585, data['y']))
        
        players[player_id]['x'] = x
        players[player_id]['y'] = y
        
        # Wyślij zaktualizowaną pozycję do wszystkich innych graczy
        emit('playerMoved', {
            'id': player_id,
            'x': x,
            'y': y
        }, broadcast=True, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    player_id = request.sid
    print(f'Gracz rozłączony: {player_id}')
    
    if player_id in players:
        del players[player_id]
        emit('playerDisconnected', player_id, broadcast=True)
        emit('updatePlayerCount', len(players), broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
