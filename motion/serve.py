#!/usr/bin/env python3
"""Serve the motion kit at http://localhost:8730/kit/ with the repository's site behind it.

    (nohup python3 motion/serve.py >/dev/null 2>&1 &)

/kit/... comes from motion/kit/ ; every other path is read from the repository, so
/assets/css/styles.css is the real stylesheet (same origin, so the fonts load too).
"""
import http.server, os, pathlib, sys
HERE = pathlib.Path(__file__).resolve().parent
REPO = pathlib.Path('/home/user/Knightwebstudio')

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0]
        root = HERE if (clean == '/kit' or clean.startswith('/kit/')) else REPO
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
    http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8730), Handler).serve_forever()
