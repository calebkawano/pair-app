from PIL import Image

def get_dominant_colors(image_path):
    img = Image.open(image_path)
    img = img.convert('RGB')
    pixels = list(img.getdata())
    
    # Filter for light tan colors (high R and G values, slightly lower B)
    tan_colors = {}
    for pixel in pixels:
        r, g, b = pixel
        if r > 200 and g > 200 and b > 180:  # Looking for tan/cream colors
            tan_colors[pixel] = tan_colors.get(pixel, 0) + 1
    
    sorted_colors = sorted(tan_colors.items(), key=lambda x: x[1], reverse=True)
    return sorted_colors[:5]

# Analyze the light logo
logo_path = 'public/images/logos/pair-logo-full-light.png'
dominant_colors = get_dominant_colors(logo_path)
print('Most common tan colors in the logo:')
for color, count in dominant_colors:
    r, g, b = color
    print(f'RGB: {color}, Hex: #{r:02x}{g:02x}{b:02x}, Count: {count}')
