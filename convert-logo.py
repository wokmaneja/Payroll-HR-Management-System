from PIL import Image

def process_image():
    img = Image.open('public/logo.png').convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # item is (R, G, B, A)
        if item[3] > 0 and item[0] < 50 and item[1] < 50 and item[2] < 50:
            # Change dark pixels to white
            new_data.append((255, 255, 255, item[3]))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save('public/logo-white.png')
    print("Saved public/logo-white.png")

if __name__ == '__main__':
    process_image()
