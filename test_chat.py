import requests

BASE_URL = "http://127.0.0.1:8000/api/ai/chat"

print("1. Создаем новую сессию чата...")
session_response = requests.post(f"{BASE_URL}/sessions/")
if session_response.status_code == 201:
    session_data = session_response.json()
    session_key = session_data['session_key']
    print(f"✅ Сессия создана! ID: {session_key}\n")
    
    # Можете поменять текст запроса на любой другой
    user_message = "Подбери мне стильный образ на весну для прогулок, желательно что-то в светлых тонах"
    print(f"2. Отправляем сообщение: '{user_message}'")
    print("⏳ Ожидаем ответ от Gemini... (это может занять несколько секунд)\n")
    
    msg_response = requests.post(
        f"{BASE_URL}/sessions/{session_key}/messages/",
        json={"text": user_message}
    )
    
    if msg_response.status_code == 201:
        reply = msg_response.json()
        print("🤖 ОТВЕТ ИИ-СТИЛИСТА:")
        print("--------------------------------------------------")
        print(reply['text'])
        print("--------------------------------------------------")
        
        products = reply.get('products', [])
        if products:
            print(f"\n🛍 Прикрепленные товары из базы ({len(products)} шт):")
            for p in products:
                print(f"  - {p['name']} (Бренд: {p['brand']}, Цвет: {p.get('color', 'Без цвета')}) - {p['price']} руб.")
        else:
            print("\n🛍 ИИ дал совет, но не прикрепил товары (скорее всего база пуста или нет подходящих по описанию вещей).")
    else:
        print(f"❌ Ошибка при отправке сообщения: {msg_response.text}")
else:
    print(f"❌ Ошибка создания сессии: {session_response.text}")
