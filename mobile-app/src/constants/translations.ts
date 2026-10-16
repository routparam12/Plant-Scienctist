import { AppLanguage } from '../types';

export const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    // Navigation Tabs
    'nav.home': 'Home',
    'nav.crop': 'Crop',
    'nav.expert': 'Expert',
    'nav.profile': 'You',

    // Auth & Navigation
    'auth.loginTitle': 'Login or Create Account',
    'auth.loginSubtitle': 'Enter your mobile number or email to receive a secure login OTP.',
    'auth.emailPlaceholder': 'Enter email address (e.g., ramesh@farm.com)',
    'auth.mobilePlaceholder': '9876543210',
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
    'voice.quickQuestions': 'Quick qns to try',

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
    'nav.profile': 'आप',

    // Auth & Navigation
    'auth.loginTitle': 'लॉगिन करें या खाता बनाएं',
    'auth.loginSubtitle': 'सुरक्षित लॉगिन ओटीपी प्राप्त करने के लिए अपना मोबाइल नंबर या ईमेल दर्ज करें।',
    'auth.emailPlaceholder': 'ईमेल पता दर्ज करें (उदा. ramesh@farm.com)',
    'auth.mobilePlaceholder': '9876543210',
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

  mr: {
    // Navigation Tabs
    'nav.home': 'होम',
    'nav.crop': 'पीक',
    'nav.expert': 'तज्ज्ञ',
    'nav.profile': 'तुम्ही',

    // Auth & Navigation
    'auth.loginTitle': 'लॉगिन करा किंवा खाते तयार करा',
    'auth.loginSubtitle': 'सुरक्षित लॉगिन ओटीपी मिळवण्यासाठी तुमचा मोबाईल नंबर किंवा ईमेल प्रविष्ट करा.',
    'auth.emailPlaceholder': 'ईमेल प्रविष्ट करा (उदा. ramesh@farm.com)',
    'auth.mobilePlaceholder': '9876543210',
    'auth.tabEmail': 'ईमेल ',
    'auth.tabMobile': 'मोबाईल ',
    'auth.emailLabel': 'ईमेल पत्ता',
    'auth.mobileLabel': 'मोबाईल नंबर',
    'auth.mobileNotice': 'मोबाईल एसएमएस ओटीपी लवकरच येत आहे! कृपया लॉगिन करण्यासाठी ईमेल ओटीपी वापरा.',
    'auth.sendOtp': 'पडताळणी ओटीपी पाठवा',
    'auth.exploreApp': 'अॅप पहा',
    'auth.noPassword': 'पासवर्डची गरज नाही • झटपट ओटीपी प्रमाणीकरण',
    'auth.termsText': 'पुढे राहून, तुम्ही आमच्या सेवा अटी आणि कृषी गोपनीयता धोरणाशी सहमत आहात.',
    'auth.verifyTitle': 'ओटीपी कोड प्रविष्ट करा',
    'auth.verifySubtitle': 'पाठवलेला ६-अंकी पडताळणी कोड प्रविष्ट करा',
    'auth.verifyBtn': 'पडताळणी करा आणि साइन इन करा',
    'auth.backToEmail': 'ईमेल बदला',

    // Greetings
    'greeting.welcome': 'स्वागत आहे',
    'greeting.welcomeBack': 'पुन्हा स्वागत आहे',
    'greeting.morning': 'शुभ सकाळ',
    'greeting.afternoon': 'शुभ दुपार',
    'greeting.evening': 'शुभ संध्या',
    'greeting.hello': 'नमस्कार',

    // Location
    'location.useCurrent': 'तुमचे सध्याचे स्थान वापरा?',
    'location.permDesc': 'तुमचे स्थान आम्हाला स्थानिक हवामान, पीक काळजी शिफारसी आणि जवळपासच्या सेवा प्रदान करण्यात मदत करते. तुम्ही प्रवेश न देता तुमचे साइनअप स्थान वापरणे सुरू ठेवू शकता.',
    'location.allow': 'स्थान अनुमती द्या',
    'location.notNow': 'आत्ता नाही',
    'location.manual': 'स्थान मॅन्युअली प्रविष्ट करा',
    'location.settings': 'अॅप सेटिंग्ज उघडा',

    // Home
    'home.greeting': 'शुभ संध्या, परमजीत',
    'home.subGreeting': 'शुभ सकाळ',
    'home.askPlaceholder': 'तुमच्या भाषेत विचारा...',
    'home.thisWeek': 'या आठवड्यात',
    'home.myCrops': 'माझी पिके',
    'home.addCrop': '+ जोडा',
    'home.rainAlertTitle': 'गुरुवारी पाऊस.',
    'home.rainAlertSub': 'फवारणी शुक्रवारी करा.',
    'home.stage': 'टप्पा',
    'home.cycleCompleted': 'चक्र पूर्ण',

    // Crop / Pathology
    'crop.headerTitle': 'पिके आणि शेत यादी',
    'crop.headerSubtitle': 'वाढीचे टप्पे, कामे आणि जैविक धोक्यांचा मागोवा घ्या',
    'crop.totalFields': 'एकूण शेत',
    'crop.activeFields': 'सक्रिय',
    'crop.needsCare': 'काळजी आवश्यक',
    'crop.onTrack': 'योग्य स्थिती',

    // Expert
    'expert.title': 'कृषी तज्ज्ञ',
    'expert.subtitle': 'प्रमाणित कृषी वैज्ञानिकांचा सल्ला घ्या',
    'expert.bookCall': 'कॉल बुक करा',
    'expert.chat': 'चॅट करा',

    // Doctor / Scanner
    'scanner.title': 'एआई पीक डॉक्टर',
    'scanner.takePhoto': 'पानाचा फोटो घ्या',
    'scanner.uploadGallery': 'गॅलरीतून निवडा',
    'scanner.analyzing': 'पीक रोगाचे निदान करत आहे...',
    'scanner.disclaimerNote': 'कृपया स्थानिक कृषी तज्ज्ञांकडून निदानाची खात्री करा आणि उत्पादन लेबलवरील सूचनांचे काटेकोरपणे पालन करा।',

    // Voice Assistant
    'voice.title': 'प्लांट सायंटिस्ट एआय व्हॉईस',
    'voice.subtitle': 'तुमच्या स्थानिक भाषेत पिके, कीटक, खते किंवा हवामानाबद्दल काहीही विचारा.',
    'voice.quickQuestions': 'विचारण्यासाठी मुख्य प्रश्न',

    // Profile
    'profile.verified': 'पडताळलेले',
    'profile.farmRecords': 'शेत आणि कृषी नोंदी',
    'profile.preferences': 'प्राधान्ये आणि निदान',

    // Crop Stages & Status
    'stage.vegetative': 'शाकीय वाढ (Vegetative)',
    'stage.flowering': 'फुलोरा (Flowering)',
    'stage.fruiting': 'फळ धारणा (Fruiting)',
    'stage.grain_filling': 'दाणे भरणे (Grain Filling)',
    'stage.harvest': 'कापणी (Harvest)',
    'crop.notPlantedYet': 'लागवड तारीख नाही • तारीख जोडा',
    'crop.emptyTitle': 'तुम्ही काय पिकवत आहात ते सांगा',
    'crop.emptySub': 'पानाचा फोटो स्कॅन करा किंवा + दाबून पीक जोडा.',
    'crop.daysRemaining': 'दिवस काढणीसाठी शिल्लक',
    'crop.detailTitle': 'पीक तपशील',
    'crop.tasksTitle': 'काळजी कार्ये',
    'crop.diagnosesTitle': 'आरोग्य व रोग इतिहास',
    'crop.markResolved': 'निवारण झाले',
    'crop.markActive': 'सक्रिय समस्या',
    'crop.deleteCrop': 'पीक हटवा',
    'crop.setPlantedDate': 'पेरणीची तारीख निवडा',
    'crop.addFromDiagnosis': 'माझ्या पिकांमध्ये जोडा',
    'crop.linkToCrop': 'पिकाशी जोडा (पर्यायी)',
    'crop.timeline': 'वाढीची वेळरेखा',
  },
};

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
