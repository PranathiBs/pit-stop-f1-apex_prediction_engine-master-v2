from src.main import app
from mangum import Mangum

# Vercel requires a Mangum handler to bridge FastAPI with Serverless
handler = Mangum(app)
