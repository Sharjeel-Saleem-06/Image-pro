
# ⚡️ Setup Local Face Restoration (CodeFormer)

We have selected **CodeFormer** as the perfect project for face restoration. It offers state-of-the-art quality, balancing detail fidelity with restoration.

To run this **locally** effectively (without relying on paid APIs), follow these steps to set up the dedicated Python server.

## 1. Prerequisites
- **Git** installed.
- **Python 3.8+** installed (Anaconda recommended).
- **GPU (NVIDIA)** recommended for speed (runs on CPU but slower).

## 2. Download & Install CodeFormer
Run these commands in your terminal (outside the project or in a `tools` folder):

```bash
# 1. Clone the repository
git clone https://github.com/sczhou/CodeFormer
cd CodeFormer

# 2. Install Dependencies
pip install -r requirements.txt
python basicsr/setup.py develop
pip install fastapi uvicorn python-multipart
```

## 3. Install the Server Script
Copy the provided `codeformer_server.py` file into the `CodeFormer` root folder.

**From your project folder:**
```bash
cp local_server/codeformer_server.py /path/to/CodeFormer/
```

## 4. Run the Server
Inside the `CodeFormer` folder, run:

```bash
python codeformer_server.py
```

It will automatically download necessary weights on the first run. 
Once running, you will see `Uvicorn running on http://0.0.0.0:8000`.

## 5. Usage in App
The web app is already configured to prioritize this local server if available! 
Just use the **AI Enhancer** -> **Face Restore** feature.
