import re

PLANT_KNOWLEDGE_BASE = [
    {
        "keywords": ["पीली", "पीला", "yellow", "yellowing", "chlorosis"],
        "hi": "पौधे की पत्तियां पीली होना आमतौर पर नाइट्रोजन की कमी या अधिक पानी देने (ओवर-वॉटरिंग) का संकेत है। कृपया मिट्टी की नमी जांचें और नाइट्रोजन युक्त जैविक खाद या वर्मीकम्पोस्ट डालें।",
        "en": "Yellowing leaves typically indicate nitrogen deficiency or overwatering. Please check soil moisture levels and consider applying a balanced nitrogen-rich organic fertilizer or compost.",
    },
    {
        "keywords": ["धब्बे", "काले धब्बे", "भूरे", "spot", "spots", "fungus", "फफूंद", "फंगस"],
        "hi": "पत्तियों पर भूरे या काले धब्बे फंगल संक्रमण (लीफ स्पॉट या ब्लाइट) हो सकते हैं। प्रभावित पत्तियों को तुरंत हटा दें और नीम के तेल या कॉपर फंगीसाइड का छिड़काव करें।",
        "en": "Brown or dark spots on leaves usually indicate a fungal infection like leaf spot or blight. Remove affected foliage and apply an organic neem oil spray or copper fungicide.",
    },
    {
        "keywords": ["कीड़े", "कीड़ा", "pest", "pests", "aphid", "aphids", "माहू", "सफेद मक्खी"],
        "hi": "कीड़ों और कीटों के नियंत्रण के लिए 5 मिली नीम का तेल 1 लीटर पानी और 2 बूंद लिक्विड सोप के साथ मिलाकर पत्तियों के दोनों तरफ अच्छी तरह स्प्रे करें।",
        "en": "For pest and insect control, mix 5ml of neem oil with 1 liter of water and a few drops of mild soap, then spray thoroughly on both sides of the leaves.",
    },
    {
        "keywords": ["मुरझा", "सूख", "wilt", "wilting", "dry"],
        "hi": "पौधा मुरझाना अत्यधिक धूप, जड़ों में फंगस (रूट रॉट) या पानी की भारी कमी के कारण हो सकता है। पौधे को थोड़ी छाया में रखें और गमले की जल निकासी (ड्रेनेज) जांचें।",
        "en": "Plant wilting is often caused by underwatering, excessive heat, or root rot due to poor drainage. Move the plant to partial shade and ensure the soil drains properly.",
    },
]

DEFAULT_FALLBACK = {
    "hi": "आपके पौधे की समस्या दर्ज कर ली गई है। कृपया मिट्टी की नमी, धूप की स्थिति और पत्तों के नीचे कीड़ों की जांच करें। बेहतर सलाह के लिए प्रभावित हिस्से का विवरण साझा करें।",
    "en": "Your plant inquiry has been noted. Please inspect the soil moisture, sunlight exposure, and check beneath leaves for pests. Provide more symptoms for specific guidance.",
}


def get_plant_diagnosis(query: str, language: str = "en") -> str:
    """
    Generates a plant diagnostic response based on symptom keywords.
    Matches the user's spoken language ('hi' for Hindi, 'en' for English).
    Easily extendable to hook into LLM / RAG services.
    """
    if not query:
        return DEFAULT_FALLBACK.get(language, DEFAULT_FALLBACK["en"])

    lower_query = query.lower()

    for item in PLANT_KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw.lower() in lower_query:
                return item.get(language, item["en"])

    return DEFAULT_FALLBACK.get(language, DEFAULT_FALLBACK["en"])
