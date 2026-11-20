import os
import shutil
import math
from PIL import Image, ImageDraw, ImageChops

# Create target directories
os.makedirs("public/textures", exist_ok=True)
os.makedirs("public/images", exist_ok=True)
os.makedirs("public/books/english/spreads", exist_ok=True)
os.makedirs("public/books/tamil/spreads", exist_ok=True)
os.makedirs("dist/textures", exist_ok=True)
os.makedirs("dist/images", exist_ok=True)
os.makedirs("dist/books/english/spreads", exist_ok=True)
os.makedirs("dist/books/tamil/spreads", exist_ok=True)

# Remove any corrupt HTML files that ended up with .webp extension
for folder in ["public/textures", "dist/textures"]:
    if os.path.exists(folder):
        for f in os.listdir(folder):
            if f.endswith(("-0.webp", "-1.webp")):
                os.remove(os.path.join(folder, f))
                print(f"Removed corrupt 404 artifact: {folder}/{f}")

# -------------------------------------------------------------
# 1. COVERS (Front, Back, Spine)
# -------------------------------------------------------------
front_raw = Image.open("raw_assets/extracted_front.png").convert("RGB")
back_raw = Image.open("raw_assets/extracted_back.png").convert("RGB")
spine_raw = Image.open("raw_assets/extracted_spine.png").convert("RGB")

# A) 3D Front cover texture: 1351 x 2048
target_w, target_h = 1351, 2048
front_cov = Image.new("RGB", (target_w, target_h), (255, 255, 255))
scaled_w = int(round(target_h * (front_raw.width / front_raw.height)))
scaled_front = front_raw.resize((scaled_w, target_h), Image.Resampling.LANCZOS)
offset_x = (target_w - scaled_w) // 2
front_cov.paste(scaled_front, (offset_x, 0))
front_cov.save("public/textures/cover-front.webp", "WEBP", quality=95)
front_cov.save("dist/textures/cover-front.webp", "WEBP", quality=95)
front_cov.save("public/books/english/cover-front.webp", "WEBP", quality=95)
front_cov.save("dist/books/english/cover-front.webp", "WEBP", quality=95)
print("Saved cover-front.webp (1351x2048)")

# B) 2D Cover image: 800 x 1213
target_w, target_h = 800, 1213
cover_2d = Image.new("RGB", (target_w, target_h), (255, 255, 255))
scaled_w = int(round(target_h * (front_raw.width / front_raw.height)))
scaled_front_2d = front_raw.resize((scaled_w, target_h), Image.Resampling.LANCZOS)
offset_x = (target_w - scaled_w) // 2
cover_2d.paste(scaled_front_2d, (offset_x, 0))
cover_2d.save("public/images/cover.webp", "WEBP", quality=95)
cover_2d.save("dist/images/cover.webp", "WEBP", quality=95)
print("Saved images/cover.webp (800x1213)")

# C) 3D Back cover texture: 676 x 1024
target_w, target_h = 676, 1024
back_cov = Image.new("RGB", (target_w, target_h), (255, 255, 255))
scaled_w = int(round(target_h * (back_raw.width / back_raw.height)))
scaled_back = back_raw.resize((scaled_w, target_h), Image.Resampling.LANCZOS)
offset_x = (target_w - scaled_w) // 2
back_cov.paste(scaled_back, (offset_x, 0))
back_cov.save("public/textures/cover-back.webp", "WEBP", quality=95)
back_cov.save("dist/textures/cover-back.webp", "WEBP", quality=95)
back_cov.save("public/books/english/cover-back.webp", "WEBP", quality=95)
back_cov.save("dist/books/english/cover-back.webp", "WEBP", quality=95)
print("Saved cover-back.webp (676x1024)")

# D) 3D Spine texture: 82 x 1024
target_w, target_h = 82, 1024
spine_cov = Image.new("RGB", (target_w, target_h), (255, 255, 255))
scaled_w = int(round(target_h * (spine_raw.width / spine_raw.height)))
scaled_spine = spine_raw.resize((scaled_w, target_h), Image.Resampling.LANCZOS)
offset_x = (target_w - scaled_w) // 2
spine_cov.paste(scaled_spine, (offset_x, 0))
spine_cov.save("public/textures/spine.webp", "WEBP", quality=95)
spine_cov.save("dist/textures/spine.webp", "WEBP", quality=95)
spine_cov.save("public/books/english/spine.webp", "WEBP", quality=95)
spine_cov.save("dist/books/english/spine.webp", "WEBP", quality=95)
print("Saved spine.webp (82x1024)")

# Tamil assets are prepared separately by scripts/prepare_tamil.py.

# -------------------------------------------------------------
# 2. SPREADS (3D Textures & 2D Previews)
# -------------------------------------------------------------
spread_pages = [
    (0, 1),       # Spread 0: Endpaper & Title Page (21 Powerful Management Principles)
    (2, 3),       # Spread 1: Copyright & About the Author (SM. Palaniappan)
    (4, 5),       # Spread 2: About the Author cont. & About the Book
    (6, 7),       # Spread 3: About the Book cont. & Acknowledgements
    (8, 9),       # Spread 4: Acknowledgements cont. & Contents (Part One: Build)
    (10, 11),     # Spread 5: Contents (Part Two & Three) & Part One: Build divider
    (12, 13),     # Spread 6: Chapter 1: Authenticity Branding & What the Industry Saw
    (16, 17),     # Spread 7: Chapter 1 Case Studies & SWOT Analysis Table
    (28, 29),     # Spread 8: Chapter 3 Corporate Equivalent Table & Leadership Lessons
    (34, 35),     # Spread 9: Chapter 4 Time & Discipline & Habit Table
    (56, 57),     # Spread 10: Chapter 8 Resilience: Shut Down, Reboot & Rise & The Fall
    (138, 139),   # Spread 11: Chapter 21 Legacy & Purpose & The Final Management Principle
]

