# !pip install -q kokoro>=0.9.4 soundfile
# !apt-get -qq -y install espeak-ng > /dev/null 2>&1

from kokoro import KPipeline
import soundfile as sf
from sys import argv
import torch  

def generate(path, text):
    pipeline = KPipeline(lang_code='a')
    generator = pipeline(text, voice='af_heart')
    
    for i, (gs, ps, audio) in enumerate(generator):        
        sf.write(f'{path}.wav', audio, 24000)
        
generate(argv[1], argv[2])