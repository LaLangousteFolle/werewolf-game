# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from contextlib import asynccontextmanager
import asyncio
import httpx
import random
from datetime import datetime
import os
from dotenv import load_dotenv
from auth import create_access_token, verify_token, exchange_code, get_discord_user

load_dotenv()

DISCORD_BOT_URL = os.getenv("DISCORD_BOT_URL", "http://localhost:8080")
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI")

# ========== Lifespan context manager (remplace on_event) ==========

async def check_players_in_voice():
    """Vérifie périodiquement que les joueurs sont dans le vocal."""
    while True:
        await asyncio.sleep(30)
        
        if game_state.phase == "lobby":
            continue
        
        for player in game_state.players:
            if not player.is_alive:
                continue
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{DISCORD_BOT_URL}/api/players/check/{player.id}",
                        timeout=5.0
                    )
                    data = response.json()
                    
                    if not data.get("in_voice"):
                        print(f"⚠️ {player.display_name} n'est plus dans le vocal")
            
            except Exception as e:
                print(f"Erreur vérification vocal: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Démarrage du backend...")
    task = asyncio.create_task(check_players_in_voice())
    yield
    # Shutdown
    print("🛑 Arrêt du backend...")
    task.cancel()


app = FastAPI(title="Werewolf Game API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== Modèles de données ==========

class Player(BaseModel):
    id: str
    username: str
    display_name: str
    avatar_url: str
    role: Optional[str] = None
    is_alive: bool = True
    is_muted: bool = False

class GameState(BaseModel):
    phase: str
    day_number: int = 0
    players: List[Player] = []
    dead_players: List[str] = []
    votes: Dict[str, str] = {}

class Vote(BaseModel):
    voter_id: str
    target_id: str

# ========== État global du jeu ==========

game_state = GameState(phase="lobby")
connected_clients: List[WebSocket] = []

# ========== Attribution des rôles ==========

def assign_roles(player_count: int) -> List[str]:
    """Attribue automatiquement les rôles selon le nombre de joueurs."""
    
    if player_count < 4:
        roles = ["Loup-Garou"] + ["Villageois"] * (player_count - 1)
        random.shuffle(roles)
        return roles
    
    roles = []
    wolf_count = max(1, player_count // 3)
    roles.extend(["Loup-Garou"] * wolf_count)
    
    special_roles = ["Voyante", "Sorcière", "Chasseur", "Cupidon", "Garde"]
    special_count = min(len(special_roles), player_count - wolf_count - 1)
    roles.extend(special_roles[:special_count])
    
    remaining = player_count - len(roles)
    roles.extend(["Villageois"] * remaining)
    
    random.shuffle(roles)
    return roles

# ========== WebSocket pour temps réel ==========

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        await websocket.send_json(game_state.dict())
        
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(data, websocket)
    
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


async def broadcast_state():
    """Envoie l'état du jeu à tous les clients connectés."""
    if not connected_clients:
        return
    
    state_json = game_state.dict()
    disconnected = []
    
    for client in connected_clients:
        try:
            await client.send_json(state_json)
        except:
            disconnected.append(client)
    
    for client in disconnected:
        connected_clients.remove(client)


async def handle_websocket_message(data: dict, websocket: WebSocket):
    """Traite les messages reçus via WebSocket."""
    action = data.get("action")
    
    if action == "ping":
        await websocket.send_json({"action": "pong"})


# ========== Endpoints AUTH ==========

@app.get("/auth/login")
async def login():
    """Redirige vers Discord OAuth2."""
    discord_auth_url = (
        f"https://discord.com/api/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify"
    )
    return {"auth_url": discord_auth_url}


@app.post("/auth/callback")
async def callback(code: str):
    """Callback Discord OAuth2."""
    try:
        print(f"📥 Code reçu: {code}")
        
        token_data = await exchange_code(code)
        print(f"📝 Token data: {token_data}")
        
        if "error" in token_data:
            print(f"❌ Erreur Discord: {token_data}")
            raise HTTPException(status_code=400, detail=f"Erreur Discord OAuth: {token_data.get('error_description', 'Unknown error')}")
        
        user_data = await get_discord_user(token_data["access_token"])
        print(f"👤 User data: {user_data}")
        
        jwt_token = create_access_token(data={
            "discord_id": user_data["id"],
            "username": user_data["username"],
            "avatar": user_data.get("avatar"),
        })
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user": {
                "id": user_data["id"],
                "username": user_data["username"],
                "discriminator": user_data.get("discriminator", "0"),
                "avatar": user_data.get("avatar"),
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Exception complète: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Récupère l'utilisateur actuel depuis le token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token manquant")
    
    discord_id = verify_token(authorization)
    
    player = next((p for p in game_state.players if p.id == discord_id), None)
    
    if not player:
        raise HTTPException(status_code=404, detail="Joueur non trouvé dans la partie")
    
    return {
        "id": player.id,
        "username": player.username,
        "display_name": player.display_name,
        "avatar_url": player.avatar_url,
        "role": player.role if game_state.phase != "lobby" else None,
        "is_alive": player.is_alive,
    }


# ========== Endpoints REST ==========

@app.get("/")
async def root():
    return {"message": "Werewolf Game API", "status": "running"}


@app.get("/game/state")
async def get_game_state():
    """Retourne l'état actuel du jeu."""
    return game_state


@app.post("/game/start")
async def start_game():
    """Démarre une nouvelle partie avec attribution automatique des rôles."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{DISCORD_BOT_URL}/api/players")
            data = response.json()
        
        if not data.get("success"):
            raise HTTPException(status_code=400, detail="Impossible de récupérer les joueurs")
        
        discord_players = data.get("players", [])
        
        if len(discord_players) < 1:
            raise HTTPException(status_code=400, detail="Minimum 1 joueur requis")
        
        roles = assign_roles(len(discord_players))
        
        game_state.players = []
        for i, discord_player in enumerate(discord_players):
            game_state.players.append(
                Player(
                    id=discord_player["id"],
                    username=discord_player["username"],
                    display_name=discord_player["display_name"],
                    avatar_url=discord_player["avatar_url"],
                    role=roles[i],
                    is_alive=True,
                    is_muted=discord_player.get("is_muted", False)
                )
            )
        
        game_state.phase = "night"
        game_state.day_number = 1
        game_state.dead_players = []
        game_state.votes = {}
        
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{DISCORD_BOT_URL}/api/phase",
                json={"phase": "night"}
            )
        
        await broadcast_state()
        
        return {
            "success": True, 
            "message": "Partie démarrée",
            "players": len(game_state.players),
            "roles_distribution": {
                role: roles.count(role) for role in set(roles)
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/game/phase/{phase}")
async def change_phase(phase: str):
    """Change la phase du jeu."""
    if phase not in ["night", "day", "voting", "ended"]:
        raise HTTPException(status_code=400, detail="Phase invalide")
    
    game_state.phase = phase
    
    if phase == "day":
        game_state.day_number += 1
        game_state.votes = {}
    
    discord_phase = "night" if phase == "night" else "day"
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"{DISCORD_BOT_URL}/api/phase",
                json={"phase": discord_phase}
            )
        except:
            pass
    
    await broadcast_state()
    
    return {"success": True, "phase": phase}


@app.post("/game/vote")
async def submit_vote(vote: Vote):
    """Enregistre un vote."""
    voter = next((p for p in game_state.players if p.id == vote.voter_id), None)
    if not voter or not voter.is_alive:
        raise HTTPException(status_code=400, detail="Joueur invalide ou mort")
    
    target = next((p for p in game_state.players if p.id == vote.target_id), None)
    if not target or not target.is_alive:
        raise HTTPException(status_code=400, detail="Cible invalide ou morte")
    
    game_state.votes[vote.voter_id] = vote.target_id
    
    await broadcast_state()
    
    return {"success": True, "votes_count": len(game_state.votes)}


@app.get("/game/players")
async def get_players():
    """Retourne la liste des joueurs."""
    return {"players": game_state.players}


@app.post("/game/kill/{player_id}")
async def kill_player(player_id: str):
    """Tue un joueur."""
    player = next((p for p in game_state.players if p.id == player_id), None)
    if not player:
        raise HTTPException(status_code=404, detail="Joueur introuvable")
    
    if not player.is_alive:
        raise HTTPException(status_code=400, detail="Joueur déjà mort")
    
    player.is_alive = False
    game_state.dead_players.append(player_id)
    
    await broadcast_state()
    
    return {"success": True, "message": f"{player.display_name} a été éliminé"}


@app.post("/game/reset")
async def reset_game():
    """Réinitialise complètement la partie."""
    game_state.phase = "lobby"
    game_state.day_number = 0
    game_state.players = []
    game_state.dead_players = []
    game_state.votes = {}
    
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"{DISCORD_BOT_URL}/api/phase",
                json={"phase": "idle"}
            )
        except:
            pass
    
    await broadcast_state()
    
    return {"success": True, "message": "Partie réinitialisée"}


@app.get("/game/stats")
async def get_game_stats():
    """Retourne les statistiques de la partie."""
    alive_count = sum(1 for p in game_state.players if p.is_alive)
    dead_count = len(game_state.dead_players)
    
    roles_alive = {}
    for player in game_state.players:
        if player.is_alive and player.role:
            roles_alive[player.role] = roles_alive.get(player.role, 0) + 1
    
    return {
        "phase": game_state.phase,
        "day": game_state.day_number,
        "alive": alive_count,
        "dead": dead_count,
        "roles_alive": roles_alive,
        "votes_count": len(game_state.votes)
    }


# ========== Démarrage ==========

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
