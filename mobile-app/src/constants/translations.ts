import { AppLanguage } from '../types';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navigation Tabs
    'nav.home': 'Home',
    'nav.crop': 'Crop',
    'nav.expert': 'Expert',
    'nav.profile': 'Profile',

    // Auth & Navigation
    'auth.loginTitle': 'Login or Create Account',
    'auth.loginSubtitle': 'Enter your mobile number or email to receive a secure login OTP.',
    'auth.emailPlaceholder': 'Enter email address',
    'auth.mobilePlaceholder': 'Enter mobile number',
    'auth.tabEmail': 'Email',
    'auth.tabMobile': 'Mobile ',
    'auth.emailLabel': 'Email Address',
    'auth.mobileLabel': 'Mobile Number',
    'auth.mobileNotice': 'Mobile SMS OTP is coming soon! Please use the Email OTP tab to log in.',
    'auth.sendOtp': 'Send Verification OTP',
    'auth.exploreApp': 'Explore App',
    'auth.noPassword': 'No Password Needed • Instant OTP Authentication',
    'auth.termsText': 'By continuing, you agree to our Terms of Service & Agricultural Privacy Policy.',
    'auth.verifyTitle': 'Enter OTP Code',
    'auth.verifySubtitle': 'Enter 6-digit verification code sent to',
    'auth.verifyBtn': 'Verify & Sign In',
    'auth.backToEmail': 'Change Email',

    // Greetings
    'greeting.welcome': 'Welcome',
    'greeting.welcomeBack': 'Welcome back',
    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',
    'greeting.hello': 'Hello',

    // Location
    'location.useCurrent': 'Use your current location?',
    'location.permDesc': 'Your location helps us provide local weather, plant-care recommendations and nearby services. You can continue using your signup location without allowing access.',
    'location.allow': 'Allow location',
    'location.notNow': 'Not now',
    'location.manual': 'Enter location manually',
    'location.settings': 'Open app settings',

    // Home
    'home.greeting': 'Good evening, Paramjeet',
    'home.subGreeting': 'Good morning',
    'home.askPlaceholder': 'Ask in your language...',
    'home.thisWeek': 'This week',
    'home.myCrops': 'My crops',
    'home.addCrop': '+ Add',
    'home.rainAlertTitle': 'Rain Thursday.',
    'home.rainAlertSub': 'Delay spraying to Friday.',
    'home.stage': 'Stage',
    'home.cycleCompleted': 'Cycle Completed',

    // Crop / Pathology
    'crop.headerTitle': 'Crops & Field Inventory',
    'crop.headerSubtitle': 'Track growth stages, tasks, and biological risks',
    'crop.totalFields': 'Total Fields',
    'crop.activeFields': 'Active',
    'crop.needsCare': 'Needs Care',
    'crop.onTrack': 'On Track',

    // Expert
    'expert.title': 'Field Experts',
    'expert.subtitle': 'Consult certified ICAR & university agricultural scientists',
    'expert.bookCall': 'Book a Call',
    'expert.chat': 'Chat',

    // Doctor / Scanner
    'scanner.title': 'AI Plant Pathology Doctor',
    'scanner.takePhoto': 'Snap Leaf Photo',
    'scanner.uploadGallery': 'Gallery Upload',
    'scanner.analyzing': 'Diagnosing Plant Specimen...',
    'scanner.disclaimerNote': 'Please confirm diagnosis with a local agronomist and strictly follow the product label instructions.',

    // Voice Assistant
    'voice.title': 'Plant Scientist AI Voice',
    'voice.subtitle': 'Ask anything about crops, pests, fertilizers or weather in your local language.',
    'voice.quickQuestions': 'Quick questions to try',
    'voice.listening': 'Listening...',
    'voice.tapToStop': 'Tap to finish speaking & analyze',
    'voice.tapToStart': 'Tap mic to speak',
    'voice.processing': 'Listening & analyzing crop diagnosis...',
    'voice.speaking': 'Plant Doctor is speaking...',
    'voice.replay': 'Replay Voice Advice',
    'voice.pause': 'Pause Voice',
    'voice.editPrompt': 'Edit Question',
    'voice.askAgain': 'Ask / Retry',
    'voice.detectedCrop': 'Crop Context',
    'voice.activeIssue': 'Active Issue',

    // Profile
    'profile.verified': 'VERIFIED',
    'profile.farmRecords': 'Farm & Agronomy Records',
    'profile.preferences': 'Preferences & Diagnostics',

    // Crop Stages & Status
    'stage.vegetative': 'Vegetative',
    'stage.flowering': 'Flowering',
    'stage.fruiting': 'Fruiting',
    'stage.grain_filling': 'Grain Filling',
    'stage.harvest': 'Harvest',
    'crop.notPlantedYet': 'Planted: not set • Add date',
    'crop.emptyTitle': "Tell us what you're growing",
    'crop.emptySub': 'Scan a leaf or ask voice doctor to track your crops.',
    'crop.daysRemaining': 'days to harvest',
    'crop.detailTitle': 'Crop Details',
    'crop.tasksTitle': 'Care Tasks',
    'crop.diagnosesTitle': 'Health & Issue History',
    'crop.markResolved': 'Mark Resolved',
    'crop.markActive': 'Mark Active',
    'crop.deleteCrop': 'Delete Crop',
    'crop.setPlantedDate': 'Set Planted Date',
    'crop.addFromDiagnosis': 'Add to My Crops',
    'crop.linkToCrop': 'Link to Crop (Optional)',
    'crop.timeline': 'Growth Timeline',
  },

  hi: {
    // Navigation Tabs
    'nav.home': 'होम',
    'nav.crop': 'फसल',
    'nav.expert': 'विशेषज्ञ',
    'nav.profile': 'प्रोफ़ाइल',

    // Auth & Navigation
    'auth.loginTitle': 'लॉगिन करें या खाता बनाएं',
    'auth.loginSubtitle': 'सुरक्षित लॉगिन ओटीपी प्राप्त करने के लिए अपना मोबाइल नंबर या ईमेल दर्ज करें।',
    'auth.emailPlaceholder': 'ईमेल पता दर्ज करें',
    'auth.mobilePlaceholder': 'मोबाइल नंबर दर्ज करें',
    'auth.tabEmail': 'ईमेल ',
    'auth.tabMobile': 'मोबाइल ',
    'auth.emailLabel': 'ईमेल पता',
    'auth.mobileLabel': 'मोबाइल नंबर',
    'auth.mobileNotice': 'मोबाइल एसएमएस ओटीपी जल्द ही आ रहा है! कृपया लॉगिन करने के लिए ईमेल ओटीपी का उपयोग करें।',
    'auth.sendOtp': 'सत्यापन ओटीपी भेजें',
    'auth.exploreApp': 'ऐप देखें',
    'auth.noPassword': 'कोई पासवर्ड नहीं चाहिए • तुरंत ओटीपी प्रमाणीकरण',
    'auth.termsText': 'जारी रखकर, आप हमारी सेवा की शर्तों और कृषि गोपनीयता नीति से सहमत होते हैं।',
    'auth.verifyTitle': 'ओटीपी कोड दर्ज करें',
    'auth.verifySubtitle': 'भेजा गया 6-अंकीय सत्यापन कोड दर्ज करें',
    'auth.verifyBtn': 'सत्यापित करें और साइन इन करें',
    'auth.backToEmail': 'ईमेल बदलें',

    // Greetings
    'greeting.welcome': 'स्वागत है',
    'greeting.welcomeBack': 'वापसी पर स्वागत है',
    'greeting.morning': 'सुप्रभात',
    'greeting.afternoon': 'शुभ दोपहर',
    'greeting.evening': 'शुभ संध्या',
    'greeting.hello': 'नमस्ते',

    // Location
    'location.useCurrent': 'अपने वर्तमान स्थान का उपयोग करें?',
    'location.permDesc': 'आपका स्थान हमें स्थानीय मौसम, फसल देखभाल सिफारिशें और नजदीकी सुविधाएं प्रदान करने में मदद करता है। आप बिना अनुमति के अपने साइनअप स्थान का उपयोग जारी रख सकते हैं।',
    'location.allow': 'स्थान अनुमति दें',
    'location.notNow': 'अभी नहीं',
    'location.manual': 'मैन्युअल रूप से स्थान दर्ज करें',
    'location.settings': 'ऐप सेटिंग्स खोलें',

    // Home
    'home.greeting': 'शुभ संध्या, परमजीत',
    'home.subGreeting': 'शुभ प्रभात',
    'home.askPlaceholder': 'अपनी भाषा में बोलें या पूछें...',
    'home.thisWeek': 'इस सप्ताह',
    'home.myCrops': 'मेरी फसलें',
    'home.addCrop': '+ जोड़ें',
    'home.rainAlertTitle': 'गुरुवार को बारिश।',
    'home.rainAlertSub': 'छिड़काव शुक्रवार तक टालें।',
    'home.stage': 'चरण',
    'home.cycleCompleted': 'चक्र पूरा हुआ',

    // Crop / Pathology
    'crop.headerTitle': 'फसल और खेत सूची',
    'crop.headerSubtitle': 'विकास के चरणों, कार्यों और जैविक जोखिमों पर नज़र रखें',
    'crop.totalFields': 'कुल खेत',
    'crop.activeFields': 'सक्रिय',
    'crop.needsCare': 'देखभाल की ज़रूरत',
    'crop.onTrack': 'सही स्थिति',

    // Expert
    'expert.title': 'कृषि विशेषज्ञ',
    'expert.subtitle': 'प्रमाणित कृषि वैज्ञानिकों से परामर्श लें',
    'expert.bookCall': 'कॉल बुक करें',
    'expert.chat': 'चैट करें',

    // Doctor / Scanner
    'scanner.title': 'एआई फसल डॉक्टर',
    'scanner.takePhoto': 'पत्ती का फोटो लें',
    'scanner.uploadGallery': 'गैलरी से चुनें',
    'scanner.analyzing': 'फसल रोग का निदान किया जा रहा है...',
    'scanner.disclaimerNote': 'कृपया स्थानीय कृषि विशेषज्ञ से निदान की पुष्टि करें और उत्पाद लेबल के निर्देशों का सख्ती से पालन करें।',

    // Voice Assistant
    'voice.title': 'प्लांट साइंटिस्ट एआई वॉइस',
    'voice.subtitle': 'अपनी स्थानीय भाषा में फसलों, कीटों, उर्वरकों या मौसम के बारे में कुछ भी पूछें।',
    'voice.quickQuestions': 'पूछने के लिए मुख्य प्रश्न',
    'voice.listening': 'सुन रहे हैं...',
    'voice.tapToStop': 'बोलने के बाद रोकने और पूछने के लिए टैप करें',
    'voice.tapToStart': 'बोलने के लिए माइक दबाएं',
    'voice.processing': 'फसल की स्थिति का विश्लेषण कर रहे हैं...',
    'voice.speaking': 'कृषि डॉक्टर बोल रहे हैं...',
    'voice.replay': 'पुनः सुनें',
    'voice.pause': 'रोकें',
    'voice.editPrompt': 'सवाल सुधारें',
    'voice.askAgain': 'फिर से पूछें',
    'voice.detectedCrop': 'पहचानी गई फसल',
    'voice.activeIssue': 'सक्रिय समस्या',

    // Profile
    'profile.verified': 'सत्यापित',
    'profile.farmRecords': 'फार्म और कृषि रिकॉर्ड',
    'profile.preferences': 'प्राथमिकताएं और निदान',

    // Crop Stages & Status
    'stage.vegetative': 'वानस्पतिक (Vegetative)',
    'stage.flowering': 'फूल आना (Flowering)',
    'stage.fruiting': 'फल बनना (Fruiting)',
    'stage.grain_filling': 'दाना भराव (Grain Filling)',
    'stage.harvest': 'कटाई (Harvest)',
    'crop.notPlantedYet': 'बुवाई तारीख नहीं दी • तारीख जोड़ें',
    'crop.emptyTitle': 'बताएं कि आप क्या उगा रहे हैं',
    'crop.emptySub': 'पत्ते का फोटो स्कैन करें या फसल जोड़ने के लिए + दबाएं।',
    'crop.daysRemaining': 'दिन कटाई शेष',
    'crop.detailTitle': 'फसल विवरण',
    'crop.tasksTitle': 'देखभाल कार्य',
    'crop.diagnosesTitle': 'स्वास्थ्य और रोग इतिहास',
    'crop.markResolved': 'समस्या हल चिह्नित करें',
    'crop.markActive': 'सक्रिय समस्या',
    'crop.deleteCrop': 'फसलएं',
    'crop.setPlantedDate': 'बुवाई की तारीख सेट करें',
    'crop.addFromDiagnosis': 'मेरी फसलों में जोड़ें',
    'crop.linkToCrop': 'फसल से जोड़ें (वैकल्पिक)',
    'crop.timeline': 'विकास समयरेखा',
  },

};
;

