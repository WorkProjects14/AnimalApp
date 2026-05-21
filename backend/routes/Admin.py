import os
from typing import Optional

from gtts import gTTS
from io import BytesIO
from storage import upload_image,upload_audio,upload_desc_audio,delete_file
import models
import schemas
import shutil
import uuid
from fastapi import Depends,APIRouter,File, Form,UploadFile,HTTPException,Request
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import select
from database import get_db
from auth.auth import verify_admin
from fastapi.security import HTTPAuthorizationCredentials
from core.limiter import limiter
import requests
import json



router = APIRouter(
    prefix='/admin',
    tags=['admin'],
    dependencies = [Depends(verify_admin)]
)




# admin login  - we ned make this login public and only allow the user with the email id same as the one in firebase to login as admin and get the token for futher request
admin_login_router = APIRouter(
    prefix='/admin',
    tags=['admin'])

@admin_login_router.post('/login')
@limiter.limit('5/minute')  # Limit to 5 login attempts per minute
async def admin_login(request:Request, body:schemas.AdminLoginRequest,credentials: HTTPAuthorizationCredentials = Depends(verify_admin)):

    frontend_email = body.email
    print(f"Email from frontend: {frontend_email}")

    decoded_email = credentials.get('email')
    print(f"Decoded email from token: {decoded_email}")

    if decoded_email != frontend_email:
        raise HTTPException(status_code=401, detail="Email mismatch")
        
        
    return {"message" : "Admin login successful", "email": credentials.get('email')}


# add animal to database
@router.post('/add_animal',response_model=schemas.AllAnimalResponse)
async def add_animal(name:str,
               species:str,
               description:str,
               image:UploadFile = File(...),  # tells fast api that content comes as file not json
               audio:UploadFile = File(...),  # tells fast api that content comes as file not json
               db:AsyncSession=Depends(get_db)):
    
    # checks for the same anial name in the database to avoid duplicates
    result = await db.execute(
         select(models.Animal).where(models.Animal.name==name)
    )

    existing_animal = result.scalars().first()

    if existing_animal:
         raise HTTPException(status_code=400, detail="Animal with this name already exists")
    

    
    # validation for images
    if not image.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Invalid image file type. Please upload an image.")

    # validation for audio
    if not audio.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="Invalid audio file type. Please upload an audio file.")


    

    # save files to supabase storage and get the public url
    image_bytes = await image.read()
    image_file_path = upload_image(
        file_bytes=image_bytes,
        filename=f"{name}.png",
    )

    audio_bytes = await audio.read()
    audio_file_path = upload_audio( 
        file_bytes=audio_bytes,
        filename=f"{name}.mp3",
    )


    
    # desc audio sound
    tts = gTTS(description, lang='en')
    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)

    audio_buffer.seek(0)
    desc_audio_file_path = upload_desc_audio(
        file_bytes=audio_buffer.read(),
        filename=f"{name}.mp3",
        
    )

    # save to db
    new_animal = models.Animal(name=name.capitalize(),
                               species=species.capitalize(),
                               description=description,
                               desc_audio_url=desc_audio_file_path,
                               image_url=image_file_path,
                               audio_url = audio_file_path
                               )
    db.add(new_animal)
    await db.commit()
    await db.refresh(new_animal)
    return new_animal
  


