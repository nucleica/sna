import sys

if len(sys.argv) < 2:
    print("Usage: python see.py <image> [short|normal|long]")
    exit(1)

from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(
    "moondream/moondream-2b-2025-04-14-4bit", 
    trust_remote_code=True,
    device_map={"": "cuda"}
)
  
# model.model.compile()

descriptionLength = "normal"

if (len(sys.argv) > 2):
    lengths = ["short", "normal", "long"]
    
    if sys.argv[2] in lengths:
        descriptionLength = sys.argv[2]

from PIL import Image 

image = Image.open(sys.argv[1])

if image is None:
    print("Invalid image")
    exit(1)

encoded_image = model.encode_image(image) 

for t in model.caption(encoded_image, length=descriptionLength, stream=True)["caption"]:
    print(t, end="", flush=True) 
    
 
# objects = model.detect(image, "face")["objects"]
# print(f"Found {len(objects)} face(s)")

#
# no streaming
#

# print(model.query(image, "How many people are in the image?")["answer"])


# points = model.point(image, "person")["points"]
# print(f"Found {len(points)} person(s)")
