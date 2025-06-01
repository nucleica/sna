import subprocess
import sys
import os

def download_audio(name: str, output_dir: str = "storage/music", max_results: int = 1) -> str: 
    try: 
        os.makedirs(output_dir, exist_ok=True)
        
        search_prefix = f"ytsearch{max_results}" if max_results > 1 else "ytsearch"
        search_query = f"{search_prefix}:{name}"
         
        command = [
            "yt-dlp",
            "--extract-audio",   
            "--audio-format", "mp3",  
            "--output", f"{output_dir}/%(title)s.%(ext)s",  
            "--no-playlist",   
            search_query
        ]
         
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        return f"Successfully downloaded audio to {output_dir}: {result.stdout}"
    except subprocess.CalledProcessError as e:
        return f"Error downloading audio: {e.stderr}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"
    
res = download_audio(sys.argv[1])

print(res, flush=True)