import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

export async function loadCocoSSD() {
  try {
    await tf.ready();
    await tf.setBackend('webgl');
    const model = await cocossd.load();
    return { model: model, success: true };
  } catch (error) {
    console.error(error);
    return { model: null, success: false };
  }
}

export async function detect(model: unknown, imageData: ImageData) {
  let tensorImage: tf.Tensor3D | null = null;
  try {
    if (!(model instanceof cocossd.ObjectDetection)) {
      throw new Error(
        'The model is not an instance of Coco SSD ObjectDetection'
      );
    }
    tensorImage = tf.browser.fromPixels(imageData);
    const predictions = model.detect(tensorImage);
    return predictions;
  } catch (error) {
    console.log(error);
    return [];
  } finally {
    if (tensorImage) {
      tensorImage.dispose();
    }
  }
}
