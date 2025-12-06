# discord-bot/main.py
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv
from aiohttp import web
import asyncio

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")
VOICE_CHANNEL_ID = int(os.getenv("VOICE_CHANNEL_ID", 0))
API_PORT = int(os.getenv("API_PORT", 8080))

intents = discord.Intents.default()
intents.guilds = True
intents.voice_states = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

state = {
    "voice_channel": None,
    "voice_client": None,
    "phase": "idle",  
}


@bot.event
async def on_ready():
    print(f"✅ Bot Discord connecté : {bot.user}")
    
    if VOICE_CHANNEL_ID:
        channel = bot.get_channel(VOICE_CHANNEL_ID)
        if channel:
            state["voice_channel"] = channel
            print(f"✅ Channel vocal configuré : {channel.name}")
        else:
            print(f"⚠️ Channel vocal {VOICE_CHANNEL_ID} introuvable")


# ========== API REST pour le backend ==========

@app.get("/api/players/check/{player_id}")
async def check_player_in_voice(player_id: str):
    """Vérifie si un joueur est toujours dans le vocal."""
    channel = state["voice_channel"]
    if not channel:
        return {"in_voice": False}
    
    player_in_voice = any(str(m.id) == player_id for m in channel.members if not m.bot)
    
    return {
        "in_voice": player_in_voice,
        "channel_name": channel.name if player_in_voice else None
    }
    
async def handle_phase_change(request):
    """Change la phase et gère le mute/unmute."""
    try:
        data = await request.json()
        phase = data.get("phase")
        
        if phase not in ["idle", "night", "day"]:
            return web.json_response({"error": "Invalid phase"}, status=400)
        
        channel = state["voice_channel"]
        if not channel:
            return web.json_response({"error": "No voice channel configured"}, status=400)
        
        should_mute = (phase == "night")
        muted_count = 0
        
        for member in channel.members:
            if not member.bot:
                try:
                    await member.edit(mute=should_mute)
                    muted_count += 1
                except Exception as e:
                    print(f"Erreur mute {member}: {e}")
        
        state["phase"] = phase
        
        return web.json_response({
            "success": True,
            "phase": phase,
            "players_affected": muted_count
        })
    
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_get_players(request):
    """Retourne la liste des joueurs dans le vocal."""
    try:
        channel = state["voice_channel"]
        if not channel:
            return web.json_response({"error": "No voice channel"}, status=400)
        
        players = []
        for member in channel.members:
            if not member.bot:
                players.append({
                    "id": str(member.id),
                    "username": member.name,
                    "display_name": member.display_name,
                    "avatar_url": str(member.display_avatar.url),
                    "is_muted": member.voice.mute if member.voice else False,
                    "is_deafened": member.voice.deaf if member.voice else False,
                })
        
        return web.json_response({
            "success": True,
            "players": players,
            "current_phase": state["phase"]
        })
    
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_play_sound(request):
    """Joue un son dans le canal vocal."""
    try:
        data = await request.json()
        sound_type = data.get("sound")  # "night", "day", "death", "victory"
        
        # TODO: Implémenter la lecture audio avec FFmpeg
        # Pour l'instant, on retourne juste un succès
        
        return web.json_response({
            "success": True,
            "sound": sound_type,
            "message": "Sound playback not implemented yet"
        })
    
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


async def handle_health_check(request):
    """Endpoint de santé pour vérifier que le bot est actif."""
    return web.json_response({
        "status": "ok",
        "bot_name": str(bot.user),
        "phase": state["phase"],
        "voice_channel_configured": state["voice_channel"] is not None
    })


async def start_api_server():
    """Démarre le serveur HTTP."""
    app = web.Application()
    
    app.router.add_post('/api/phase', handle_phase_change)
    app.router.add_get('/api/players', handle_get_players)
    app.router.add_post('/api/sound', handle_play_sound)
    app.router.add_get('/api/health', handle_health_check)
    
    async def cors_middleware(app, handler):
        async def middleware_handler(request):
            if request.method == "OPTIONS":
                response = web.Response()
            else:
                response = await handler(request)
            
            response.headers['Access-Control-Allow-Origin'] = '*'
            response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            return response
        return middleware_handler
    
    app.middlewares.append(cors_middleware)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', API_PORT)
    await site.start()
    print(f"✅ API serveur démarré sur http://0.0.0.0:{API_PORT}")


@bot.event
async def on_connect():
    """Démarre l'API au démarrage du bot."""
    bot.loop.create_task(start_api_server())


# ========== Démarrage ==========

if __name__ == "__main__":
    if not BOT_TOKEN:
        print("❌ BOT_TOKEN manquant dans .env")
        exit(1)
    
    try:
        bot.run(BOT_TOKEN)
    except Exception as e:
        print(f"❌ Erreur : {e}")

