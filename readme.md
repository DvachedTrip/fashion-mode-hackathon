 

## Техническое задание — AI Fashion Store (хакатон)

### 1. Общее описание

Интернет-магазин одежды с AI-ассистентом. Авторизация, корзина и заказы не реализуются. Фокус проекта — каталог товаров с гибкой фильтрацией и две AI-фичи: диалоговый поиск через Gemini и виртуальная примерка по фото.

Язык интерфейса: **Русский**. Комментарии в коде не пишутся.

 

### 2. Структура проекта

```
project-root/
├── backend/
└── frontend/
```

 

### 3. Стек технологий

**Backend:** Python, Django REST Framework, SQLite3, Gemini API, Pillow, python-decouple, django-filter, django-cors-headers

**Frontend:** React (разрабатывается отдельным участником по шаблону)

 

### 4. Структура backend

```
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── products/         # Каталог: товары, категории, теги
│   ├── ai_chat/          # AI-ассистент (Gemini)
│   └── ai_tryon/         # Виртуальная примерка
├── core/
│   ├── exceptions.py     # Кастомная обработка ошибок
│   ├── mixins.py         # DRY-миксины
│   └── pagination.py     # Единая пагинация
├── .env
├── manage.py
└── requirements.txt
```

 

### 5. Модели данных

**`products.Category`**
```
id, name, slug, parent (FK self, nullable) — поддержка вложенных категорий
```

**`products.Tag`**
```
id, name, slug
```
Теги используются как машиночитаемые метаданные товара для AI-промпта: цвет, стиль, материал, сезон, назначение и т.д. Примеры: `oversized`, `хлопок`, `лето`, `casual`, `чёрный`.

**`products.Product`**
```
id, name, description, price, category (FK),
brand, is_active, created_at
```

**`products.ProductImage`**
```
id, product (FK), image (FileField), is_main (bool)
```

**`products.ProductSize`**
```
id, product (FK), size (CharField), in_stock (bool)
```

**`products.ProductTag`** (M2M через явную промежуточную модель)
```
id, product (FK), tag (FK)
```

**`ai_chat.ChatSession`**
```
id, session_key (uuid, уникальный), created_at
```
Сессия анонимная — идентифицируется по `session_key`, который фронт хранит в `localStorage`.

**`ai_chat.ChatMessage`**
```
id, session (FK), role (user / assistant),
text (TextField), product_ids (JSONField, nullable), created_at
```
Поле `product_ids` хранит массив ID товаров, которые ассистент рекомендовал. Фронт по ним запрашивает карточки.

**`ai_tryon.TryOnRequest`**
```
id, session_key (CharField), product (FK → Product),
user_photo (ImageField), result_image (ImageField, nullable),
status (pending / processing / done / failed),
error_message (TextField, nullable), created_at
```

 

### 6. API Endpoints

**Каталог**
```
GET  /api/products/                      → список с фильтрацией и пагинацией
GET  /api/products/{id}/                 → детальная карточка + теги + размеры + изображения
GET  /api/products/categories/           → дерево категорий
GET  /api/products/tags/                 → список всех тегов (для фильтра на фронте)
```

Параметры фильтрации для `/api/products/`:
```
?category=<slug>
?tag=<slug>           (можно несколько: ?tag=casual&tag=лето)
?brand=<str>
?price_min=<int>
?price_max=<int>
?size=<str>
?search=<str>         (поиск по name, description, тегам)
?ordering=price / -price / created_at
```

**AI-чат**
```
POST  /api/ai/chat/sessions/                          → создать новую сессию → { session_key }
GET   /api/ai/chat/sessions/{session_key}/messages/   → история сообщений
POST  /api/ai/chat/sessions/{session_key}/messages/   → отправить сообщение
```

Тело запроса на отправку сообщения:
```json
{ "text": "хочу что-нибудь тёплое на зиму в стиле оверсайз" }
```

Ответ:
```json
{
  "message": "Нашёл несколько вариантов для тебя!",
  "products": [ <массив ProductShortSerializer> ]
}
```

**AI-примерка**
```
POST  /api/ai/tryon/          → multipart: session_key + product_id + user_photo
GET   /api/ai/tryon/{id}/     → { status, result_image_url, error_message }
```

 

### 7. Сервисный слой

Вся бизнес-логика выносится в `services.py` внутри каждого приложения. ViewSet'ы только принимают запрос, валидируют через сериализатор и делегируют сервису.

**`products/services.py`**
- `ProductFilterService` — применяет фильтры и возвращает QuerySet
- `ProductDetailService` — собирает полную карточку товара с предзагрузкой связей

