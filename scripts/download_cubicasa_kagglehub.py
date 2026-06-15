import kagglehub


path = kagglehub.dataset_download("qmarva/cubicasa5k", force_download=False)

print(path)
