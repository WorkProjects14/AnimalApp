from supabase import create_client
from dotenv import load_dotenv
import os
import uuid

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)


def upload_image(file_bytes: bytes, filename: str):
    unique_name = f"{uuid.uuid4()}_{filename}"

    supabase.storage.from_("animal-image").upload(
        unique_name,
        file_bytes,
        {"content-type": "image/png"}
    )

    return supabase.storage.from_(
        "animal-image"
    ).get_public_url(unique_name)


def upload_audio(file_bytes: bytes, filename: str):
    unique_name = f"{uuid.uuid4()}_{filename}"

    supabase.storage.from_("animal-audio").upload(
        unique_name,
        file_bytes,
        {"content-type": "audio/mpeg"}
    )

    return supabase.storage.from_(
        "animal-audio"
    ).get_public_url(unique_name)



def upload_desc_audio(file_bytes: bytes, filename: str):
    unique_name = f"{uuid.uuid4()}_{filename}"

    supabase.storage.from_("desc-audio").upload(
        unique_name,
        file_bytes,
        {"content-type": "audio/mpeg"}
    )

    return supabase.storage.from_(
        "desc-audio"
    ).get_public_url(unique_name)


def delete_file(bucket_name, public_url):
    if not public_url:
        return

    try:
        # get path after /object/public/bucket/
        file_path = public_url.split(
            f"/storage/v1/object/public/{bucket_name}/"
        )[1]

        supabase.storage.from_(bucket_name).remove(
            [file_path]
        )

    except Exception as e:
        print("Delete error:", str(e))