**`ai_chat/services.py`**
- `GeminiChatService` — формирует системный промпт, вызывает Gemini API, парсит ответ
- `ProductContextBuilder` — достаёт из БД товары с тегами и строит JSON-контекст для промпта

**`ai_tryon/services.py`**
- `TryOnService` — принимает фото пользователя и фото товара, отправляет в Gemini Vision, сохраняет результат

 

### 8. Логика AI-чата — детально

Системный промпт, который `ProductContextBuilder` формирует для Gemini:

```
Ты — ассистент интернет-магазина одежды. Тебе доступен каталог товаров в формате JSON.
Каждый товар содержит: id, name, brand, price, category, tags (теги описывают стиль,
материал, цвет, сезон и назначение). Когда пользователь описывает желаемый образ или вещь,
выбери подходящие товары из каталога и верни ТОЛЬКО JSON без лишнего текста:
{ "message": "<ответ пользователю на русском>", "product_ids": [<id>, <id>] }

Каталог: <JSON всех активных товаров с тегами>
```

**Важно:** Backend никогда не передаёт raw-ответ Gemini клиенту напрямую. Ответ маппируется через dataclass `GeminiChatResponse(message: str, product_ids: list[int])`, затем из БД достаются реальные объекты Product и сериализуются.

 

### 9. Логика AI-примерки — детально

1. Фронт открывает модальное окно на карточке товара или в чате (под карточкой).
2. Пользователь загружает своё фото → фронт отправляет `POST /api/ai/tryon/`.
3. Backend сохраняет запись со статусом `pending`, возвращает `{ id }`.
4. В фоне (синхронно для MVP, через celery — опционально) вызывается `TryOnService`:
   - Берётся главное изображение товара (`is_main=True`).
   - Оба изображения кодируются в base64 и отправляются в Gemini Vision.
   - Промпт: *"Сгенерируй изображение человека с этой фотографии в одежде с второй фотографии. Сохрани лицо, телосложение и позу человека."*
   - Результат сохраняется в `result_image`, статус → `done`.
5. Фронт поллингом (раз в 2 секунды) запрашивает `GET /api/ai/tryon/{id}/` до `status = done`, затем отображает результат.

 

### 10. Сериализаторы

`ProductShortSerializer` — используется в ответе чата и в списке каталога:
```
id, name, brand, price, main_image_url, category_name
```

`ProductDetailSerializer` — детальная карточка:
```
...все поля + images[], sizes[], tags[]
```

`ChatMessageSerializer` — сообщение в истории:
```
id, role, text, products (ProductShortSerializer[]), created_at
```

 

### 11. Требования к коду

**Безопасность:** `GEMINI_API_KEY` только через `.env`, валидация типов загружаемых файлов (только `image/*`), ограничение размера файла, защита от path traversal при сохранении изображений.

**ООП:** каждое приложение — изолированный модуль с моделью, сериализатором, вью, сервисом и URL. Связи только через публичные интерфейсы сервисов.

**DRY:** `ProductShortSerializer` используется везде, где нужна краткая карточка. Общая пагинация в `core/pagination.py`. Общая обработка ошибок в `core/exceptions.py`.

**Маппинг:** любой ответ внешнего API (Gemini) преобразуется через промежуточный dataclass перед использованием — raw JSON от Gemini не передаётся клиенту и не пишется в БД как есть.

 

### 12. Переменные окружения

```env
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
GEMINI_API_KEY=
MEDIA_ROOT=media/
MAX_UPLOAD_SIZE_MB=10
```

 

### 13. Тестовые данные (fixtures)

К сдаче необходимо подготовить `fixtures/initial_data.json` с не менее чем:
- 3 категории (например: Верхняя одежда, Трикотаж, Аксессуары)
- 15–20 товаров с изображениями, размерами и тегами
- 10–15 тегов (стиль, материал, сезон, цвет)

 

### 14. Что делает фронтенд-разработчик

- Страница каталога с фильтрами (категория, тег, бренд, цена, размер, поиск)
- Детальная карточка товара с галереей и кнопкой "Примерить образ"
- Модальное окно примерки: загрузка фото → индикатор загрузки → результат
- Чат-виджет (боковая панель или плавающая кнопка): сообщения + рендер карточек товаров в ответе ассистента
- Интеграция с REST API через Axios
- `session_key` чата и ID запросов примерки хранятся в `localStorage`

 

### 15. Что демонстрируется на хакатоне

Рабочий сценарий: открыть чат → написать *"хочу тёплый оверсайз свитер бежевого цвета"* → ассистент возвращает карточки товаров из каталога → нажать "Примерить" на понравившемся товаре → загрузить фото → получить сгенерированное изображение.