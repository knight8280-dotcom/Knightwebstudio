#!/usr/bin/env python3
"""Serve the gallery at http://localhost:8721/ with the repository's assets behind it.

    (nohup python3 gallery/serve.py >/dev/null 2>&1 &)

/ , /index.html and /gallery.css come from this folder; every other path is read from
the repository, so /assets/css/styles.css is the real stylesheet (same origin, so the
fonts load too).
"""
import http.server, os, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('/home/user/Knightwebstudio')
OWN = {'/', '/index.html', '/gallery.css'}

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        root = HERE if clean in OWN else REPO
        rel = os.path.normpath(clean.lstrip('/'))
        if rel.startswith('..'):
            rel = ''
        return str(root / rel) if rel not in ('', '.') else str(root)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8721), Handler).serve_forever()
