import sys, glob, os, time
import numpy as np, torch
from PIL import Image
from spandrel import ModelLoader

torch.set_num_threads(os.cpu_count())
model = ModelLoader().load_from_file("/opt/esr/models/realesr-general-x4v3.pth").eval()
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
frames = sorted(glob.glob(f"{src}/*.png"))
t0 = time.time()
for i, f in enumerate(frames):
    out = f"{dst}/{os.path.basename(f)}"
    if os.path.exists(out):
        continue
    x = torch.from_numpy(np.asarray(Image.open(f).convert("RGB"))).permute(2, 0, 1).float().div(255).unsqueeze(0)
    with torch.inference_mode():
        y = model(x).clamp(0, 1)
    img = Image.fromarray((y[0].permute(1, 2, 0).numpy() * 255).round().astype(np.uint8))
    img.resize((1920, 1080), Image.LANCZOS).save(out)
    if i % 20 == 0:
        print(f"{i+1}/{len(frames)} {time.time()-t0:.0f}s", flush=True)
print("done", time.time() - t0)
