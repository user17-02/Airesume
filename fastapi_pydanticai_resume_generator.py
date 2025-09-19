import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from dotenv import load_dotenv

# ----------- Load .env -----------
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise RuntimeError("⚠️ OPENAI_API_KEY not found in .env")

# ----------- Init -----------
app = FastAPI()
client = OpenAI(api_key=api_key)

# Enable CORS (so React frontend can call this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------- Models -----------
class ExperienceItem(BaseModel):
    job_title: str
    company: str
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    responsibilities: list[str] | None = None

class EducationItem(BaseModel):
    degree: str
    institution: str
    location: str | None = None
    graduation_year: int | None = None

class ResumeRequest(BaseModel):
    job_role: str
    skills: list[str]

class ResumeResponse(BaseModel):
    name: str
    email: str
    phone: str
    summary: str
    experience: list[ExperienceItem]
    education: list[EducationItem]
    skills: list[str]

# ----------- Routes -----------
@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.post("/generate_resume")
def generate_resume(request: ResumeRequest):
    """
    Generate a professional resume dynamically using OpenAI GPT.
    Ensures skills are always included and experience/education are realistic.
    """
    try:
        # Smarter prompt with guaranteed skills
        prompt = f"""
        Create a professional resume for the role: {request.job_role}.
        Candidate skills: {', '.join(request.skills)}.

        - Make the experience realistic and relevant to the job role.
        - Include 1-2 experience items and 1 education item.
        - Return JSON ONLY with this exact structure.
        - The 'skills' array MUST exactly contain the input skills.

        JSON structure:
        {{
          "name": "string",
          "email": "string",
          "phone": "string",
          "summary": "string",
          "experience": [
            {{
              "job_title": "string",
              "company": "string",
              "location": "string",
              "start_date": "string",
              "end_date": "string",
              "responsibilities": ["string", "string"]
            }}
          ],
          "education": [
            {{
              "degree": "string",
              "institution": "string",
              "location": "string",
              "graduation_year": 2024
            }}
          ],
          "skills": {request.skills}
        }}
        """

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}  # May still return string
        )

        # Get content
        resume_dict = response.choices[0].message.content

        # Ensure it's a dict
        if isinstance(resume_dict, str):
            try:
                resume_dict = json.loads(resume_dict)
            except json.JSONDecodeError:
                # fallback to minimal structure
                resume_dict = {
                    "name": "",
                    "email": "",
                    "phone": "",
                    "summary": "",
                    "experience": [],
                    "education": [],
                    "skills": request.skills,
                }

        # Normalize experience
        resume_dict["experience"] = resume_dict.get("experience", [])
        for exp in resume_dict["experience"]:
            if not isinstance(exp.get("responsibilities"), list):
                exp["responsibilities"] = []

        # Normalize education and skills
        resume_dict["education"] = resume_dict.get("education", [])
        resume_dict["skills"] = resume_dict.get("skills") or request.skills

        return resume_dict

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
