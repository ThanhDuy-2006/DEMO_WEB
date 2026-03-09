import random
import re
import time
import os
from playwright.sync_api import sync_playwright
import data
import google.generativeai as genai
from groq import Groq

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0 Safari/537.36"
]

class GoogleFormBot:
    def __init__(self, config, log_callback):
        self.config = config
        self.log = log_callback
        self.stop_flag = False
        self.proxies = self.load_proxies() if config.get("USE_PROXY") else []
        self._setup_ai()
        self.rpm = int(config.get("RPM", 0)) # Rate Limit (Requests per minute)
        
    def _setup_ai(self):
        self.use_ai = self.config.get("USE_AI", False)
        self.provider = self.config.get("AI_PROVIDER", "GEMINI") # GEMINI or GROQ
        self.api_key = self.config.get("AI_API_KEY", "")
        self.ai_client = None
        
        if self.use_ai and self.api_key:
            try:
                if self.provider == "GEMINI":
                    genai.configure(api_key=self.api_key)
                    # Use fixed model list as requested for stability
                    self.gemini_model_name = "gemini-1.5-flash"
                    try:
                         # Validate model access simply by creating it, no listing loop
                         test_model = genai.GenerativeModel(self.gemini_model_name)
                    except:
                        self.gemini_model_name = "gemini-1.5-flash-001"
                        
                    self.ai_client = genai.GenerativeModel(self.gemini_model_name)
                    self.log(f"🤖 AI SYSTEM: ONLINE (GEMINI: {self.gemini_model_name})")
                    
                elif self.provider == "GROQ":
                    self.ai_client = Groq(api_key=self.api_key, timeout=20.0) # Set default timeout
                    self.groq_model = "llama-3.1-8b-instant"
                    self.log(f"🤖 AI SYSTEM: ONLINE (GROQ: {self.groq_model})")
            except Exception as e:
                self.log(f"⚠️ AI INIT FAILED: {e}")
                
    def load_proxies(self):
        proxies = []
        path = self.config.get("PROXY_FILE", "proxies.txt")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        proxies.append(line)
        self.log(f"📡 SYSTEM LOADED: {len(proxies)} PROXIES")
        return proxies

    def get_proxy_config(self):
        if not self.config.get("USE_PROXY") or not self.proxies:
            return None
        proxy_str = random.choice(self.proxies)
        server = proxy_str
        username = None
        password = None
        if "@" in proxy_str:
            auth, endpoint = proxy_str.split("@", 1)
            server = endpoint
            if ":" in auth:
                username, password = auth.split(":", 1)
        if "://" not in server:
            server = f"http://{server}"
        proxy_config = {"server": server}
        if username and password:
            proxy_config["username"] = username
            proxy_config["password"] = password
        return proxy_config

    def get_choice(self, total, mood="RANDOM"):
        indices = list(range(total))
        if total <= 1: return 0
        
        if mood == "LOVING":    # Thiên về cuối
            weights = [2**i for i in range(total)]
        elif mood == "HATING":  # Thiên về đầu
            weights = [2**(total-1-i) for i in range(total)]
        elif mood == "NEUTRAL": # Thiên về giữa
            mid = (total - 1) / 2
            weights = [1 / (abs(i - mid) + 0.5) for i in range(total)]
        else: # RANDOM đều
            weights = [1] * total
            
        return random.choices(indices, weights=weights, k=1)[0]

    def is_opinion_question(self, text):
        t = text.lower()
        keywords_demographic = ["tuổi", "giới tính", "thu nhập", "nghề nghiệp", "năm sinh", "họ tên", "địa chỉ", "khoa", "lớp", "email", "sđt", "điện thoại"]
        if any(k in t for k in keywords_demographic): return False
        return True 
        
    def generate_ai_response(self, question, mood):
        if not self.ai_client: return None
        try:
            # Xử lý mood thành prompt
            mood_desc = ""
            if mood == "LOVING": mood_desc = "Rất hài lòng, yêu thích, tích cực, khen ngợi hết lời."
            elif mood == "HATING": mood_desc = "Rất thất vọng, khó chịu, tiêu cực, chê bai gay gắt."
            elif mood == "NEUTRAL": mood_desc = "Bình thường, trung lập, khách quan, không khen không chê."
            else: mood_desc = "Ngẫu nhiên, tự nhiên."

            prompt = f"Bạn đang làm một bài khảo sát. Câu hỏi là: '{question}'. Hãy đóng vai một người dùng có tâm trạng: '{mood_desc}'. Hãy viết một câu trả lời ngắn gọn (dưới 15 từ), tự nhiên, bằng tiếng Việt. Chỉ viết nội dung câu trả lời, không viết gì thêm."
            
            response_text = ""
            
            if self.provider == "GEMINI":
                try:
                    # Added request_options with timeout
                    response = self.ai_client.generate_content(prompt, request_options={'timeout': 15})
                    response_text = response.text
                except Exception:
                    # Fallback
                    try:
                        fallback_model = genai.GenerativeModel('gemini-1.5-flash')
                        response = fallback_model.generate_content(prompt, request_options={'timeout': 15})
                        response_text = response.text
                    except: return None
                
            elif self.provider == "GROQ":
                chat_completion = self.ai_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "Bạn là một người dùng Việt Nam đang điền form khảo sát. Trả lời ngắn gọn, tự nhiên."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.groq_model,
                    temperature=0.7,
                    max_tokens=50,
                    timeout=15.0 # Explicit timeout
                )
                response_text = chat_completion.choices[0].message.content

            return response_text.strip()
            
        except Exception as e:
            self.log(f"⚠️ AI ERROR ({self.provider}): {e}")
            return None

    def get_smart_text(self, label, mood):
        l = label.lower()
        
        # 1. Thông tin cá nhân (Fake Data)
        if "họ tên" in l or "tên" in l: return random.choice(data.FULL_NAMES)
        if "ngành" in l or "nghề" in l or "công việc" in l or "lớp" in l or "khoa" in l: return random.choice(data.JOBS)
        if "địa chỉ" in l or "sinh sống" in l or "ở đâu" in l: return random.choice(data.LOCATIONS)
        if "email" in l or "thư" in l: return random.choice(data.EMAILS).format(rand=random.randint(100, 999))
        if "sđt" in l or "điện thoại" in l or "số" in l: return f"09{random.randint(10000000, 99999999)}"

        # 2. AI Generation
        if self.use_ai:
            ai_reply = self.generate_ai_response(label, mood)
            if ai_reply: return ai_reply

        # 3. Fallback Data
        target_pool = []
        if mood == "LOVING": target_pool = data.LOVING_TEXTS
        elif mood == "HATING": target_pool = data.HATING_TEXTS
        else: target_pool = data.NEUTRAL_TEXTS + data.LOVING_TEXTS if mood == "MIXED" else data.NEUTRAL_TEXTS

        return random.choice(target_pool)

    def safe_click(self, page, idx, text):
        page.evaluate('''
            (args) => {
                const blocks = Array.from(document.querySelectorAll('div[role="listitem"]'));
                const targetBlock = blocks.find(b => b.innerText.includes(args.qText));
                if (targetBlock) {
                    const choices = targetBlock.querySelectorAll('div[role="checkbox"], div[role="radio"]');
                    if (choices[args.targetIdx]) {
                        const item = choices[args.targetIdx];
                        if (item.getAttribute("aria-checked") !== "true") item.click();
                    }
                }
            }
        ''', { "qText": text, "targetIdx": idx })

    def fill_page(self, page, current_mood):
        try:
            questions = page.locator('div[role="listitem"]')
            if questions.count() == 0:
                page.wait_for_selector('div[role="listitem"]', timeout=3000)
        except: pass

        for i in range(questions.count()):
            if self.stop_flag: return
            q = questions.nth(i)
            text = q.inner_text()
            if not text: continue
            
            first_line = text.split('\n')[0]
            is_rating = self.is_opinion_question(first_line)
            mood_to_use = current_mood if is_rating else "RANDOM"

            options = q.locator('div[role="checkbox"], div[role="radio"]')
            cnt = options.count()
            if cnt > 0:
                target = self.get_choice(cnt, mood_to_use)
                self.safe_click(page, target, first_line)

        # Điền Text Input
        for i in range(questions.count()):
            if self.stop_flag: return
            q = questions.nth(i)
            text = q.inner_text()
            if not text: continue
            label = text.split('\n')[0]
            
            inp = q.locator('input[type="text"], textarea')
            if inp.count() > 0:
                if inp.first.is_visible() and not inp.first.input_value():
                    smart_content = self.get_smart_text(label, current_mood)
                    inp.first.fill(smart_content)

    def run(self):
        self.stop_flag = False
        total = int(self.config["TOTAL_SUBMISSIONS"])
        url = self.config["FORM_URL"]
        headless = self.config["HEADLESS"]
        target_mood = self.config.get("TARGET_MOOD", "MIXED")
        
        self.log(f"🚀 BẮT ĐẦU CHIẾN DỊCH... MỤC TIÊU: {total}")
        self.log(f"🔗 URL: {url}")
        self.log(f"🤖 AI MODUS: {self.provider if self.use_ai else 'OFFLINE'}")
        
        # Rate Limit calculation
        delay_per_req = 0
        if self.rpm > 0:
            delay_per_req = 60.0 / self.rpm
            self.log(f"⏱️ GIỚI HẠN TỐC ĐỘ: {self.rpm} ĐƠN/PHÚT (Delay {delay_per_req:.1f}s)")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            success = 0
            
            for i in range(total):
                if self.stop_flag:
                    self.log("🛑 ĐÃ DỪNG LỆNH.")
                    break
                
                # Rate Check
                if i > 0 and delay_per_req > 0:
                    time.sleep(delay_per_req)

                if target_mood == "MIXED":
                    mood = random.choices(["LOVING", "HATING", "NEUTRAL"], weights=[60, 20, 20], k=1)[0]
                else:
                    mood = target_mood
                
                ctx = browser.new_context(
                    proxy=self.get_proxy_config(),
                    user_agent=random.choice(USER_AGENTS),
                    viewport={"width": random.randint(1000, 1600), "height": random.randint(600, 900)}
                )
                page = ctx.new_page()
                
                try:
                    self.log(f"--- #{i+1} | {mood} ---")
                    page.goto(url, timeout=30000)
                    page.wait_for_load_state("networkidle")
                    
                    while not self.stop_flag:
                        self.fill_page(page, mood)
                        
                        btn_sub = page.get_by_role("button", name=re.compile(r"Gửi|Submit", re.I))
                        btn_next = page.get_by_role("button", name=re.compile(r"Tiếp|Next", re.I))
                        
                        if btn_sub.is_visible():
                            btn_sub.click()
                            try:
                                page.wait_for_selector(".freebirdFormviewerViewResponseConfirmationMessage", timeout=5000)
                                self.log(f"✅ #{i+1}: DONE")
                                success += 1
                            except:
                                self.log(f"⚠️ #{i+1}: NO CONFIRM")
                            break
                        elif btn_next.is_visible():
                            btn_next.click()
                            page.wait_for_load_state("networkidle")
                        else: break
                        
                except Exception as e:
                    self.log(f"❌ #{i+1} ERROR: {str(e)[:40]}")
                finally:
                    ctx.close()
            
            browser.close()
            self.log(f"🏁 DONE. SUCCESS: {success}/{total}")
