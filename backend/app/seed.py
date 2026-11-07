"""Seed the database with the Voltra catalog (12 products).

Run from backend/:
    python app/seed.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import Product  # noqa: E402

CATALOG = [
    dict(id=1, category="audio", name="Pulse Cans Pro", price_cents=19900, old_price_cents=24900,
         rating=4.8, tag="sale", emoji="🎧", grad="linear-gradient(135deg,#6c5ce7,#4834d4)",
         short_desc="Noise-cancelling over-ear headphones", stock=14,
         colors=[{"name": "Midnight Purple", "hex": "#6c5ce7"}, {"name": "Ghost White", "hex": "#dfe6e9"}, {"name": "Stealth Black", "hex": "#2d3436"}],
         features=["Adaptive noise cancellation with 3 listen modes", "40-hour battery — 5 min charge gives 4 hours",
                   "Dual-mode audio: Hi-Res certified, LDAC support", "Memory-foam earcups, 1-year no-break hinge warranty"],
         specs=[["Driver", "40 mm graphene-coated dynamic"], ["Battery", "40 h (ANC on) / 60 h (off)"],
                ["Bluetooth", "v5.3 · multipoint (2 devices)"], ["Weight", "254 g"], ["In the box", "Case, USB-C cable, 3.5 mm wire"]],
         long_desc="Pulse Cans Pro are built for people who listen loud but think quiet. The adaptive ANC reads your environment 20,000 times per second and dials in cancellation on the fly — jet engine on the plane, office murmur at your desk, crickets on the porch. A 40-hour battery means you plan charges around seasons, not commutes. Earcups are memory foam wrapped in protein leather, and the whole thing folds to the size of a doughnut."),
    dict(id=2, category="audio", name="Pixel Buds Air", price_cents=8900, old_price_cents=None,
         rating=4.5, tag=None, emoji="🎵", grad="linear-gradient(135deg,#00b8d4,#01579b)",
         short_desc="True wireless earbuds, 30h battery", stock=42,
         colors=[{"name": "Ocean Blue", "hex": "#0288d1"}, {"name": "Carbon", "hex": "#37474f"}],
         features=["8 h per charge · 30 h total with pocket case", "Transparency mode that actually sounds natural",
                   "IPX5 — rain, sweat and regret-proof", "Instant pairing: open the case and you're connected"],
         specs=[["Driver", "11 mm with dual-chamber vent"], ["Battery", "8 h buds / 30 h total"],
                ["Bluetooth", "v5.2 · single device"], ["Waterproof", "IPX5 (buds + case splash-proof)"],
                ["In the box", "3 ear-tip sizes, USB-C cable"]],
         long_desc="Pixel Buds Air disappear in your ears the way good tech should. They're 4.1 g per bud, sit flush without hooks or wings, and the low-latency game mode keeps audio in sync when you're fragging. The case is genuinely pocketable — smaller than a matchbox — and charges wirelessly if you set it down on any Qi pad."),
    dict(id=3, category="audio", name="BoomBox Mini", price_cents=5900, old_price_cents=7900,
         rating=4.3, tag="sale", emoji="🔊", grad="linear-gradient(135deg,#ff6b3d,#e7316b)",
         short_desc="Waterproof pocket speaker", stock=27,
         colors=[{"name": "Sunset Red", "hex": "#e7316b"}, {"name": "Storm Grey", "hex": "#576574"}],
         features=["24 W output with passive bass radiators", "IP67 — submerge it, it doesn't mind",
                   "12 h playtime · pairs two for stereo", "USB-C + lanyard loop for bike handlebars"],
         specs=[["Output", "24 W (2 × 12 W drivers)"], ["Battery", "12 h at 60% volume"],
                ["Waterproof", "IP67 full submersion"], ["Bluetooth", "v5.1 · stereo pairing"],
                ["In the box", "Lanyard, USB-C cable"]],
         long_desc="The BoomBox Mini punches far above its 540 g body. Two 12 W drivers and twin passive radiators produce bass with actual stomach-feel, not the sad tin most pocket speakers ship with. IP67 sealing means poolside, beach and shower duty without a thought, and stereo pairing with a second unit fills a room properly."),
    dict(id=4, category="phones", name="VPhone X5", price_cents=89900, old_price_cents=None,
         rating=4.9, tag="hot", emoji="📱", grad="linear-gradient(135deg,#0f2027,#2c5364)",
         short_desc="6.7\" OLED · 5G · 512GB", stock=8,
         colors=[{"name": "Deep Sea", "hex": "#2c5364"}, {"name": "Frost", "hex": "#c8d6e5"}, {"name": "Obsidian", "hex": "#130f40"}],
         features=["6.7\" 120 Hz LTPO OLED · 2000 nits peak", "Triple camera: 50 MP main, 12 MP ultra-wide, 10 MP 3× tele",
                   "512 GB storage · 12 GB RAM · 5 Gb/s 5G", "5000 mAh with 80 W wired charging"],
         specs=[["Display", "6.7\" LTPO OLED · 120 Hz · 2000 nits"], ["Chipset", "Voltra N1 · 3 nm"],
                ["Memory", "12 GB RAM · 512 GB"], ["Camera", "50 MP + 12 UW + 10 tele · 4K60"],
                ["Battery", "5000 mAh · 80 W / 15 W wireless"]],
         long_desc="VPhone X5 is our no-compromise flagship. The LTPO display drops to 1 Hz on your lock screen and snaps to 120 Hz the moment your finger moves, and the 3 nm N1 chip beats last year's desktops across the board. The camera system is tuned for photo-first people: a large-sensor 50 MP main with OIS, a genuinely useful 3× telephoto, and an ultra-wide that doesn't smudge edges. Night shots look like the scene, not the sensor's imagination."),
    dict(id=5, category="phones", name="VPhone Lite", price_cents=44900, old_price_cents=49900,
         rating=4.4, tag="sale", emoji="☎️", grad="linear-gradient(135deg,#11998e,#38ef7d)",
         short_desc="Flagship feel, mid-range price", stock=31,
         colors=[{"name": "Mint", "hex": "#38ef7d"}, {"name": "Slate", "hex": "#636e72"}],
         features=["6.4\" 90 Hz OLED — no LCD compromise", "Snapdragon-class mid chip · 256 GB",
                   "Dual camera 48 MP + 8 MP ultra-wide", "4500 mAh with 67 W charge"],
         specs=[["Display", "6.4\" OLED · 90 Hz"], ["Chipset", "Voltra L2 · 4 nm"],
                ["Memory", "8 GB RAM · 256 GB"], ["Camera", "48 MP OIS + 8 MP ultra-wide"],
                ["Battery", "4500 mAh · 67 W"]],
         long_desc="VPhone Lite keeps the three things that make a phone feel expensive — a proper OLED screen, fast charging, and fluid software — and spends nothing on the parts that don't. You get a 90 Hz OLED with narrow bezels, 67 W charging that fills the battery over coffee, and a 48 MP OIS main camera that's honest in daylight and decent at night."),
    dict(id=6, category="laptops", name="AirBook 14", price_cents=129900, old_price_cents=None,
         rating=4.9, tag="new", emoji="💻", grad="linear-gradient(135deg,#414345,#8e9eab)",
         short_desc="14\" laptop · 18h battery · 1TB", stock=11,
         colors=[{"name": "Titanium", "hex": "#8e9eab"}, {"name": "Space Black", "hex": "#2d3436"}],
         features=["14\" 2.8K 120 Hz display · 500 nits", "Voltra V3 chip — silent, fanless under daily load",
                   "18 h real-world battery · 65 W GaN in-box", "1 TB SSD · 16 GB unified memory"],
         specs=[["Display", "14\" 2.8K OLED-class IPS · 120 Hz"], ["Chipset", "Voltra V3 · 10-core"],
                ["Memory", "16 GB unified · 1 TB SSD"], ["Weight", "1.24 kg"],
                ["Ports", "2 × USB-C, HDMI 2.1, SD, 3.5 mm"]],
         long_desc="AirBook 14 is the laptop we recommend when someone says they just want a laptop for everything. The V3 chip is fanless for browsing, email and code — the fan only whispers at full compile — and the 2.8K 120 Hz display makes scrolling feel wet. At 1.24 kg with an 18-hour day of real work in it, you'll stop carrying the charger by week one."),
    dict(id=7, category="laptops", name="CreatorBook Pro 16", price_cents=189900, old_price_cents=209900,
         rating=4.7, tag="sale", emoji="🖥️", grad="linear-gradient(135deg,#3a1c71,#d76d77)",
         short_desc="For creators who don't wait", stock=6,
         colors=[{"name": "Ink & Rose", "hex": "#d76d77"}, {"name": "Onyx", "hex": "#130f40"}],
         features=["16\" 4K 100% DCI-P3 factory-calibrated", "Render-ready: 14-core V3 Pro + 48 GB RAM",
                   "Thunder-class I/O: 4 × USB-C, HDMI, full-size SD", "Vapor-chamber cooling, 120 W sustained"],
         specs=[["Display", "16\" 4K mini-LED · 100% DCI-P3"], ["Chipset", "Voltra V3 Pro · 14-core"],
                ["Memory", "48 GB unified · 4 TB SSD"], ["Weight", "2.1 kg"],
                ["Ports", "4 × USB-C, HDMI 2.1, SD UHS-II"]],
         long_desc="CreatorBook Pro 16 exists for timelines, not spreadsheets. The 4K mini-LED panel hits 1600 nits HDR with 100% DCI-P3 out of the box — no calibration dongle, no excuses. The vapor chamber holds 120 W under a full Resolve export without turning your desk into a jet engine."),
    dict(id=8, category="wearables", name="Pulse Watch S", price_cents=27900, old_price_cents=None,
         rating=4.6, tag="new", emoji="⌚", grad="linear-gradient(135deg,#1e3c72,#2a5298)",
         short_desc="Health tracking, 7-day battery", stock=19,
         colors=[{"name": "Deep Blue", "hex": "#2a5298"}, {"name": "Rose Gold", "hex": "#e0a7a7"}],
         features=["1.9\" always-on AMOLED · sapphire grip", "ECG, blood oxygen, skin-temperature sensing",
                   "7-day battery · 100+ activity modes", "5 ATM — swim without a second thought"],
         specs=[["Display", "1.9\" AMOLED · 2000 nits"], ["Sensors", "ECG, SpO₂, HR, skin temp, GPS"],
                ["Battery", "7 days · 30 h with GPS"], ["Waterproof", "5 ATM + IP68"],
                ["In the box", "Two bands (sport + daily)"]],
         long_desc="Pulse Watch S is a health instrument that happens to be pretty. It takes an ECG you can save for your doctor, reads blood oxygen passively all night, and its sleep tracking is scarily close to lab polysomnography. The always-on AMOLED is readable in direct sun at 2000 nits, and the 7-day battery means weekly top-ups become part of your Sunday routine."),
    dict(id=9, category="wearables", name="Track Band 3", price_cents=7900, old_price_cents=None,
         rating=4.2, tag=None, emoji="📟", grad="linear-gradient(135deg,#8e2de2,#4a00e0)",
         short_desc="Sleep, steps & heart rate", stock=55,
         colors=[{"name": "Violet", "hex": "#8e2de2"}, {"name": "Jet", "hex": "#5758BB"}],
         features=["All-day heart rate + night sleep scoring", "14-day battery on a single charge",
                   "Feather-light 22 g band, stays on in the shower", "Silent vibrating alarms and nap timers"],
         specs=[["Display", "1.1\" AMOLED touch"], ["Sensors", "HR, SpO₂, accelerometer"],
                ["Battery", "14 days typical"], ["Waterproof", "IP68"],
                ["In the box", "2 band sizes, USB-A charger"]],
         long_desc="Track Band 3 is the cheapest serious sleep tracker you can buy. It wears like nothing — 22 g, no bezel snag on doorframes — and lasts two weeks so it never becomes another thing to charge just when you needed the data."),
    dict(id=10, category="accessories", name="FastCharge 65W GaN", price_cents=3900, old_price_cents=None,
         rating=4.7, tag=None, emoji="🔌", grad="linear-gradient(135deg,#f7971e,#ffd200)",
         short_desc="Charges laptops, phones, tabs", stock=64,
         colors=[{"name": "Solar Yellow", "hex": "#ffd200"}],
         features=["65 W — enough for any USB-C laptop", "Two ports with smart power split 45+20",
                   "GaN III internals: half the size of old bricks", "Foldable pins, travel-ready body"],
         specs=[["Output", "USB-C 65 W · USB-C 20 W"], ["Tech", "GaN III · PD 3.0 / PPS"],
                ["Size", "62 × 55 × 30 mm"], ["Safety", "20+ protections, 2-year warranty"],
                ["In the box", "Adapter + 100 W e-marked cable"]],
         long_desc="One brick to replace the drawer of them. FastCharge 65W runs a 16-inch laptop solo, or splits to 45 W + 20 W so your laptop and phone fill together on the same wall socket. GaN III means it's genuinely small with foldable pins, and we include a proper 100 W-rated cable because shipping chargers without cables is a crime."),
    dict(id=11, category="accessories", name="PocketDrive 2TB", price_cents=12900, old_price_cents=14900,
         rating=4.5, tag="sale", emoji="💾", grad="linear-gradient(135deg,#005c97,#363795)",
         short_desc="USB-C SSD · 1050 MB/s reads", stock=23,
         colors=[{"name": "Midnight Blue", "hex": "#363795"}],
         features=["1050 MB/s — a 4K proxy project comes over in seconds", "2 TB in a credit-card-sized die-cast shell",
                   "No external power, no cables to babysit — one USB-C", "Drop-rated to 1.9 m"],
         specs=[["Capacity", "2 TB"], ["Speed", "1050 MB/s read · 1000 MB/s write"],
                ["Interface", "USB 3.2 Gen 2 USB-C"], ["Build", "Die-cast aluminium · IP54"],
                ["In the box", "USB-C to C cable"]],
         long_desc="PocketDrive 2TB is the drive that lives in your bag and behaves like internal storage. Reads at 1050 MB/s over a single USB-C — a 100 GB cache folder moves in under two minutes — while the die-cast aluminium body shrugs off drops, rain splashes and your backpack's worst instincts."),
    dict(id=12, category="accessories", name="Grip Mat Wireless", price_cents=4900, old_price_cents=None,
         rating=4.1, tag=None, emoji="🖱️", grad="linear-gradient(135deg,#232526,#950d3d)",
         short_desc="Charging mouse pad (RGB)", stock=37,
         colors=[{"name": "Crimson", "hex": "#950d3d"}, {"name": "Graphite", "hex": "#4b4b4b"}],
         features=["Qi wireless charging zone built into the mat", "Lux-grain surface — precise tracking, no drag",
                   "Edge-lit RGB with 7 presets + off", "Anti-slip rubber base stays put through swings"],
         specs=[["Size", "80 × 30 cm"], ["Charging", "Qi 15 W zone (top-left)"],
                ["Lighting", "RGB edge · 7 presets"], ["Base", "Anti-slip rubber"],
                ["In the box", "USB-C cable"]],
         long_desc="Grip Mat Wireless is the last desk accessory you keep — charging pad and mouse mat merged into one lag-free surface. The textile is tuned for high-DPI mice with consistent tracking across the whole 80 cm span, the Qi zone quietly fills your phone at idle, and there are seven edge-glow presets — which turn all the way off if you're not into that."),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing = db.query(Product).count()
        if existing:
            print(f"Database already has {existing} products — skipping seed.")
            return
        for row in CATALOG:
            db.add(Product(**row))
        db.commit()
        print(f"Seeded {len(CATALOG)} products ✔")


if __name__ == "__main__":
    seed()
