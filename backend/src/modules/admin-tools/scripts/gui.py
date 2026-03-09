import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import threading
import time
from bot import GoogleFormBot
import os

# Config Mặc định
# Config Mặc định
DEFAULT_URL = ""

def load_env_key():
    key = os.environ.get("AI_API_KEY", "")
    if not key and os.path.exists(".env"):
        try:
            with open(".env", "r", encoding="utf-8") as f:
                for line in f:
                    if line.strip().startswith("AI_API_KEY="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
        except: pass
    return key

DEFAULT_API_KEY = load_env_key()

class SciFiApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("DỰ ÁN: AUTO-FORM [ULTIMATE v4.1]")
        self.geometry("700x900")
        
        self.colors = {
            "bg_dark": "#050a14",
            "bg_light": "#0a192f",
            "neon_cyan": "#00f0ff",
            "neon_pink": "#ff0055",
            "text": "#ffffff",
            "dim": "#8892b0",
            "neon_yell": "#ffd700"
        }
        
        self.configure(bg=self.colors["bg_dark"])
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        self.configure_styles()
        self.create_widgets()
        self.bot_instance = None
        self.blink_state = False
        self.blink_url_input()

    def configure_styles(self):
        self.style.configure("TFrame", background=self.colors["bg_dark"])
        
        # Labels
        self.style.configure("TLabel", background=self.colors["bg_light"], foreground=self.colors["neon_cyan"], font=("Consolas", 10))
        self.style.configure("Title.TLabel", background=self.colors["bg_dark"], foreground=self.colors["neon_cyan"], font=("Consolas", 24, "bold"))
        
        # Standard Buttons
        self.style.configure("TButton", 
                             font=("Consolas", 12, "bold"), 
                             background=self.colors["neon_cyan"], 
                             foreground=self.colors["bg_dark"],
                             borderwidth=0, focuscolor=self.colors["text"])
        self.style.map("TButton", 
                       background=[("active", self.colors["text"])], 
                       foreground=[("active", self.colors["bg_dark"])])
        
        # Danger Buttons
        self.style.configure("Danger.TButton", 
                             font=("Consolas", 12, "bold"), 
                             background=self.colors["neon_pink"], 
                             foreground="white", borderwidth=0)
        self.style.map("Danger.TButton", background=[("active", "#d40049")])

    def create_widgets(self):
        # HEAD
        logo_frame = ttk.Frame(self)
        logo_frame.pack(fill="x", padx=20, pady=(20, 10))
        ttk.Label(logo_frame, text="AUTO-FORM ULTIMATE", style="Title.TLabel").pack(anchor="center")
        ttk.Label(logo_frame, text="MULTI-AI ENGINE | RATE LIMITER SYSTEM", background=self.colors["bg_dark"], foreground=self.colors["neon_yell"], font=("Consolas", 10)).pack(anchor="center")
        
        # BODY
        panel = tk.Frame(self, bg=self.colors["bg_light"], bd=1, relief="solid")
        panel.config(highlightbackground=self.colors["neon_cyan"], highlightthickness=1)
        panel.pack(fill="x", padx=20, pady=10)
        
        # 1. FORM INFO
        tk.Label(panel, text=" [1] CẤU HÌNH MỤC TIÊU ", bg=self.colors["bg_light"], fg=self.colors["neon_cyan"], font=("Consolas", 11, "bold")).pack(anchor="w", padx=10, pady=(10, 5))
        
        f1 = tk.Frame(panel, bg=self.colors["bg_light"])
        f1.pack(fill="x", padx=15, pady=5)
        
        self.lbl_url = tk.Label(f1, text="URL:", bg=self.colors["bg_light"], fg="white", font=("Consolas", 10, "bold"))
        self.lbl_url.pack(side="left")
        
        self.url_var = tk.StringVar(value=DEFAULT_URL)
        self.entry_url = tk.Entry(f1, textvariable=self.url_var, bg=self.colors["bg_dark"], fg=self.colors["neon_cyan"], width=40, font=("Consolas", 10), insertbackground="white")
        self.entry_url.pack(side="left", fill="x", expand=True, padx=5)
        
        tk.Label(f1, text="SL:", bg=self.colors["bg_light"], fg="white").pack(side="left")
        self.count_var = tk.IntVar(value=100)
        tk.Spinbox(f1, from_=1, to=9999, textvariable=self.count_var, width=5, bg=self.colors["bg_dark"], fg="white").pack(side="left", padx=5)

        # 2. AI CONFIG
        tk.Label(panel, text=" [2] TRÍ TUỆ NHÂN TẠO (AI) ", bg=self.colors["bg_light"], fg=self.colors["neon_yell"], font=("Consolas", 11, "bold")).pack(anchor="w", padx=10, pady=(15, 5))
        
        f2 = tk.Frame(panel, bg=self.colors["bg_light"])
        f2.pack(fill="x", padx=15, pady=5)
        
        # AI Provider
        tk.Label(f2, text="PROVIDER:", bg=self.colors["bg_light"], fg="white").grid(row=0, column=0, sticky="w", pady=5)
        self.provider_var = tk.StringVar(value="GROQ") # Default to GROQ as user requested
        cb_prov = ttk.Combobox(f2, textvariable=self.provider_var, values=("GEMINI", "GROQ"), state="readonly", width=10)
        cb_prov.grid(row=0, column=1, padx=5, sticky="w")
        
        # AI Key
        tk.Label(f2, text="API KEY:", bg=self.colors["bg_light"], fg="white").grid(row=1, column=0, sticky="w", pady=5)
        self.api_key_var = tk.StringVar(value=DEFAULT_API_KEY)
        tk.Entry(f2, textvariable=self.api_key_var, bg=self.colors["bg_dark"], fg="white", width=40).grid(row=1, column=1, padx=5, sticky="ew")
        
        # AI Toggle
        self.ai_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(f2, text="KÍCH HOẠT AI", variable=self.ai_var).grid(row=0, column=2, padx=10, rowspan=2)

        # 3. BEHAVIOR
        tk.Label(panel, text=" [3] HÀNH VI & KẾT NỐI ", bg=self.colors["bg_light"], fg="white", font=("Consolas", 11, "bold")).pack(anchor="w", padx=10, pady=(15, 5))
        
        f3 = tk.Frame(panel, bg=self.colors["bg_light"])
        f3.pack(fill="x", padx=15, pady=(5, 20))
        
        # Mood
        tk.Label(f3, text="MOOD:", bg=self.colors["bg_light"], fg="white").pack(side="left")
        self.mood_var = tk.StringVar()
        cb_mood = ttk.Combobox(f3, textvariable=self.mood_var, values=("HỖN HỢP", "LOVING (YÊU)", "HATING (GHÉT)", "NEUTRAL (BÌNH THƯỜNG)"), state="readonly", width=18)
        cb_mood.current(0)
        cb_mood.pack(side="left", padx=5)
        
        # Rate Limit
        tk.Label(f3, text="TỐC ĐỘ (RPM):", bg=self.colors["bg_light"], fg=self.colors["neon_pink"]).pack(side="left", padx=(15, 0))
        self.rpm_var = tk.IntVar(value=10)
        tk.Spinbox(f3, from_=0, to=60, textvariable=self.rpm_var, width=5, bg=self.colors["bg_dark"], fg="white").pack(side="left", padx=5)
        
        # Checks
        self.proxy_var = tk.BooleanVar(value=False)
        self.headless_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(f3, text="PROXY", variable=self.proxy_var).pack(side="right")
        ttk.Checkbutton(f3, text="HEADLESS", variable=self.headless_var).pack(side="right", padx=10)

        # CONTROLS
        btn_frame = ttk.Frame(self)
        btn_frame.pack(fill="x", padx=30, pady=10)
        
        self.btn_start = ttk.Button(btn_frame, text=">>> KHỞI CHẠY HỆ THỐNG <<<", command=self.start_bot)
        self.btn_start.pack(fill="x", pady=(0, 10), ipady=10)
        
        self.btn_stop = ttk.Button(btn_frame, text="[ NGẮT KẾT NỐI ]", style="Danger.TButton", command=self.stop_bot, state="disabled")
        self.btn_stop.pack(fill="x", pady=0, ipady=5)
        
        # LOGGER
        log_frame = tk.Frame(self, bg=self.colors["bg_dark"], bd=1, relief="sunken")
        log_frame.pack(fill="both", expand=True, padx=20, pady=(10, 20))
        self.log_area = scrolledtext.ScrolledText(log_frame, bg="black", fg="#00ff00", font=("Consolas", 9), state="disabled", borderwidth=0)
        self.log_area.pack(fill="both", expand=True, padx=2, pady=2)

    def blink_url_input(self):
        try:
            if not self.url_var.get():
                current_color = self.entry_url.cget("bg")
                target_color = self.colors["neon_pink"] if self.blink_state else self.colors["bg_dark"]
                self.entry_url.config(bg=target_color)
                self.blink_state = not self.blink_state
            else:
                self.entry_url.config(bg=self.colors["bg_dark"])
                
            self.after(500, self.blink_url_input)
        except Exception: pass

    def log(self, message):
        self.after(0, self._log_to_ui, message)
        
    def _log_to_ui(self, message):
        self.log_area.config(state="normal")
        self.log_area.insert(tk.END, f"> {time.strftime('%H:%M:%S')} | {message}\n")
        self.log_area.see(tk.END)
        self.log_area.config(state="disabled")

    def start_bot(self):
        url = self.url_var.get()
        if not url:
            messagebox.showerror("ERROR", "VUI LÒNG NHẬP URL!")
            return
        
        mood_map = {
            "HỖN HỢP": "MIXED",
            "LOVING (YÊU)": "LOVING",
            "HATING (GHÉT)": "HATING",
            "NEUTRAL (BÌNH THƯỜNG)": "NEUTRAL"
        }
        
        config = {
            "FORM_URL": url,
            "TOTAL_SUBMISSIONS": self.count_var.get(),
            "USE_PROXY": self.proxy_var.get(),
            "HEADLESS": self.headless_var.get(),
            "TARGET_MOOD": mood_map.get(self.mood_var.get(), "MIXED"),
            "USE_AI": self.ai_var.get(),
            "AI_PROVIDER": self.provider_var.get(),
            "AI_API_KEY": self.api_key_var.get(),
            "RPM": self.rpm_var.get(),
            "PROXY_FILE": "proxies.txt"
        }
        
        self.btn_start.config(state="disabled")
        self.btn_stop.config(state="normal")
        self.log("SYSTEM: INITIALIZING...")
        
        self.bot_instance = GoogleFormBot(config, log_callback=self.log)
        threading.Thread(target=self.run_process, daemon=True).start()

    def run_process(self):
        try:
            self.bot_instance.run()
        except Exception as e:
            self.log(f"CRITICAL ERROR: {e}")
        finally:
            self.after(0, self.reset_ui)

    def stop_bot(self):
        if self.bot_instance:
            self.bot_instance.stop_flag = True
            self.log("SYSTEM: ABORTING...")
            self.btn_stop.config(state="disabled")

    def reset_ui(self):
        self.btn_start.config(state="normal")
        self.btn_stop.config(state="disabled")
        self.log("SYSTEM: STANDBY.")

if __name__ == "__main__":
    app = SciFiApp()
    app.mainloop()
