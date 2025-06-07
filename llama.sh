/home/dev/sources/llama.cpp/build/bin/llama-server --no-context-shift --temp 0.6 --no-mmap --cache-type-k q4_0 --top-p 0.95 -m /home/dev/model/Qwen3-4B.gguf --host 192.168.1.23 --port 8081 -c 8192 
# --override-tensor '([4-9]+).ffn_.*_exps.=CPU' 
# --n-gpu-layers 20