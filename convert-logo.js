const Jimp = require('jimp');

async function processImage() {
  try {
    const image = await Jimp.read('public/logo.png');
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // Check if pixel is dark (black-ish). We'll use a threshold.
      // If it's a very dark gray or black, change it to white.
      if (red < 50 && green < 50 && blue < 50 && alpha > 0) {
        this.bitmap.data[idx + 0] = 255;
        this.bitmap.data[idx + 1] = 255;
        this.bitmap.data[idx + 2] = 255;
      }
    });
    await image.writeAsync('public/logo-white.png');
    console.log('Successfully created logo-white.png');
  } catch (err) {
    console.error(err);
  }
}

processImage();
