import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import router as reddit_router

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))

app = FastAPI(title='Sublead Reddit Service')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(reddit_router, prefix='/reddit')


@app.get('/health')
def health():
    return {'status': 'ok'}
