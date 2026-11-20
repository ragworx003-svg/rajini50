"""Render selected Tamil PDF pages for the book preview. Keeps the full PDF private.
Usage: python3 scripts/prepare_tamil.py '/path/to/Tamil.pdf'
Cover artwork is used directly through CSS and texture UVs, without repainting it.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse
import json
import subprocess
from PIL import Image, ImageOps

PAIRS = [(0,1),(2,3),(4,5),(6,7),(8,9),(10,11),(12,13),(16,17),(34,35),(44,45),(86,87),(220,221)]
ROOT = Path(__file__).resolve().parents[1]

def prepare(pdf):
    out = ROOT / 'public/books/tamil'
    (out/'textures').mkdir(parents=True, exist_ok=True)
    (out/'spreads').mkdir(parents=True, exist_ok=True)
    pages = {0: Image.new('RGB',(1035,1600),'#fff')}
    with TemporaryDirectory(prefix='tamil-pages-') as temp:
        for page in sorted(set(n for pair in PAIRS for n in pair) - {0}):
            target=Path(temp)/f'page-{page}'
            subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-singlefile','-scale-to','1600','-png',str(pdf),str(target)],check=True)
            with Image.open(target.with_suffix('.png')) as image:
                pages[page]=ImageOps.pad(image.convert('RGB'),(1056,1600),color='white')
        for i,pair in enumerate(PAIRS):
            spread=Image.new('RGB',(1600,1212),'white')
            for side,page in zip(['left','right'],pair):
                image=ImageOps.pad(pages[page],(1056,1600),color='white')
                image.save(out/'textures'/f'spread-{i}-{side}.webp','WEBP',quality=90)
                spread.paste(image.resize((800,1212),Image.Resampling.LANCZOS),(0 if side=='left' else 800,0))
            spread.save(out/'spreads'/f'spread-{i+1:02d}.webp','WEBP',quality=90)
    (out/'preview-pages.json').write_text(json.dumps({'source':pdf.name,'pdfPages':229,'spreads':PAIRS},indent=2)+'\n')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('pdf',type=Path)
    prepare(parser.parse_args().pdf)