PAGE_BG = (253, 252, 248)

def get_page_img(p_num):
    if p_num == 0:
        return Image.new("RGB", (1500, 2400), PAGE_BG)
    fn = f"raw_assets/rendered_pages/page-{p_num:03d}.png"
    return Image.open(fn).convert("RGB")

def build_shadow_mask(w, h, is_left):
    # Create an 8-bit shadow mask where 255 = no shadow, 184 = deepest shadow
    mask = Image.new("L", (w, h), 255)
    draw = ImageDraw.Draw(mask)
    shadow_w = 125
    min_val = 184
    
    if is_left:
        for i in range(shadow_w):
            x = w - shadow_w + i
            t = (i + 1) / shadow_w
            val = int(round(255 - (255 - min_val) * (t ** 1.8)))
            draw.line([(x, 0), (x, h)], fill=val)
    else:
        for i in range(shadow_w):
            x = i
            t = (shadow_w - i) / shadow_w
            val = int(round(255 - (255 - min_val) * (t ** 1.8)))
            draw.line([(x, 0), (x, h)], fill=val)
    return mask

mask_left_3d = build_shadow_mask(1056, 1600, is_left=True)
mask_right_3d = build_shadow_mask(1056, 1600, is_left=False)

def apply_gutter_shadow_pil(img, mask):
    # Multiply img by grayscale mask
    mask_rgb = Image.merge("RGB", (mask, mask, mask))
    return ImageChops.multiply(img, mask_rgb)

# 2D spread center crease shadow mask (1600 x 1212)
mask_2d = Image.new("L", (1600, 1212), 255)
draw_2d = ImageDraw.Draw(mask_2d)
center_x = 800
span = 60
for i in range(-span, span + 1):
    x = center_x + i
    t = abs(i) / span
    val = int(round(184 + (255 - 184) * (t ** 1.5)))
    draw_2d.line([(x, 0), (x, 1212)], fill=val)
mask_2d_rgb = Image.merge("RGB", (mask_2d, mask_2d, mask_2d))

for idx, (left_p, right_p) in enumerate(spread_pages):
    left_raw = get_page_img(left_p)
    right_raw = get_page_img(right_p)
    
    # -----------------------------------------
    # A) 3D Left & Right textures (1056 x 1600)
    # -----------------------------------------
    target_3d_w, target_3d_h = 1056, 1600
    scaled_w = int(round(target_3d_h * (left_raw.width / left_raw.height)))
    
    # Left 3D page
    left_3d = Image.new("RGB", (target_3d_w, target_3d_h), PAGE_BG)
    scaled_left = left_raw.resize((scaled_w, target_3d_h), Image.Resampling.LANCZOS)
    left_3d.paste(scaled_left, (28, 0))
    left_3d = apply_gutter_shadow_pil(left_3d, mask_left_3d)
    
    # Right 3D page
    right_3d = Image.new("RGB", (target_3d_w, target_3d_h), PAGE_BG)
    scaled_right = right_raw.resize((scaled_w, target_3d_h), Image.Resampling.LANCZOS)
    right_3d.paste(scaled_right, (28, 0))
    right_3d = apply_gutter_shadow_pil(right_3d, mask_right_3d)
    
    # Save 3D textures
    left_3d.save(f"public/textures/spread-{idx}-left.webp", "WEBP", quality=92)
    right_3d.save(f"public/textures/spread-{idx}-right.webp", "WEBP", quality=92)
    left_3d.save(f"dist/textures/spread-{idx}-left.webp", "WEBP", quality=92)
    right_3d.save(f"dist/textures/spread-{idx}-right.webp", "WEBP", quality=92)
    
    # -----------------------------------------
    # B) 2D Spread Preview Image (1600 x 1212)
    # -----------------------------------------
    target_2d_w, target_2d_h = 1600, 1212
    spread_2d = Image.new("RGB", (target_2d_w, target_2d_h), PAGE_BG)
    half_w = 800
    scaled_page_w = int(round(target_2d_h * (left_raw.width / left_raw.height)))
    
    scaled_left_2d = left_raw.resize((scaled_page_w, target_2d_h), Image.Resampling.LANCZOS)
    scaled_right_2d = right_raw.resize((scaled_page_w, target_2d_h), Image.Resampling.LANCZOS)
    
    offset_left_x = (half_w - scaled_page_w) // 2
    spread_2d.paste(scaled_left_2d, (offset_left_x, 0))
    
    offset_right_x = half_w + (half_w - scaled_page_w) // 2
    spread_2d.paste(scaled_right_2d, (offset_right_x, 0))
    
    # Apply center crease shadow
    spread_2d = ImageChops.multiply(spread_2d, mask_2d_rgb)
    
    # Save 2D spread
    spread_2d_path = f"public/images/spread-{idx}.webp"
    spread_2d.save(spread_2d_path, "WEBP", quality=92)
    spread_2d.save(f"dist/images/spread-{idx}.webp", "WEBP", quality=92)
    
    # Save to public/books/english/spreads/
    spread_num_str = f"spread-{idx+1:02d}.webp"
    spread_2d.save(f"public/books/english/spreads/{spread_num_str}", "WEBP", quality=92)
    spread_2d.save(f"dist/books/english/spreads/{spread_num_str}", "WEBP", quality=92)
    
    print(f"Spread {idx}: Left(P.{left_p}) & Right(P.{right_p}) -> saved 3D textures & 2D spread")

print("\n--- ALL ASSETS PROCESSED AND DEPLOYED SUCCESSFULLY ---")
