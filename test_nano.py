import os
import google.generativeai as genai

# Hardcoding for test
genai.configure(api_key="AIzaSyAOm_V8e9eInyUBG-p5zqzGTqzWsvFrpnc")

try:
    print("Testing nano-banana-pro-preview...")
    model = genai.GenerativeModel('models/nano-banana-pro-preview')
    response = model.generate_content("Generate a picture of a red apple.")
    print("Text:", getattr(response, 'text', 'No text'))
    
    parts = getattr(response.candidates[0].content, 'parts', [])
    for p in parts:
        print(f"Part: {p}")
except Exception as e:
    print("Nano error:", repr(e))

try:
    print("\nTesting gemini-2.5-flash-image...")
    model2 = genai.GenerativeModel('models/gemini-2.5-flash-image')
    response2 = model2.generate_content("Generate a picture of a blue apple.")
    print("Text:", getattr(response2, 'text', 'No text'))
    
    parts2 = getattr(response2.candidates[0].content, 'parts', [])
    for p in parts2:
        print(f"Part: {p}")
except Exception as e:
    print("Flash-image error:", repr(e))