# Update animal details ( using patch for partial upadate)
@router.patch('/update_animal/{animal_id}',response_model=schemas.AllAnimalResponse)
async def update_animal(
    animal_id: int,

    # optional text fields
    name: Optional[str] = None,
    species: Optional[str] = None,
    description: Optional[str] = None,

    # optional file uploads
    image_file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),

    db: AsyncSession = Depends(get_db)
    ):
    # Check animal exists
    result = await db.execute(
        select(models.Animal).where(
            models.Animal.id == animal_id
        )
    )

    animal = result.scalars().first()

    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

     # Update only if value actually provided
    if name:
        animal.name = name.strip().capitalize()

    if species and species.strip():
        animal.species = species.strip().capitalize()

    if description and description.strip():
        animal.description = description.strip()

    # Create directories if not exist
    os.makedirs("static/images", exist_ok=True)
    os.makedirs("static/audio", exist_ok=True)
    os.makedirs("static/desc_audio", exist_ok=True)

    # Optional image upload
    if image_file and image_file.filename:
        
        image_path = f"static/images/{name}.png"

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)

        animal.image_url = image_path

    # Optional audio upload
    if audio_file and audio_file.filename:
        
        audio_path = f"static/audio/{name}.mp3"

        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        animal.audio_url = audio_path

    # Regenerate description audio only if description changed
    if description:
        desc_audio_path = f"static/desc_audio/{name}.wav"

        tts = gTTS(description, lang='en')
        tts.save(desc_audio_path)

        animal.desc_audio_url = desc_audio_path

    await db.commit()
    await db.refresh(animal)

    return animal

    

# Delete animal from the database
@router.delete('/delete_animal/{animal_id}')
async def delete_animal(animal_id:int,db:AsyncSession=Depends(get_db)):
    result = await db.execute(
        select(models.Animal).where(models.Animal.id==animal_id)
    )

    animal = result.scalars().first()

    if not animal:
        raise HTTPException(status_code=404,detail="animal not found")

    delete_file("animal-image", animal.image_url)
    delete_file("animal-audio", animal.audio_url)
    delete_file("desc-audio", animal.desc_audio_url)
        

    await db.delete(animal)
    await db.commit()

    return {"message" : "animal deleted successfully", "animal_deleted" : animal}

# show all pending request
@router.get('/pending_requests',response_model=list[schemas.AnimalRequestResponse])
async def animal_requests(db:AsyncSession=Depends(get_db)):

    result = await db.execute(
        select(models.AnimalRequests).where(models.AnimalRequests.status=='pending')
    )

    animal_requests = result.scalars().all()
    return animal_requests




# approve the requested animal by user
@router.post('/animal/approval/{request_id}')
async def animal_approval(request_id:int,db:AsyncSession=Depends(get_db)):


    request = await db.execute(
        select(models.AnimalRequests).where(models.AnimalRequests.id==request_id)
    )

    

    animal_request = request.scalars().first()

    if not animal_request:
        raise HTTPException(status_code=404,detail="Request not found")

    new_animal = models.Animal(
        name = animal_request.name,
        species = animal_request.species,
        description = animal_request.description,
        desc_audio_url = animal_request.desc_audio_url,
        image_url = animal_request.image_url,
        audio_url = animal_request.audio_url
    )


    db.add(new_animal)
    await db.commit()
    await db.refresh(new_animal)

    await db.delete(animal_request)  # delete the animal from the db 
    await db.commit()


    
    return {"message" : "animal added successfully"}



# reject the animal requested by user
@router.post('/animal/reject/{request_id}')
async def reject_animal(request_id:int,db:AsyncSession=Depends(get_db)):

    request = await db.execute(
        select(models.AnimalRequests).where(models.AnimalRequests.id==request_id)
    )

    

    animal = request.scalars().first()


    if not animal:
        raise HTTPException(status_code=404,detail="Request not found")

    delete_file("animal-image", animal.image_url)
    delete_file("animal-audio", animal.audio_url)
    delete_file("desc-audio", animal.desc_audio_url)
    
    await db.delete(animal)  # delete the animal from the db 
    await db.commit()

   
    
    return {'message' : 'animal request rejected'}


# ------------------------------------------------------- Ai section for admin -------------------------------------------------------


CF_API_TOKEN = os.getenv('CF_API_TOKEN')
CF_ACC_ID = os.getenv('CF_ACC_ID')

