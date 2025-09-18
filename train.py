# ml-server/train.py
"""
Train a MobileNetV2 transfer-learning classifier from a folder-structured dataset:
dataset/
  Broken soybeans/
  Immature soybeans/
  Intact soybeans/
  Skin-damaged soybeans/
  Spotted soybeans/
Outputs model.h5 in ml-server/
"""

import tensorflow as tf
from tensorflow.keras.preprocessing import image_dataset_from_directory
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
import os

DATA_DIR = "../dataset"  # adjust if different
OUTPUT_MODEL = "model.keras"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 8  # raise for better accuracy
NUM_CLASSES = 5

def main():
    train_ds = image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )

    val_ds = image_dataset_from_directory(
        DATA_DIR,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE
    )
    
        # Add data augmentation
    data_augmentation = tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
        layers.RandomContrast(0.1),
    ])

    AUTOTUNE = tf.data.AUTOTUNE
    train_ds = train_ds.prefetch(buffer_size=AUTOTUNE)
    val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

    base_model = tf.keras.applications.MobileNetV2(input_shape=IMG_SIZE + (3,),
                                                   include_top=False,
                                                   weights='imagenet')
    base_model.trainable = False  # freeze for initial training

    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = data_augmentation(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)
    model = models.Model(inputs, outputs)

    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    history = model.fit(train_ds, validation_data=val_ds, epochs=30)
    # Optionally unfreeze some layers and continue training (fine-tune)
    base_model.trainable = True
    for layer in base_model.layers[:-100]:
        layer.trainable = False


    model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    model.fit(train_ds, validation_data=val_ds, epochs=15)

    model.save("model.keras") # TensorFlow SavedModel format
    print("Saved model to", OUTPUT_MODEL)

if __name__ == "__main__":
    main()