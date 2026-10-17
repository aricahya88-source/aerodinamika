#!/usr/bin/env python3
"""Single-page-app static server with fallback for /simulator, /papercraft etc."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parents[1])
class SPAHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path=self.translate_path(self.path.split("?",1)[0])
        if not os.path.exists(path) and not Path(self.path).suffix:
            self.path="/index.html"
        return super().do_GET()
if __name__=="__main__":
    print("AEROLAB A380 at http://localhost:5173 (Ctrl+C to stop)",flush=True)
    ThreadingHTTPServer(("0.0.0.0",5173),SPAHandler).serve_forever()
