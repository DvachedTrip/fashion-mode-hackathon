from dataclasses import dataclass
from typing import List
@dataclass
class GeminiChatResponse:
    message: str
    product_ids: List[int]