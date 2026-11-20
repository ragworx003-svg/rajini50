from PIL import Image

img = Image.open('/home/mithil/Downloads/book/raw_assets/cover_wrap_render-1.png')
w, h = img.size
scale = 300.0 / 72.0

# Exact trim coordinates
y1 = int(round(21.0 * scale))
y2 = int(round(597.0 * scale))

back_x1 = int(round(21.0 * scale))
back_x2 = int(round(381.0 * scale))

spine_x1 = int(round(381.0 * scale))
spine_x2 = int(round(417.0 * scale))

front_x1 = int(round(417.0 * scale))
front_x2 = int(round(777.0 * scale))

print(f"Crop boxes:")
print(f"Back:  ({back_x1}, {y1}) to ({back_x2}, {y2}) -> {back_x2 - back_x1}x{y2 - y1}")
print(f"Spine: ({spine_x1}, {y1}) to ({spine_x2}, {y2}) -> {spine_x2 - spine_x1}x{y2 - y1}")
print(f"Front: ({front_x1}, {y1}) to ({front_x2}, {y2}) -> {front_x2 - front_x1}x{y2 - y1}")

back_img = img.crop((back_x1, y1, back_x2, y2))
spine_img = img.crop((spine_x1, y1, spine_x2, y2))
front_img = img.crop((front_x1, y1, front_x2, y2))

back_img.save('/home/mithil/Downloads/book/raw_assets/extracted_back.png')
spine_img.save('/home/mithil/Downloads/book/raw_assets/extracted_spine.png')
front_img.save('/home/mithil/Downloads/book/raw_assets/extracted_front.png')

print("Saved extracted images successfully!")
