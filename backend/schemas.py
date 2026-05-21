from fastapi import UploadFile,File
from pydantic import BaseModel
from typing import Optional,Literal

# when long pressed this will be used to show the details of the animal

class AnimalCreate(BaseModel):
    name:str
    species:str
    description:str
    desc_audio_url:str
    image_url:str
    audio_url:str
    

class AllAnimalResponse(BaseModel):
    id: int
    name: str
    species: str
    description: str
    desc_audio_url: str
    image_url: str
    audio_url : str
    

    class Config:
        from_attributes = True

class AudioResponse(BaseModel):
    audio_url : str

    class Config:
        from_attributes = True


class AnimalRequestResponse(BaseModel):
    id: int
    name: str
    species: str
    description: str
    desc_audio_url: str
    image_url: str
    audio_url : str
    status:str
    

    class Config:
        from_attributes = True


class AnimalUpdate(BaseModel):
    name:Optional[str] = None
    species:Optional[str] = None
    description:Optional[str] = None
    desc_audio_url:Optional[str] = None
    image_url:Optional[str] = None
    audio_url:Optional[str] = None


class AdminLoginRequest(BaseModel):
    email:str


class AiAnimalGenerate(BaseModel):
    name : str
    audio_file: UploadFile = File(...)
    style: Literal["2d","3d"] = "2d"