@router.post('/generate_ai_animal')   # response_model=schemas.AllAnimalResponse
async def generate_ai_animal(name:str,style: str,audio_file: UploadFile = File(...),db:AsyncSession=Depends(get_db)):    


    # --------------------checking in the db ----------------------------------
    result = await db.execute(
        select(models.Animal).where(models.Animal.name==name)
    )

    existing_animal = result.scalars().first()

    if existing_animal:
        return existing_animal
    


    # ---------------------generating Decsription with ai model ----------------------------------


    # method - 1 using hugging face and open ai


    # print(TEXT_MODEL)

    # client = OpenAI(
    #     base_url="https://router.huggingface.co/v1",
    #     api_key=HF_TOKEN,
    # )

    #     response = client.chat.completions.create(
    #         model=TEXT_MODEL,
    #         messages=[
    #             {
    #                 "role": "user",
    #                 "content": f"Describe a {name} in simple words for kids and need only response nothing else like sure and yes etc"
    #         }
    #     ],
    #     max_tokens=100
    # )

        
    #     desc = response.choices[0].message.content



    # method -2 : using the cloudfare ai model

    text_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACC_ID}/ai/run/@cf/meta/llama-3-8b-instruct"


    prompt : f"""
        You are an AI that classifies animals for kids.

        Return ONLY valid JSON.

        Rules:
        - "type" must be one of: pet, wild, bird, sea, insect
        - "description" must be 1–2 simple lines for children
        - Do NOT include scientific names
        - Keep language very simple

        Animal: {name}

        Format:
        {{
        "name": "",
        "type": "",
        "description": ""
        }}
        """

    text_payload = {
        "messages" : [
            {
                "role":"user",
                "content":f"""
        You are an AI that classifies animals for kids.

        Return ONLY valid JSON.

        Rules:
        - "type" must be one of: pet, wild, bird, sea, farm, insect
        - "description" must be 3-4 simple sentences for children
        - Do NOT include scientific names
        - Keep language very simple

        Animal: {name}

        Format:
        {{
        "name": "",
        "type": "",
        "description": ""
        }}
        """
            }
        ]
    }

    headers = {

    'Authorization': f"Bearer {CF_API_TOKEN}",
    "Content-Type": "application/json"
    }


    text_response = requests.post(text_url,headers=headers,json=text_payload)

    if text_response.status_code !=200:
        return {"error" : text_response.text}

    raw = text_response.json()['result']['response']

    desc = json.loads(raw)    # to acces name,type,description use desc['name'],desc['type'],desc['description']

    
    # print(raw['name']) 
    # print(raw['type']) 
    # print(raw['description']) 
    # return desc


    # --------------------------- generating Images with ai ------------------------------------------------

   
    # hugging face = image model deprecated,
    # replicate = not free,
    # gemini = can't generate the image , good for text but we have the huggging face for that


    # now using the cloudfare ai cause it is alternative workarounds

    img_url = f"https://api.cloudflare.com/client/v4/accounts/{CF_ACC_ID}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"



    # here need to make the chnages
    if style == "2d":
         img_payload = {
        "prompt": f"A single {name} illustrated as a realistic animal. The animal should be centered and shown alone (no other animals). Use bright, clean, and minimal colors while keeping the natural, realistic color palette and body shape of a real {name}. Style should be simple, soft with smooth outlines. Plain or very minimal background, no text, no extra objects."
        }
         
    elif style == "3d":
         img_payload = {
        "prompt": f"""
        A cute 3D cartoon {name} for kids.

        Requirements:
        - Single animal only
        - Pixar-style 3D render
        - Colorful but minimal
        - Match realistic animal shape and natural colors
        - Kid-friendly
        - Soft lighting
        - High-quality 3D look
        - Clean background
        """
        }


    img_response = requests.post(img_url,headers=headers,json=img_payload)


    if img_response.status_code != 200:
        return {"error": img_response.text}
    


    #----------------------------------- audio generation -------------------------------------------------------------


    # audio = generate_animal_sound(data.name)



    supabase_image_url = upload_image(
    img_response.content,
    f"{name}.png"
)

    audio_bytes = await audio_file.read()

    supabase_audio_url = upload_audio(
        audio_bytes,
        f"{name}.mp3"
    )



    # generate the description audio using gtts

    tts = gTTS(text=desc['description'], lang='en')

    audio_buffer = BytesIO()
    tts.write_to_fp(audio_buffer)

    audio_buffer.seek(0)

    supabase_desc_audio_url = upload_desc_audio(
        file_bytes=audio_buffer.read(),
        filename=f"{name}.mp3",
        
    )

    
    # save to the datbase
    ai_generated_animal = models.AigeneratedAnimal(
        name=desc['name'].capitalize(),
        species=desc['type'].capitalize(),
        description=desc['description'],
        desc_audio_url=supabase_desc_audio_url,
        image_url=supabase_image_url,
        audio_url=supabase_audio_url
    )

    db.add(ai_generated_animal)
    await db.commit()
    await db.refresh(ai_generated_animal)
    return ai_generated_animal      




