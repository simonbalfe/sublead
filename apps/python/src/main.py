import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

app = FastAPI(title='Reddit Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv('APP_URL', 'http://localhost:3000')],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'status': 'ok'}
