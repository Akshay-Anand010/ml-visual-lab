# CNN Studio weights
#
# After training in Colab (notebooks/train_cnn_studio.ipynb), download
# `cnn_studio.pt` and place it here. FastAPI loads it on startup.
#
# The API also runs without this file: SampleCNN ships with calibrated
# biases so you still get ≥50 identity-preserving views.

*.pt
!.gitkeep
