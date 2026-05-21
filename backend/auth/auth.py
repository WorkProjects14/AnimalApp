from fastapi import Depends,HTTPException
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from firebase_admin import auth
from backend.auth.firebase_config import firebase_app



security = HTTPBearer()

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):

    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        print(f"Decoded token: {decoded_token}")
        return decoded_token
        
           
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")



