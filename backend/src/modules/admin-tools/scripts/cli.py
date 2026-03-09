import sys
import json
import os
import time

# Ensure current script directory is in paths for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

def log_callback(message):
    print(f"{message}")
    sys.stdout.flush()

log_callback("DEBUG: CLI WRAPPER STARTING...")

try:
    import bot
except ImportError as e:
    log_callback(f"❌ CRITICAL ERROR: Lỗi thiếu thư viện Python: {e}")
    sys.exit(1)
except Exception as e:
    log_callback(f"❌ CRITICAL ERROR: Lỗi khởi tạo script: {e}")
    sys.exit(1)

if __name__ == "__main__":
    try:
        # Better compatibility with long JSON strings on Windows via stdin
        if len(sys.argv) > 1:
            raw_config = sys.argv[1]
        else:
            raw_config = sys.stdin.read()
            
        if not raw_config:
            log_callback("❌ CRITICAL: No configuration provided via argv or stdin.")
            sys.exit(1)
            
        config = json.loads(raw_config)
        
        # Override parameters if needed
        config["USE_AI"] = bool(config.get("AI_API_KEY"))
        
        # Proxy file handling (relative to python execution path)
        proxy_path = os.path.join(script_dir, "proxies.txt")
        config["PROXY_FILE"] = proxy_path
        
        log_callback(f"🚀 [CLI-MODE] Initializing GoogleFormBot for: {config['FORM_URL']}")
        
        # Create and Run Bot
        bot_instance = bot.GoogleFormBot(config, log_callback)
        bot_instance.run()
        
    except json.JSONDecodeError:
        log_callback("❌ CRITICAL: Invalid JSON configuration provided.")
        sys.exit(1)
    except Exception as e:
        log_callback(f"❌ CRITICAL BOT ERROR: {str(e)}")
        sys.exit(1)