@router.patch('/edit_ai_animal/{animal_id}')
async def edit_ai_animal(
    animal_id: int,

    # optional text fields
    name: Optional[str] = None,
    species: Optional[str] = None,
    description: Optional[str] = None,

    # optional file uploads
    image_file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),

    db: AsyncSession = Depends(get_db)
    ):
    # Check animal exists
    result = await db.execute(
        select(models.AigeneratedAnimal).where(
            models.AigeneratedAnimal.id == animal_id
        )
    )

    animal = result.scalars().first()

    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")

     # Update only if value actually provided
    if name:
        animal.name = name.strip().capitalize()

    if species and species.strip():
        animal.species = species.strip().capitalize()

    if description and description.strip():
        animal.description = description.strip()

    

    # Optional image upload
    if image_file and image_file.filename:
        
        if animal.image_url:
            delete_file("animal-image", animal.image_url)


        image_bytes = await image_file.read()

        image_url = upload_image(
            file_bytes=image_bytes,
            filename=f"{animal.name}.png",
        
        )

        animal.image_url = image_url

    # Optional audio upload
    if audio_file and audio_file.filename:
        
        if animal.audio_url:
            delete_file("animal-audio", animal.audio_url)

        audio_bytes = await audio_file.read()
        audio_path = upload_audio(
            file_bytes=audio_bytes,
            filename=f"{animal.name}.mp3",
        )

        animal.audio_url = audio_path

    # Regenerate description audio only if description changed
    if description:
        
        if animal.desc_audio_url:
            delete_file("desc-audio", animal.desc_audio_url)

        


        tts = gTTS(description, lang='en')
        audio_buffer = BytesIO()
        tts.write_to_fp(audio_buffer)

        audio_buffer.seek(0)

        desc_audio_path = upload_desc_audio(
            file_bytes=audio_buffer.read(),
            filename=f"{animal.name}.wav",
        )

        animal.desc_audio_url = desc_audio_path

    await db.commit()
    await db.refresh(animal)

    return animal



@router.post('/add_ai_animal_to_main_database/{animal_id}')
async def add_ai_animal_to_main_database(animal_id:int,db:AsyncSession=Depends(get_db)):

    result = await db.execute(
        select(models.AigeneratedAnimal).where(models.AigeneratedAnimal.id==animal_id)
    )

    ai_animal = result.scalars().first()

    if not ai_animal:
        raise HTTPException(status_code=404,detail="AI generated animal not found")

    new_animal = models.Animal(
        name = ai_animal.name,
        species = ai_animal.species,
        description = ai_animal.description,
        desc_audio_url = ai_animal.desc_audio_url,
        image_url = ai_animal.image_url,
        audio_url = ai_animal.audio_url
    )




    db.add(new_animal)
    await db.commit()
    await db.refresh(new_animal)

    await db.delete(ai_animal)  # delete the ai generated animal from the db 
    await db.commit()

    
    return {"message" : "AI generated animal added to main database successfully", "animal_added" : new_animal}