export function t(key: string, lang: AppLanguage = 'en'): string {
  const languageDict = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  return languageDict[key] || TRANSLATIONS['en'][key] || key;
}

export interface GreetingOptions {
  firstName?: string;
  isNewSignup?: boolean;
  inactiveDays?: number;
  currentHour?: number;
  language?: AppLanguage;
}

export function getGreeting({
  firstName,
  isNewSignup = false,
  inactiveDays = 0,
  currentHour = new Date().getHours(),
  language = 'en',
}: GreetingOptions): string {
  const name = firstName?.trim() || '';

  if (isNewSignup) {
    const welcome = t('greeting.welcome', language);
    return name ? `${welcome}, ${name}` : welcome;
  }

  if (inactiveDays >= 7) {
    const welcomeBack = t('greeting.welcomeBack', language);
    return name ? `${welcomeBack}, ${name}` : welcomeBack;
  }

  let greetingKey: string;
  if (currentHour >= 5 && currentHour < 12) {
    greetingKey = 'greeting.morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    greetingKey = 'greeting.afternoon';
  } else if (currentHour >= 17 && currentHour < 22) {
    greetingKey = 'greeting.evening';
  } else {
    greetingKey = 'greeting.hello';
  }

  const greetingText = t(greetingKey, language);
  return name ? `${greetingText}, ${name}` : greetingText;
}
