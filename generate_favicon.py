import cairosvg
from PIL import Image
import io
import os

# Directory for output files
output_dir = "static/img/"
os.makedirs(output_dir, exist_ok=True)  # Ensure the directory exists

# Path to the SVG file
svg_file = os.path.join(output_dir, "bulk-watermarker.svg")

# Sizes for favicons
favicon_sizes = [
    (32, "favicon-32x32.png"),
    (192, "favicon-192x192.png"),
    (512, "favicon-512x512.png"),
]

# Apple touch icon sizes and filenames
apple_sizes = [
    (120, "apple-touch-icon-120x120.png"),
    (152, "apple-touch-icon-152x152.png"),
    (167, "apple-touch-icon-167x167.png"),
    (180, "apple-touch-icon-180x180.png"),
]

# Android icon sizes and filenames
android_sizes = [
    (48, "android-icon-48x48.png"),
    (72, "android-icon-72x72.png"),
    (96, "android-icon-96x96.png"),
    (144, "android-icon-144x144.png"),
    (192, "android-icon-192x192.png"),
    (512, "android-icon-512x512.png"),
]

# Function to convert SVG to PNG at a specific size
def convert_svg_to_png(svg_path, size, output_file):
    # Convert SVG to PNG
    png_data = cairosvg.svg2png(url=svg_path, output_width=size, output_height=size)
    
    # Write PNG data to file
    output_path = os.path.join(output_dir, output_file)
    with open(output_path, 'wb') as f:
        f.write(png_data)
    
    # Load the image with PIL to ensure it is in the correct format
    img = Image.open(output_path)
    img.save(output_path, format="PNG")
    print(f"Saved: {output_path}")

# Convert and save favicon PNGs
for size, filename in favicon_sizes:
    convert_svg_to_png(svg_file, size, filename)

# Convert and save Apple Touch Icons
for size, filename in apple_sizes:
    convert_svg_to_png(svg_file, size, filename)

# Convert and save Android Icons
for size, filename in android_sizes:
    convert_svg_to_png(svg_file, size, filename)

# Generate the favicon.ico with a single size (32x32 or similar)
icon_filename = os.path.join(output_dir, "favicon.ico")
icon_size = (32, 32)

# Create the 32x32 favicon.ico
png_data = cairosvg.svg2png(url=svg_file, output_width=icon_size[0], output_height=icon_size[1])
img = Image.open(io.BytesIO(png_data))  # Use io.BytesIO to handle byte data

# Save as favicon.ico
img.save(icon_filename, format="ICO")
print(f"Saved: {icon_filename}")
