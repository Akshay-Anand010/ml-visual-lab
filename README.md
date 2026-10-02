# ML Visual Lab

Interactive visual explanations of classical ML and deep learning concepts.

**Live site (static):** https://akshay-anand010.github.io/ml-visual-lab/

## Go live with FastAPI (simplest)

The root `Dockerfile` serves the whole lab **and** `POST /api/samples`.

1. Push is already this GitHub repo: [Akshay-Anand010/ml-visual-lab](https://github.com/Akshay-Anand010/ml-visual-lab)
2. On [Render](https://render.com) → **New → Web Service** → connect that repo  
   - Runtime: **Docker**  
   - Instance: free is fine  
   - Health: `/api/health`
3. Open `https://YOUR-SERVICE.onrender.com/#/cnn-studio`

Same origin: no extra API URL. Hugging Face Spaces also works: new Space → Docker → this repo.

## CNN Studio

`#/cnn-studio` — upload a portrait, get 50–128 identity-preserving views from SampleCNN, then an interactive 3D diagram of every layer.

Colab: [`notebooks/train_cnn_studio.ipynb`](notebooks/train_cnn_studio.ipynb) → download `cnn_studio.pt` → `server/weights/`.

## Local

Static labs:

```bash
python3 -m http.server 8080
```

FastAPI (UI + CNN):

```bash
cd server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

http://localhost:8000/#/cnn-studio
