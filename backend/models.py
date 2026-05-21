from database import Base
from sqlalchemy import Column,Integer,String


# main animal database
class Animal(Base):
    __tablename__ = 'animals'

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(60))
    species = Column(String(60))
    description = Column(String(200))
    desc_audio_url = Column(String(200))
    image_url = Column(String(200))
    audio_url = Column(String(200))




# to store the add animal request from the user
class AnimalRequests(Base):
    __tablename__ = 'animal_requests'


    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(60))
    species = Column(String(60))
    description = Column(String(200))
    desc_audio_url = Column(String(200))
    image_url = Column(String(200))
    audio_url = Column(String(200))
    status = Column(String(60),default='pending')  # pending,approved,rejected


class AigeneratedAnimal(Base):

    __tablename__ = 'ai_genarted_animal'

    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(60))
    species = Column(String(60))
    description = Column(String(200))
    desc_audio_url = Column(String(200))
    image_url = Column(String(200))
    audio_url = Column(String(200))



    
    