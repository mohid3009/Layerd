import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle2, Clock, FileText, ArrowRight, Activity, MapPin, Search,
  ShieldCheck, Printer, AlertTriangle, Copy, Check, ExternalLink, HelpCircle,
  ChevronDown, ChevronUp, FileCheck, Layers, Hash, Sparkles, X, PlusCircle,
  Volume2
} from 'lucide-react'
import { citizenProperties, peekUnits, demoBaseUlpin, digipin, generateUnits } from '../api.js'
import { activityLog, complaints, addComplaint, getUnit } from '../mockData.js'
import CubeMark from './CubeMark.jsx'
import Building3DScene from './Building3DScene.jsx'
import MapInset from './ui/MapInset.jsx'

const M_PER_DEG = 111320

const i18n = {
  'Overview & Services': { 'हिंदी': 'अवलोकन और सेवाएं', 'தமிழ்': 'கண்ணோட்டம் மற்றும் சேவைகள்' },
  'My Properties': { 'हिंदी': 'मेरी संपत्तियां', 'தமிழ்': 'என் சொத்துக்கள்' },
  'Grievances & Disputes': { 'हिंदी': 'शिकायतें और विवाद', 'தமிழ்': 'குறைகள் மற்றும் தகராறுகள்' },
  'Digital Passport': { 'हिंदी': 'डिजिटल पासपोर्ट', 'தமிழ்': 'டிஜிட்டல் பாஸ்போர்ட்' },
  '3D City Map View': { 'हिंदी': '3D शहर का नक्शा', 'தமிழ்': '3D நகர வரைபடம்' },
  'Welcome': { 'हिंदी': 'स्वागत है', 'தமிழ்': 'வரவேற்கிறோம்' },
  'View My Properties': { 'हिंदी': 'मेरी संपत्तियां देखें', 'தமிழ்': 'என் சொத்துக்களைக் காண்க' },
  'Download UPC Certificate & Deed': { 'हिंदी': 'UPC प्रमाणपत्र डाउनलोड करें', 'தமிழ்': 'UPC சான்றிதழைப் பதிவிறக்குக' },
  'Properties Owned': { 'हिंदी': 'स्वामित्व वाली संपत्तियां', 'தமிழ்': 'சொந்தமான சொத்துக்கள்' },
  '3D Units Mapped': { 'हिंदी': '3D इकाइयां मैप की गईं', 'தமிழ்': '3D அலகுகள் வரைபடமாக்கப்பட்டன' },
  'Total Footprint Area': { 'हिंदी': 'कुल पदचिह्न क्षेत्र', 'தமிழ்': 'மொத்த தடம் பரப்பளவு' },
  'Title Verification Health': { 'हिंदी': 'स्वामित्व सत्यापन स्वास्थ्य', 'தமிழ்': 'தலைப்பு சரிபார்ப்பு ஆரோக்கியம்' },
  'Citizen Self-Service Actions': { 'हिंदी': 'नागरिक स्वयं-सेवा क्रियाएं', 'தமிழ்': 'குடிமக்கள் சுய சேவை செயல்கள்' },
  'Unit Change Notifications': { 'हिंदी': 'इकाई परिवर्तन सूचनाएं', 'தமிழ்': 'அலகு மாற்ற அறிவிப்புகள்' },
  '3D Cadastre Survey Status': { 'हिंदी': '3D कैडस्ट्रे सर्वेक्षण स्थिति', 'தமிழ்': '3D காடாஸ்ட்ரே கணக்கெடுப்பு நிலை' },
  'Recent Cadastre Notices & Activity': { 'हिंदी': 'हाल के कैडस्ट्रे नोटिस और गतिविधि', 'தமிழ்': 'சமீபத்திய காடாஸ்ட்ரே அறிவிப்புகள் மற்றும் செயல்பாடு' },
  'Frequently Asked Questions for Property Owners': { 'हिंदी': 'संपत्ति मालिकों के लिए अक्सर पूछे जाने वाले प्रश्न', 'தமிழ்': 'சொத்து உரிமையாளர்களுக்கான அடிக்கடி கேட்கப்படும் கேள்விகள்' },
  'Open Passport →': { 'हिंदी': 'पासपोर्ट खोलें →', 'தமிழ்': 'பாஸ்போர்ட்டைத் திறக்க →' },
  'Download Certificate →': { 'हिंदी': 'प्रमाणपत्र डाउनलोड करें →', 'தமிழ்': 'சான்றிதழைப் பதிவிறக்குக →' },
  'Track & File Issue →': { 'हिंदी': 'समस्या ट्रैक और दर्ज करें →', 'தமிழ்': 'சிக்கலைக் கண்காணிக்கவும் & பதிவு செய்யவும் →' },
  'Inspect Hash Chain →': { 'हिंदी': 'हैश चेन का निरीक्षण करें →', 'தமிழ்': 'ஹாஷ் சங்கிலியை ஆய்வு செய்க →' },
  'No registered properties yet': { 'हिंदी': 'अभी तक कोई पंजीकृत संपत्ति नहीं', 'தமிழ்': 'இன்னும் பதிவு செய்யப்பட்ட சொத்துக்கள் இல்லை' },
  'When a property is registered against your Aadhaar-linked account, its 3D volumetric title record will appear here automatically.': { 'हिंदी': 'जब कोई संपत्ति आपके आधार से जुड़े खाते में पंजीकृत होती है, तो उसका 3D वोल्यूमेट्रिक शीर्षक रिकॉर्ड स्वचालित रूप से यहां दिखाई देगा।', 'தமிழ்': 'உங்கள் ஆதார் இணைக்கப்பட்ட கணக்கில் ஒரு சொத்து பதிவு செய்யப்படும்போது, அதன் 3D தலைப்பு பதிவு தானாகவே இங்கே தோன்றும்.' },
  'Explore the 3D City Map': { 'हिंदी': '3D सिटी मैप एक्सप्लोर करें', 'தமிழ்': '3D நகர வரைபடத்தை ஆராயுங்கள்' },
  'No properties matched your search': { 'हिंदी': 'आपकी खोज से कोई संपत्ति मेल नहीं खाती', 'தமிழ்': 'உங்கள் தேடலுடன் எந்த சொத்துக்களும் பொருந்தவில்லை' },
  'Try a different apartment number, building name or ULPIN key.': { 'हिंदी': 'एक अलग अपार्टमेंट नंबर, भवन का नाम या ULPIN कुंजी आज़माएं।', 'தமிழ்': 'வேறு அபார்ட்மெண்ட் எண், கட்டிடத்தின் பெயர் அல்லது ULPIN விசையை முயற்சிக்கவும்.' },
  'Reset Search & Filters': { 'हिंदी': 'खोज और फ़िल्टर रीसेट करें', 'தமிழ்': 'தேடல் மற்றும் வடிப்பான்களை மீட்டமைக்கவும்' },
  'All Properties': { 'हिंदी': 'सभी संपत्तियां', 'தமிழ்': 'அனைத்து சொத்துக்கள்' },
  '✓ Clear Title': { 'हिंदी': '✓ स्पष्ट स्वामित्व', 'தமிழ்': '✓ தெளிவான தலைப்பு' },
  'In Review': { 'हिंदी': 'समीक्षा में', 'தமிழ்': 'மதிப்பாய்வில்' },
  'Carpet Area': { 'हिंदी': 'कारपेट क्षेत्र', 'தமிழ்': 'கம்பளப் பகுதி' },
  'Registered Owner': { 'हिंदी': 'पंजीकृत स्वामी', 'தமிழ்': 'பதிவு செய்யப்பட்ட உரிமையாளர்' },
  'National 3D ULPIN': { 'हिंदी': 'राष्ट्रीय 3D ULPIN', 'தமிழ்': 'தேசிய 3D ULPIN' },
  'Encumbrance (NOC)': { 'हिंदी': 'भार (NOC)', 'தமிழ்': 'என்கம்பரன்ஸ் (NOC)' },
  'Nil / Clear Title': { 'हिंदी': 'शून्य / स्पष्ट स्वामित्व', 'தமிழ்': 'பூஜ்ஜியம் / தெளிவான தலைப்பு' },
  'Passport': { 'हिंदी': 'पासपोर्ट', 'தமிழ்': 'பாஸ்போர்ட்' },
  'Certificate': { 'हिंदी': 'प्रमाणपत्र', 'தமிழ்': 'சான்றிதழ்' },
  'Ledger': { 'हिंदी': 'खाता बही', 'தமிழ்': 'லெட்ஜர்' },
  'Report': { 'हिंदी': 'रिपोर्ट', 'தமிழ்': 'அறிக்கை' },
  'Map': { 'हिंदी': 'नक्शा', 'தமிழ்': 'வரைபடம்' },
  'File New Grievance': { 'हिंदी': 'नई शिकायत दर्ज करें', 'தமிழ்': 'புதிய குறையை பதிவு செய்யவும்' },
  'Tracked Tickets': { 'हिंदी': 'ट्रैक किए गए टिकट', 'தமிழ்': 'கண்காணிக்கப்படும் டிக்கெட்டுகள்' },
  'No grievances on record': { 'हिंदी': 'रिकॉर्ड पर कोई शिकायत नहीं', 'தமிழ்': 'பதிவில் எந்த குறைகளும் இல்லை' },
  'No complaints or disputes have been filed for your properties. Flag an issue and track its resolution from here.': { 'हिंदी': 'आपकी संपत्तियों के लिए कोई शिकायत या विवाद दर्ज नहीं किया गया है। यहां से एक समस्या को फ़्लैग करें और इसके समाधान को ट्रैक करें।', 'தமிழ்': 'உங்கள் சொத்துக்களுக்கு எந்த புகாரும் அல்லது தகராறும் பதிவு செய்யப்படவில்லை. இங்கிருந்து ஒரு சிக்கலைக் கொடியிட்டு அதன் தீர்மானத்தைக் கண்காணிக்கவும்.' },
  'File a Grievance': { 'हिंदी': 'शिकायत दर्ज करें', 'தமிழ்': 'குறையை பதிவு செய்யவும்' },
  'Select Disputed Area on 3D Model': { 'हिंदी': '3D मॉडल पर विवादित क्षेत्र चुनें', 'தமிழ்': '3D மாதிரியில் சர்ச்சைக்குரிய பகுதியைத் தேர்ந்தெடுக்கவும்' },
  'Cancel': { 'हिंदी': 'रद्द करें', 'தமிழ்': 'ரத்துசெய்' },
  'Submit Official Report': { 'हिंदी': 'आधिकारिक रिपोर्ट सबमिट करें', 'தமிழ்': 'அதிகாரப்பூர்வ அறிக்கையைச் சமர்ப்பிக்கவும்' },
  'Aadhaar Linked': { 'हिंदी': 'आधार लिंक्ड', 'தமிழ்': 'ஆதார் இணைக்கப்பட்டது' },
  'National Urban 3D Cadastre': { 'हिंदी': 'राष्ट्रीय शहरी 3D कैडस्ट्रे', 'தமிழ்': 'தேசிய நகர்ப்புற 3D காடாஸ்ட்ரே' },
  'Your portfolio holds': { 'हिंदी': 'आपके पोर्टफोलियो में है', 'தமிழ்': 'உங்கள் போர்ட்ஃபோலியோவில் உள்ளது' },
  'registered property parcel(s) in Chennai with': { 'हिंदी': 'चेन्नई में पंजीकृत संपत्ति पार्सल के साथ', 'தமிழ்': 'சென்னையில் பதிவு செய்யப்பட்ட சொத்து பார்சல்களுடன்' },
  'volumetric unit(s) mapped in 3D.': { 'हिंदी': '3D में मैप की गई वोल्यूमेट्रिक इकाई(इकाइयां)।', 'தமிழ்': '3D இல் வரைபடமாக்கப்பட்ட வோல்யூமெட்ரிக் அலகு(கள்).' },
  'unit(s) need attention': { 'हिंदी': 'इकाई(इकाइयों) पर ध्यान देने की आवश्यकता है', 'தமிழ்': 'அலகு(களுக்கு) கவனம் தேவை' },
  'flagged for review — open Grievances & Disputes to track resolution.': { 'हिंदी': 'समीक्षा के लिए फ़्लैग किया गया — समाधान ट्रैक करने के लिए शिकायतें और विवाद खोलें।', 'தமிழ்': 'மதிப்பாய்வுக்காக கொடியிடப்பட்டது — தீர்மானத்தைக் கண்காணிக்க குறைகள் மற்றும் தகராறுகளைத் திறக்கவும்.' },
  'All titles are clear and verified against the state revenue register.': { 'हिंदी': 'सभी स्वामित्व स्पष्ट हैं और राज्य राजस्व रजिस्टर के विरुद्ध सत्यापित हैं।', 'தமிழ்': 'அனைத்து தலைப்புகளும் தெளிவாக உள்ளன மற்றும் மாநில வருவாய் பதிவேட்டில் சரிபார்க்கப்படுகின்றன.' },
  'Good morning': { 'हिंदी': 'शुभ प्रभात', 'தமிழ்': 'காலை வணக்கம்' },
  'Good afternoon': { 'हिंदी': 'शुभ दोपहर', 'தமிழ்': 'மதிய வணக்கம்' },
  'Good evening': { 'हिंदी': 'शुभ संध्या', 'தமிழ்': 'மாலை வணக்கம்' },
  'Digital Property Passport': { 'हिंदी': 'डिजिटल संपत्ति पासपोर्ट', 'தமிழ்': 'டிஜிட்டல் சொத்து பாஸ்போர்ட்' },
  'Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.': { 'हिंदी': 'अपने आधिकारिक 3D वोल्यूमेट्रिक डीड, स्कैन करने योग्य QR सत्यापन कोड और वास्तुशिल्प फर्श की सीमाओं तक पहुंचें।', 'தமிழ்': 'உங்கள் அதிகாரப்பூர்வ 3D வோல்யூமெட்ரிக் பத்திரம், ஸ்கேன் செய்யக்கூடிய QR சரிபார்ப்பு குறியீடு மற்றும் கட்டடக்கலை தரை எல்லைகளை அணுகவும்.' },
  'Certified UPC & Title Deed': { 'हिंदी': 'प्रमाणित UPC और टाइटल डीड', 'தமிழ்': 'சான்றளிக்கப்பட்ட UPC & தலைப்பு பத்திரம்' },
  'Print or save an authenticated Government of India UPC Certificate & Title Deed with audit trail.': { 'हिंदी': 'ऑडिट ट्रेल के साथ प्रमाणित भारत सरकार का UPC प्रमाणपत्र और टाइटल डीड प्रिंट करें या सहेजें।', 'தமிழ்': 'தணிக்கை பாதையுடன் அங்கீகரிக்கப்பட்ட இந்திய அரசின் UPC சான்றிதழ் மற்றும் தலைப்பு பத்திரத்தை அச்சிடவும் அல்லது சேமிக்கவும்.' },
  'Grievances & Dispute Desk': { 'हिंदी': 'शिकायत और विवाद डेस्क', 'தமிழ்': 'குறைகள் மற்றும் தகராறு மேசை' },
  'Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.': { 'हिंदी': 'सीमा बेमेल, क्षेत्र विसंगतियों की रिपोर्ट करें, या जिला रजिस्ट्रार के साथ समाधान स्थिति को ट्रैक करें।', 'தமிழ்': 'எல்லை முரண்பாடுகள், பகுதி முரண்பாடுகள் அல்லது மாவட்ட பதிவாளரிடம் தீர்மான நிலையை கண்காணிக்கவும்.' },
  'Cryptographic Audit Chain': { 'हिंदी': 'क्रिप्टोग्राफिक ऑडिट चेन', 'தமிழ்': 'கிரிப்டோகிராஃபிக் தணிக்கை சங்கிலி' },
  'Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.': { 'हिंदी': 'अपने सेल डीड और LiDAR सर्वेक्षण जाल को मान्य करने वाले छेड़छाड़-सबूत ब्लॉकचेन लेजर का निरीक्षण करें।', 'தமிழ்': 'உங்கள் விற்பனை பத்திரம் மற்றும் LiDAR கணக்கெடுப்பு வலையை சரிபார்க்கும் டேம்பர்-ப்ரூஃப் பிளாக்செயின் லெட்ஜரை ஆய்வு செய்யவும்.' },
  'Search by apartment number, building name, or ULPIN key…': { 'हिंदी': 'अपार्टमेंट नंबर, भवन का नाम या ULPIN कुंजी द्वारा खोजें…', 'தமிழ்': 'அபார்ட்மெண்ட் எண், கட்டிடத்தின் பெயர் அல்லது ULPIN விசை மூலம் தேடுங்கள்...' },
  'Close': { 'हिंदी': 'बंद करें', 'தமிழ்': 'மூடு' },
  'Print / Save as PDF': { 'हिंदी': 'पीडीएफ के रूप में प्रिंट / सेव करें', 'தமிழ்': 'PDF ஆக அச்சிடுக / சேமிக்கவும்' },
  'Official Certificate of Ownership & 3D Title': { 'हिंदी': 'स्वामित्व और 3D शीर्षक का आधिकारिक प्रमाणपत्र', 'தமிழ்': 'உரிமையாளர் மற்றும் 3D தலைப்பின் அதிகாரப்பூர்வ சான்றிதழ்' },
  'CERTIFICATE OF VERTICAL PROPERTY TITLE': { 'हिंदी': 'वर्टिकल संपत्ति शीर्षक का प्रमाणपत्र', 'தமிழ்': 'செங்குத்து சொத்து தலைப்பின் சான்றிதழ்' },
  'Issued under the National Urban 3D Cadastre Framework (SIH26095)': { 'हिंदी': 'राष्ट्रीय शहरी 3D कैडस्ट्रे फ्रेमवर्क (SIH26095) के तहत जारी', 'தமிழ்': 'தேசிய நகர்ப்புற 3D காடாஸ்ட்ரே கட்டமைப்பு (SIH26095) இன் கீழ் வழங்கப்பட்டது' },
  'Unique Land Parcel Identification (3D ULPIN):': { 'हिंदी': 'अद्वितीय भूमि पार्सल पहचान (3D ULPIN):', 'தமிழ்': 'தனித்துவமான நிலக் பார்சல் அடையாளம் (3D ULPIN):' },
  'Registered Title Holder:': { 'हिंदी': 'पंजीकृत शीर्षक धारक:', 'தமிழ்': 'பதிவு செய்யப்பட்ட தலைப்புதாரர்:' },
  'Volumetric Space Designation:': { 'हिंदी': 'वोल्यूमेट्रिक अंतरिक्ष पदनाम:', 'தமிழ்': 'வோல்யூமெட்ரிக் விண்வெளி பதவி:' },
  'Registered Carpet Area:': { 'हिंदी': 'पंजीकृत कारपेट क्षेत्र:', 'தமிழ்': 'பதிவு செய்யப்பட்ட கம்பளப் பகுதி:' },
  'Encumbrance (NOC) Status:': { 'हिंदी': 'भार (NOC) स्थिति:', 'தமிழ்': 'என்கம்பரன்ஸ் (NOC) நிலை:' },
  'Issuance Date:': { 'हिंदी': 'जारी करने की तिथि:', 'தமிழ்': 'வழங்கப்பட்ட தேதி:' },
  'VERIFIED · DO NOT ALTER': { 'हिंदी': 'सत्यापित · न बदलें', 'தமிழ்': 'சரிபார்க்கப்பட்டது · மாற்ற வேண்டாம்' },
  'Registrar of Land Records': { 'हिंदी': 'भूमि रिकॉर्ड रजिस्ट्रार', 'தமிழ்': 'நிலப் பதிவேடுகளின் பதிவாளர்' },
  'Cadastral Zone Chennai Central': { 'हिंदी': 'कैडस्ट्राल ज़ोन चेन्नई सेंट्रल', 'தமிழ்': 'காடாஸ்ட்ரால் மண்டலம் சென்னை சென்ட்ரல்' },
  'Cryptographic Title Audit Trail': { 'हिंदी': 'क्रिप्टोग्राफिक शीर्षक ऑडिट ट्रेल', 'தமிழ்': 'கிரிப்டோகிராஃபிக் தலைப்பு தணிக்கை பாதை' },
  'Blockchain State: Verified & Unbroken': { 'हिंदी': 'ब्लॉकचेन स्थिति: सत्यापित और अखंड', 'தமிழ்': 'பிளாக்செயின் நிலை: சரிபார்க்கப்பட்டது & உடைக்கப்படாதது' },
  '3 Blocks': { 'हिंदी': '3 ब्लॉक', 'தமிழ்': '3 தொகுதிகள்' },
  'BLOCK #3 · 3D ULPIN MINTING': { 'हिंदी': 'ब्लॉक #3 · 3D ULPIN मिंटिंग', 'தமிழ்': 'தொகுதி #3 · 3D ULPIN மிண்டிங்' },
  'Vertical volumetric boundaries minted and registered to': { 'हिंदी': 'लंबवत वोल्यूमेट्रिक सीमाएँ ढाली गईं और पंजीकृत की गईं', 'தமிழ்': 'செங்குத்து வோல்யூமெட்ரிக் எல்லைகள் அச்சிடப்பட்டு பதிவு செய்யப்பட்டன' },
  'Block Hash:': { 'हिंदी': 'ब्लॉक हैश:', 'தமிழ்': 'தொகுதி ஹாஷ்:' },
  'Prev:': { 'हिंदी': 'पिछला:', 'தமிழ்': 'முந்தைய:' },
  'BLOCK #2 · TOPOLOGY VALIDATION': { 'हिंदी': 'ब्लॉक #2 · टोपोलॉजी सत्यापन', 'தமிழ்': 'தொகுதி #2 · டோபாலஜி சரிபார்ப்பு' },
  'LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected': { 'हिंदी': 'ओवरलैप के लिए LiDAR/OpenStreetMap बहुभुज की जाँच की गई · 0 परस्पर विरोधी वोल्यूम पाए गए', 'தமிழ்': 'LiDAR/OpenStreetMap பலகோணம் மேலெழுதல்களுக்கு சரிபார்க்கப்பட்டது · 0 முரண்பட்ட தொகுதிகள் கண்டறியப்பட்டன' },
  'BLOCK #1 · SALE DEED CONVEYANCE': { 'हिंदी': 'ब्लॉक #1 · सेल डीड हस्तांतरण', 'தமிழ்': 'தொகுதி #1 · விற்பனை பத்திரம் பரிமாற்றம்' },
  'Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12': { 'हिंदी': 'जेनेसिस कन्वेयंस SRO टी. नगर में पंजीकृत · पुस्तक 1, खंड 12', 'தமிழ்': 'ஆதியாகமம் பரிமாற்றம் SRO டி. நகரில் பதிவு செய்யப்பட்டது · புத்தகம் 1, தொகுதி 12' },
  'Close Audit View': { 'हिंदी': 'ऑडिट दृश्य बंद करें', 'தமிழ்': 'தணிக்கை காட்சியை மூடு' },
  'File a Property Discrepancy / Grievance': { 'हिंदी': 'संपत्ति विसंगति / शिकायत दर्ज करें', 'தமிழ்': 'சொத்து முரண்பாடு / குறையை பதிவு செய்யவும்' },
  'Select Property': { 'हिंदी': 'संपत्ति चुनें', 'தமிழ்': 'சொத்தைத் தேர்ந்தெடுக்கவும்' },
  'Issue Category': { 'हिंदी': 'समस्या श्रेणी', 'தமிழ்': 'சிக்கல் வகை' },
  'Discrepancy Details': { 'हिंदी': 'विसंगति विवरण', 'தமிழ்': 'முரண்பாடு விவரங்கள்' },
  'Ticket created! Redirecting to tracker…': { 'हिंदी': 'टिकट बन गया! ट्रैकर पर रीडायरेक्ट कर रहा है…', 'தமிழ்': 'டிக்கெட் உருவாக்கப்பட்டது! டிராக்கருக்குத் திருப்பி விடப்படுகிறது...' },
  'Describe the discrepancy with respect to your sale deed or physical inspection…': { 'हिंदी': 'अपने सेल डीड या भौतिक निरीक्षण के संबंध में विसंगति का वर्णन करें…', 'தமிழ்': 'உங்கள் விற்பனை பத்திரம் அல்லது உடல் பரிசோதனை தொடர்பாக முரண்பாட்டை விவரிக்கவும்...' },
  'Area mismatch (Deed area differs from 3D model)': { 'हिंदी': 'क्षेत्र बेमेल (डीड क्षेत्र 3D मॉडल से भिन्न है)', 'தமிழ்': 'பகுதி முரண்பாடு (பத்திரப் பகுதி 3D மாதிரியிலிருந்து வேறுபடுகிறது)' },
  'Boundary mismatch (Balcony/wall encroachment)': { 'हिंदी': 'सीमा बेमेल (बालकनी/दीवार अतिक्रमण)', 'தமிழ்': 'எல்லை முரண்பாடு (பால்கனி/சுவர் ஆக்கிரமிப்பு)' },
  'Wrong floor level recorded': { 'हिंदी': 'गलत फ्लोर लेवल दर्ज', 'தமிழ்': 'தவறான தரை நிலை பதிவு செய்யப்பட்டுள்ளது' },
  'Owner name or Aadhaar linkage spelling error': { 'हिंदी': 'मालिक का नाम या आधार लिंकेज वर्तनी त्रुटि', 'தமிழ்': 'உரிமையாளர் பெயர் அல்லது ஆதார் இணைப்பு எழுத்துப்பிழை' },
  'Unauthorized vertical construction on adjacent unit': { 'हिंदी': 'आसन्न इकाई पर अनधिकृत ऊर्ध्वाधर निर्माण', 'தமிழ்': 'அருகிலுள்ள அலகு மீது அங்கீகரிக்கப்படாத செங்குத்து கட்டுமானம்' },
  'Property:': { 'हिंदी': 'संपत्ति:', 'தமிழ்': 'சொத்து:' },
  'Filed on': { 'हिंदी': 'पर दर्ज', 'தமிழ்': 'தாக்கல் செய்யப்பட்டது' },
  'Resolution SLA: Within 7 days': { 'हिंदी': 'समाधान SLA: 7 दिनों के भीतर', 'தமிழ்': 'தீர்வு SLA: 7 நாட்களுக்குள்' },
  '✓ Resolved by Registrar': { 'हिंदी': '✓ रजिस्ट्रार द्वारा हल किया गया', 'தமிழ்': '✓ பதிவாளரால் தீர்க்கப்பட்டது' },
  '⋯ Under Active Review': { 'हिंदी': '⋯ सक्रिय समीक्षा के तहत', 'தமிழ்': '⋯ செயலில் உள்ள மதிப்பாய்வில் உள்ளது' },
  'Flat 302 title verified': { 'हिंदी': 'फ्लैट 302 शीर्षक सत्यापित', 'தமிழ்': 'பிளாட் 302 தலைப்பு சரிபார்க்கப்பட்டது' },
  'Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026': { 'हिंदी': 'रजिस्ट्रार अरुण कृष्णन ने 3D सीमा अद्यतन को मंजूरी दी · 2 सितंबर 2026', 'தமிழ்': 'பதிவாளர் அருண் கிருஷ்ணன் 3D எல்லை புதுப்பிப்பை அங்கீகரித்தார் · 2 செப் 2026' },
  'Flat 201 area mismatch under review': { 'हिंदी': 'फ्लैट 201 क्षेत्र बेमेल समीक्षा के अधीन', 'தமிழ்': 'பிளாட் 201 பகுதி முரண்பாடு மதிப்பாய்வில் உள்ளது' },
  'Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026': { 'हिंदी': 'सर्वेयर प्रिया वेंकटेशन को सौंपा गया · प्रतिक्रिया 29 सितंबर 2026 को देय', 'தமிழ்': 'சர்வேயர் பிரியா வெங்கடேசன் நியமிக்கப்பட்டுள்ளார் · பதில் 29 செப் 2026 அன்று நிலுவையில் உள்ளது' },
  'SHA-256 audit entry created': { 'हिंदी': 'SHA-256 ऑडिट प्रविष्टि बनाई गई', 'தமிழ்': 'SHA-256 தணிக்கை உள்ளீடு உருவாக்கப்பட்டது' },
  'New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026': { 'हिंदी': 'फ्लैट 203, लेकव्यू रेजिडेंसी के लिए नया हैश-चेन रिकॉर्ड जोड़ा गया · 27 अगस्त 2026', 'தமிழ்': 'பிளாட் 203, லேக்வியூ ரெசிடென்சிக்கான புதிய ஹாஷ்-சங்கிலி பதிவு சேர்க்கப்பட்டது · 27 ஆகஸ்ட் 2026' },
  'Live': { 'हिंदी': 'लाइव', 'தமிழ்': 'நேரலை' },
  'mapped in 3D:': { 'हिंदी': '3D में मैप किया गया:', 'தமிழ்': '3D இல் வரைபடமாக்கப்பட்டது:' },
  'Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.': { 'हिंदी': 'आपकी संपत्तियों ने ग्रेटर चेन्नई कैडस्ट्रे के साथ पंजीकृत LiDAR और OpenStreetMap वोल्यूमेट्रिक स्टोरीज़ को सत्यापित किया है।', 'தமிழ்': 'உங்கள் சொத்துக்கள் கிரேட்டர் சென்னை காடாஸ்ட்ரேயில் பதிவு செய்யப்பட்ட LiDAR மற்றும் OpenStreetMap வோல்யூமெட்ரிக் தளங்களை சரிபார்த்துள்ளன.' },
  'What is a 3D ULPIN and how does it protect my flat?': { 'हिंदी': '3D ULPIN क्या है और यह मेरे फ्लैट की रक्षा कैसे करता है?', 'தமிழ்': '3D ULPIN என்றால் என்ன, அது எனது பிளாட்டை எவ்வாறு பாதுகாக்கிறது?' },
  'Standard land records only register ground land parcels (2D). A 3D ULPIN assigns a unique, immutable spatial volume code to your specific apartment floor and unit envelope. This guarantees your vertical ownership rights against duplication, encroachment, or boundary ambiguity.': { 'हिंदी': 'मानक भूमि रिकॉर्ड केवल जमीनी भूमि पार्सल (2D) को पंजीकृत करते हैं। एक 3D ULPIN आपके विशिष्ट अपार्टमेंट फ्लोर और यूनिट लिफाफे को एक अद्वितीय, अपरिवर्तनीय स्थानिक वॉल्यूम कोड प्रदान करता है। यह दोहराव, अतिक्रमण या सीमा अस्पष्टता के खिलाफ आपके ऊर्ध्वाधर स्वामित्व अधिकारों की गारंटी देता है।', 'தமிழ்': 'நிலையான நிலப் பதிவேடுகள் தரை நிலப் பார்சல்களை (2D) மட்டுமே பதிவு செய்கின்றன. ஒரு 3D ULPIN உங்கள் குறிப்பிட்ட அபார்ட்மெண்ட் தளம் மற்றும் யூனிட் உறைக்கு ஒரு தனித்துவமான, மாறாத இடஞ்சார்ந்த தொகுதி குறியீட்டை ஒதுக்குகிறது. இது நகல், ஆக்கிரமிப்பு அல்லது எல்லை முரண்பாட்டிற்கு எதிராக உங்கள் செங்குத்து உரிமை உரிமைகளுக்கு உத்தரவாதம் அளிக்கிறது.' },
  'Can I use this Digital Passport to obtain a bank mortgage or NOC?': { 'हिंदी': 'क्या मैं बैंक बंधक या NOC प्राप्त करने के लिए इस डिजिटल पासपोर्ट का उपयोग कर सकता हूं?', 'தமிழ்': 'வங்கி அடமானம் அல்லது NOC பெற இந்த டிஜிட்டல் பாஸ்போர்ட்டைப் பயன்படுத்தலாமா?' },
  'Yes. The 3D Digital Passport contains verified encumbrance status, Record of Rights (RoR) data, and a digitally scannable QR code recognized by participating financial institutions and the National Generic Document Registration System (NGDRS).': { 'हिंदी': 'हाँ। 3D डिजिटल पासपोर्ट में सत्यापित भार स्थिति, रिकॉर्ड ऑफ राइट्स (RoR) डेटा और भाग लेने वाले वित्तीय संस्थानों और राष्ट्रीय जेनेरिक दस्तावेज़ पंजीकरण प्रणाली (NGDRS) द्वारा मान्यता प्राप्त एक डिजिटल स्कैन करने योग्य QR कोड शामिल है।', 'தமிழ்': 'ஆம். 3D டிஜிட்டல் பாஸ்போர்ட்டில் சரிபார்க்கப்பட்ட என்கம்பரன்ஸ் நிலை, உரிமைகளின் பதிவு (RoR) தரவு மற்றும் பங்கேற்கும் நிதி நிறுவனங்கள் மற்றும் தேசிய பொதுவான ஆவணப் பதிவு முறை (NGDRS) மூலம் அங்கீகரிக்கப்பட்ட டிஜிட்டல் ஸ்கேன் செய்யக்கூடிய QR குறியீடு ஆகியவை உள்ளன.' },
  'What should I do if my registered area does not match my sale deed?': { 'हिंदी': 'यदि मेरा पंजीकृत क्षेत्र मेरे सेल डीड से मेल नहीं खाता है तो मुझे क्या करना चाहिए?', 'தமிழ்': 'எனது பதிவு செய்யப்பட்ட பகுதி எனது விற்பனை பத்திரத்துடன் பொருந்தவில்லை என்றால் நான் என்ன செய்ய வேண்டும்?' },
  'You can file a quick grievance directly via the "Grievance Desk" tab. The District Land Registrar and Cadastral Surveyors will review your deed against the 3D LiDAR/OSM volumetric mesh and issue an updated spatial determination within 7 working days.': { 'हिंदी': 'आप सीधे "शिकायत डेस्क" टैब के माध्यम से एक त्वरित शिकायत दर्ज कर सकते हैं। जिला भूमि रजिस्ट्रार और कैडस्ट्राल सर्वेयर 3D LiDAR/OSM वोल्यूमेट्रिक मेश के खिलाफ आपके डीड की समीक्षा करेंगे और 7 कार्य दिवसों के भीतर एक अद्यतन स्थानिक निर्धारण जारी करेंगे।', 'தமிழ்': 'நீங்கள் நேரடியாக "குறை தீர்க்கும் மேசை" தாவல் மூலம் விரைவான குறையை பதிவு செய்யலாம். மாவட்ட நிலப் பதிவாளர் மற்றும் காடாஸ்ட்ரல் சர்வேயர்கள் 3D LiDAR/OSM வோல்யூமெட்ரிக் மெஷ்க்கு எதிராக உங்கள் பத்திரத்தை மதிப்பாய்வு செய்து 7 வேலை நாட்களுக்குள் புதுப்பிக்கப்பட்ட இடஞ்சார்ந்த தீர்மானத்தை வழங்குவார்கள்.' },
  'View Blockchain Ledger →': { 'हिंदी': 'ब्लॉकचेन खाता बही देखें →', 'தமிழ்': 'பிளாக்செயின் லெட்ஜரைக் காண்க →' },
}

export default function CitizenDashboard({ session, onOpenMap, activeLanguage = 'English' }) {
  const navigate = useNavigate()
  const [props, setProps] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [unitsVersion, setUnitsVersion] = useState(0)
  const [view, setView] = useState('welcome') // welcome | properties | grievances
  const [statusFilter, setStatusFilter] = useState('all') // all | verified | review
  const [copiedId, setCopiedId] = useState(null)
  const [toast, setToast] = useState(null)
  
  // Property Card Redesign State
  const [expandedUnitId, setExpandedUnitId] = useState(null)
  const [editingTitleId, setEditingTitleId] = useState(null)
  const [titleValues, setTitleValues] = useState({})

  const t = (key) => i18n[key]?.[activeLanguage] || key

  // Modals state
  const [selectedUnitForCert, setSelectedUnitForCert] = useState(null)
  const [selectedUnitForLedger, setSelectedUnitForLedger] = useState(null)
  const [selectedUnitForDispute, setSelectedUnitForDispute] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  // Grievance form state
  const [grievanceUnitId, setGrievanceUnitId] = useState('')
  const [grievanceType, setGrievanceType] = useState('Area mismatch')
  const [grievanceDesc, setGrievanceDesc] = useState('')
  const [grievanceSubmitted, setGrievanceSubmitted] = useState(null)

  // Any modal open → ESC closes it, background scroll locks, print isolates it
  const modalOpen = !!(selectedUnitForCert || selectedUnitForLedger || selectedUnitForDispute)
  const closeModals = () => {
    setSelectedUnitForCert(null)
    setSelectedUnitForLedger(null)
    setSelectedUnitForDispute(null)
    setGrievanceSubmitted(null)
  }
  useEffect(() => {
    if (!modalOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') closeModals() }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('modal-scroll-lock')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-scroll-lock')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen])

  useEffect(() => {
    let alive = true
    citizenProperties()
      .then((rows) => {
        if (!alive) return
        setProps(rows)
        setLoading(false)
      })
      .catch(() => { if (alive) setLoading(false) })
    const bump = () => setUnitsVersion((v) => v + 1)
    window.addEventListener('demo-units-changed', bump)
    return () => {
      alive = false
      window.removeEventListener('demo-units-changed', bump)
    }
  }, [])

  // Auto-generate 3D units for owned properties on first load
  useEffect(() => {
    if (!props.length) return
    let changed = false
    for (const f of props) {
      if (peekUnits(f.properties.building_id).length === 0) {
        generateUnits(f.properties.building_id, {
          floors: f.properties.stories || 1,
          basements: f.properties.basements || 0,
        })
        changed = true
      }
    }
    if (changed) setUnitsVersion((v) => v + 1)
  }, [props])

  const showToastMsg = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(id)
    showToastMsg(`Copied ULPIN to clipboard: ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const [complaintsVersion, setComplaintsVersion] = useState(0)
  const citizenName = session?.name || 'Citizen 1'

  // Summary of owned buildings + 3D spaces strictly for this citizen
  const rows = useMemo(() => {
    return props.map((f) => {
      const p = f.properties
      const ring = f.geometry?.type === 'Polygon' ? f.geometry.coordinates[0] : null
      let digi = null
      let areaSqm = 0
      if (ring?.length) {
        const lats = ring.map((c) => c[1])
        const lons = ring.map((c) => c[0])
        const latMin = Math.min(...lats)
        const lonMin = Math.min(...lons)
        const latMid = (latMin + Math.max(...lats)) / 2
        const mx = (lon) => (lon - lonMin) * M_PER_DEG * Math.cos((latMid * Math.PI) / 180)
        const my = (lat) => (lat - latMin) * M_PER_DEG
        let a2 = 0
        for (let i = 0; i < ring.length - 1; i++) {
          a2 += mx(ring[i][0]) * my(ring[i + 1][1]) - mx(ring[i + 1][0]) * my(ring[i][1])
        }
        areaSqm = Math.round(Math.abs(a2 / 2))
        const clat = lats.reduce((s, c) => s + c, 0) / ring.length
        const clon = lons.reduce((s, c) => s + c, 0) / ring.length
        digi = digipin(clat, clon)
      }
      const rawUnits = peekUnits(p.building_id)
      // Filter to units explicitly owned by this citizen
      let citizenUnits = rawUnits.filter((u) => {
        const owner = (u.owner_name || u.owner || '').toLowerCase()
        const cNameLower = citizenName.toLowerCase()
        return (
          owner === cNameLower ||
          owner === 'citizen 1' ||
          u.unit_no === 1 ||
          u.subunit_no === 1
        )
      })
      if (!citizenUnits.length && rawUnits.length) {
        citizenUnits = rawUnits.slice(0, 1)
      }
      // ── Fallback: if no generated 3D units, use the pre-seeded mock units ──
      if (!citizenUnits.length && p._mockUnits?.length) {
        citizenUnits = p._mockUnits.map((mu) => ({
          unit_ulpin: mu.ulpin,
          unitLabel: mu.unitLabel,
          floor: mu.floor,
          floor_index: mu.floor,
          area_sqm: mu.area,
          owner_name: mu.owner,
          owner: mu.owner,
          validation_status: mu.status === 'verified' ? 'verified' : 'review',
          rights_type: mu.rightsType,
        }))
      }
      const units = citizenUnits.map((u) => ({
        ...u,
        owner_name: citizenName,
        owner: citizenName,
      }))
      const conflicts = units.filter((u) => u.validation_status === 'conflict').length
      return { p, digi, areaSqm, units, conflicts }
    })
  }, [props, unitsVersion, citizenName])

  const portfolio = useMemo(() => {
    const units = []
    const awaiting = []
    for (const r of rows) {
      if (r.units.length) {
        for (const u of r.units) {
          units.push({
            u,
            building: r.p,
            status: u.validation_status === 'conflict' ? 'Conflict' : u.validation_status === 'verified' ? 'Verified Title' : 'Under Survey Check',
            tone: u.validation_status === 'verified' ? 'verified' : u.validation_status === 'conflict' ? 'conflict' : 'review',
          })
        }
      } else {
        awaiting.push(r)
      }
    }
    return { units, awaiting }
  }, [rows])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    let list = portfolio.units

    if (statusFilter === 'verified') {
      list = list.filter((x) => x.tone === 'verified')
    } else if (statusFilter === 'review') {
      list = list.filter((x) => x.tone !== 'verified')
    }

    if (needle) {
      list = list.filter(
        (x) =>
          (x.u.unitLabel || x.u.subunit_name || '').toLowerCase().includes(needle) ||
          (x.u.unit_ulpin || x.u.ulpin || '').toLowerCase().includes(needle) ||
          (x.u.owner_name || x.u.owner || '').toLowerCase().includes(needle) ||
          (x.building.name || '').toLowerCase().includes(needle),
      )
    }

    return {
      units: list,
      awaiting: needle
        ? portfolio.awaiting.filter(
            (r) =>
              (r.p.name || '').toLowerCase().includes(needle) ||
              r.p.building_id.toLowerCase().includes(needle),
          )
        : portfolio.awaiting,
    }
  }, [query, portfolio, statusFilter])

  const totals = useMemo(
    () => ({
      count: rows.length,
      area: portfolio.units.reduce((s, item) => s + (item.u.area_sqm || item.u.area || 82), 0) || rows.reduce((s, r) => s + (r.areaSqm || 0), 0),
      units: portfolio.units.length,
      conflicts: portfolio.units.filter((item) => item.u.validation_status === 'conflict').length,
      surveyed: portfolio.units.length,
    }),
    [rows, portfolio],
  )

  // Citizen's tracked complaints / grievances strictly for their owned units
  const citizenComplaints = useMemo(() => {
    const ownedUlpins = new Set(
      portfolio.units.map((item) => item.u.unit_ulpin || item.u.id || item.u.ulpin),
    )
    return complaints.filter(
      (c) => ownedUlpins.has(c.unitId) || c.unitId === 'unit-1' || c.unitId === 'unit-2' || c.unitId?.startsWith('ULP-')
    )
  }, [portfolio, complaintsVersion])

  const surveyedPct = totals.count ? Math.round((totals.surveyed / totals.count) * 100) : 100
  // Share of units holding a clear, verified title — drives the health stat card
  const titleHealthPct = totals.units
    ? Math.round(((totals.units - totals.conflicts) / totals.units) * 100)
    : 100
  const needsAttention = totals.conflicts > 0
  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('Good morning') : hour < 17 ? t('Good afternoon') : t('Good evening')

  // Activity log filtered for citizen's owned properties
  const activity = useMemo(() => {
    const firstLabel = portfolio.units[0]?.u?.subunit_name || portfolio.units[0]?.u?.unitLabel || 'Flat 201'
    const bldgName = portfolio.units[0]?.building?.name || 'Green Meadows'
    const relevant = activityLog.filter((a) => {
      const lower = a.text.toLowerCase()
      return (
        lower.includes('you reported') ||
        lower.includes('your favour') ||
        lower.includes(firstLabel.toLowerCase()) ||
        lower.includes('verified against registry')
      )
    })
    return relevant.length > 0
      ? relevant.slice(0, 6)
      : [
          { id: 'act-101', text: `Volumetric 3D title record for ${firstLabel} verified against state registry`, date: '2026-09-02', type: 'verified' },
          { id: 'act-102', text: `Annual 3D Cadastral tax assessment synced for ${bldgName}`, date: '2026-08-28', type: 'info' },
          { id: 'act-103', text: `Official UPC Certificate & Digital Deed ready for download`, date: '2026-08-15', type: 'verified' },
        ]
  }, [portfolio])

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  const actIcon = {
    verified: <CheckCircle2 size={15} className="act-ic ic-green" />,
    review: <Clock size={15} className="act-ic ic-amber" />,
    info: <FileText size={15} className="act-ic ic-info" />,
  }

  const handleFileDispute = (e) => {
    e.preventDefault()
    if (!grievanceDesc.trim()) return
    const targetUnit = grievanceUnitId || (portfolio.units[0]?.u.unit_ulpin || portfolio.units[0]?.u.id || 'unit-2')
    const ticketId = addComplaint({
      unitId: targetUnit,
      issueType: grievanceType,
      description: grievanceDesc,
    })
    setGrievanceSubmitted(ticketId)
    setComplaintsVersion((v) => v + 1)
    showToastMsg(`Grievance submitted successfully! Tracking token: ${ticketId}`)
    setGrievanceDesc('')
    setTimeout(() => {
      setSelectedUnitForDispute(null)
      setGrievanceSubmitted(null)
      setView('grievances')
    }, 1800)
  }

  const faqs = [
    {
      q: 'What is a 3D ULPIN and how does it protect my flat?',
      a: 'Standard land records only register ground land parcels (2D). A 3D ULPIN assigns a unique, immutable spatial volume code to your specific apartment floor and unit envelope. This guarantees your vertical ownership rights against duplication, encroachment, or boundary ambiguity.',
    },
    {
      q: 'Can I use this Digital Passport to obtain a bank mortgage or NOC?',
      a: 'Yes. The 3D Digital Passport contains verified encumbrance status, Record of Rights (RoR) data, and a digitally scannable QR code recognized by participating financial institutions and the National Generic Document Registration System (NGDRS).',
    },
    {
      q: 'What should I do if my registered area does not match my sale deed?',
      a: 'You can file a quick grievance directly via the "Grievance Desk" tab. The District Land Registrar and Cadastral Surveyors will review your deed against the 3D LiDAR/OSM volumetric mesh and issue an updated spatial determination within 7 working days.',
    },
  ]

  // Keyboard support for the clickable service cards (Enter / Space activate)
  const cardProps = (handler) => ({
    role: 'button',
    tabIndex: 0,
    onClick: handler,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handler()
      }
    },
  })

  return (
    <main className={`citizen-main-content${modalOpen ? ' has-modal' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="cb-toast" role="status" aria-live="polite">
          <Check size={14} className="cb-toast-check" /> {toast}
        </div>
      )}

      {/* Navigation Header */}
      <div className="citizen-head flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="view-tabs">
          <button
            className={`view-tab ${view === 'welcome' ? 'active' : ''}`}
            onClick={() => setView('welcome')}
            aria-pressed={view === 'welcome'}
          >
            <Activity size={14} /> {t('Overview & Services')}
          </button>
          <button
            className={`view-tab ${view === 'properties' ? 'active' : ''}`}
            onClick={() => setView('properties')}
            aria-pressed={view === 'properties'}
          >
            <Building2 size={14} /> {t('My Properties')} ({totals.units})
          </button>
          <button
            className={`view-tab ${view === 'grievances' ? 'active' : ''}`}
            onClick={() => setView('grievances')}
            aria-pressed={view === 'grievances'}
          >
            <AlertTriangle size={14} /> {t('Grievances & Disputes')}
          </button>
        </div>

        <div className="citizen-head-actions flex items-center gap-2.5">
          <button
            className="btn tiny inline-flex items-center gap-1.5"
            onClick={() => {
              const first = portfolio.units[0]?.u.unit_ulpin || 'unit-2'
              navigate(`/passport/${first}`)
            }}
            title="Open primary property passport"
          >
            <ShieldCheck size={13} className="text-accent" /> {t('Digital Passport')}
          </button>
          <button
            className="btn primary tiny inline-flex items-center gap-1.5"
            onClick={() => onOpenMap(null)}
          >
            <MapPin size={13} /> {t('3D City Map View')}
          </button>

        </div>
      </div>

      {/* Initial loading skeleton — shown until the portfolio resolves */}
      {loading && (
        <div aria-busy="true" aria-label="Loading your property portfolio…">
          <div className="cb-skeleton cb-skeleton-banner" />
          <div className="stat-cards">
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
            <div className="cb-skeleton cb-skeleton-stat" />
          </div>
        </div>
      )}

      {/* ── OVERVIEW & SERVICES VIEW ── */}
      {!loading && view === 'welcome' && (
        <>
          {/* Welcome Banner */}
          <div className="citizen-banner">
            <div className="cb-circle c1" />
            <div className="cb-circle c2" />
            {needsAttention && (
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                <AlertTriangle size={13} /> {totals.conflicts} {t('unit(s) need attention')}
              </div>
            )}
            <div className="cb-content">
              <div className="cb-eyebrow flex items-center gap-2">
                <span>{greeting} · {t('National Urban 3D Cadastre')}</span>
                <span className="inline-flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded text-[10px] font-bold text-white">
                  <ShieldCheck size={11} className="text-[#34D399]" /> {t('Aadhaar Linked')}
                </span>
              </div>
              <div className="cb-title">{t('Welcome')}, {session?.name?.split(' ')[0] || 'Citizen'}</div>
              <div className="cb-sub">
                {t('Your portfolio holds')} <b>{totals.count} registered property parcel{totals.count !== 1 ? 's' : ''}</b> in Chennai with{' '}
                <b>{totals.units} volumetric unit{totals.units !== 1 ? 's' : ''}</b> mapped in 3D.{' '}
                {needsAttention
                  ? `${totals.conflicts} unit${totals.conflicts !== 1 ? 's' : ''} ${t('flagged for review — open Grievances & Disputes to track resolution.')}`
                  : t('All titles are clear and verified against the state revenue register.')}
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <button
                  className="btn primary cb-cta inline-flex items-center gap-2"
                  onClick={() => setView('properties')}
                >
                  {t('View My Properties')} <ArrowRight size={15} />
                </button>
                <button
                  className="btn cb-cta inline-flex items-center gap-2"
                  onClick={() => {
                    const target = portfolio.units[0]?.u.unit_ulpin || 'unit-2'
                    navigate(`/passport/${target}`)
                  }}
                >
                  <Printer size={14} /> {t('Download UPC Certificate & Deed')}
                </button>
              </div>
            </div>
            <svg className="cb-art" width="130" height="110" viewBox="0 0 130 110">
              <rect x="70" y="20" width="40" height="80" rx="2" fill="rgba(255,255,255,0.12)" />
              <rect x="76" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="28" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="44" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="44" width="10" height="10" fill="#E0B85C" opacity="0.9" />
              <rect x="76" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="60" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="76" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="92" y="76" width="10" height="10" fill="rgba(255,255,255,0.35)" />
              <rect x="30" y="55" width="34" height="45" rx="2" fill="rgba(255,255,255,0.08)" />
              <rect x="36" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="62" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="36" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="50" y="76" width="9" height="9" fill="rgba(255,255,255,0.3)" />
              <rect x="10" y="100" width="112" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
            </svg>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards">
            <div className="stat-card stat-card-forest">
              <div className="stat-card-head">
                <span className="stat-icon"><Building2 size={18} /></span>
                <span className="muted tiny">{t('Properties Owned')}</span>
              </div>
              <b>{totals.units}</b>
              <span className="stat-meta">Registered to your linked identity</span>
            </div>
            <div className="stat-card stat-card-olive">
              <div className="stat-card-head">
                <span className="stat-icon"><Layers size={18} /></span>
                <span className="muted tiny">{t('3D Units Mapped')}</span>
              </div>
              <b>{totals.units}</b>
              <span className="stat-meta">Surveyed volumetric records</span>
            </div>
            <div className="stat-card stat-card-amber">
              <div className="stat-card-head">
                <span className="stat-icon"><MapPin size={18} /></span>
                <span className="muted tiny">{t('Total Footprint Area')}</span>
              </div>
              <b>{totals.area.toLocaleString('en-IN')} m²</b>
              <span className="stat-meta">~{(totals.area * 10.764).toFixed(0)} sq.ft across all units</span>
            </div>
            <div className={`stat-card ${needsAttention ? 'stat-card-warn' : 'stat-card-green'}`} title="Share of your volumetric units with a clear, verified title">
              <div className="stat-card-head">
                <span className="stat-icon"><ShieldCheck size={18} /></span>
                <span className="muted tiny">{t('Title Verification Health')}</span>
              </div>
              <b className={needsAttention ? 'stat-warn' : 'stat-ok'}>{titleHealthPct}%</b>
              <span className="stat-meta">{needsAttention ? `${totals.conflicts} unit${totals.conflicts !== 1 ? 's' : ''} flagged for review` : 'All titles clear and verified'}</span>
            </div>
          </div>

          {/* Quick Citizen Services Grid */}
          <div>
            <h3 className="text-xs uppercase font-bold text-[#1C2530] tracking-wider mb-2">
              {t('Citizen Self-Service Actions')}
            </h3>
            <div className="citizen-quick-services">
              <div
                className="quick-service-card"
                {...cardProps(() => navigate(`/passport/${portfolio.units[0]?.u.unit_ulpin || 'unit-2'}`))}
              >
                <div>
                  <div className="qs-icon-box bg-[#E8F4EF] text-[#176B55]">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="qs-title">{t('Digital Property Passport')}</div>
                  <div className="qs-desc">
                    {t('Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.')}
                  </div>
                </div>
                <div className="qs-action">{t('Open Passport →')}</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() => navigate(`/passport/${portfolio.units[0]?.u.unit_ulpin || 'unit-2'}`))}
              >
                <div>
                  <div className="qs-icon-box bg-emerald-50 text-[#1B7A4A]">
                    <Printer size={20} />
                  </div>
                  <div className="qs-title">{t('Certified UPC & Title Deed')}</div>
                  <div className="qs-desc">
                    {t('Print or save an authenticated Government of India UPC Certificate & Title Deed with audit trail.')}
                  </div>
                </div>
                <div className="qs-action">{t('Download Certificate →')}</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() => setView('grievances'))}
              >
                <div>
                  <div className="qs-icon-box bg-amber-50 text-[#8A6410]">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="qs-title">{t('Grievances & Dispute Desk')}</div>
                  <div className="qs-desc">
                    {t('Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.')}
                  </div>
                </div>
                <div className="qs-action">{t('Track & File Issue →')}</div>
              </div>

              <div
                className="quick-service-card"
                {...cardProps(() =>
                  setSelectedUnitForLedger(portfolio.units[0]?.u || { unit_ulpin: 'unit-2', unitLabel: 'Flat 201' }),
                )}
              >
                <div>
                  <div className="qs-icon-box bg-[#F8ECE7] text-[#A9533F]">
                    <Hash size={20} />
                  </div>
                  <div className="qs-title">{t('Cryptographic Audit Chain')}</div>
                  <div className="qs-desc">
                    {t('Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.')}
                  </div>
                </div>
                <div className="qs-action">{t('Inspect Hash Chain →')}</div>
              </div>
            </div>
          </div>

          {/* ── Real-Time Unit Change Notifications ── */}
          <div className="panel-section welcome-card mb-0">
            <h3 className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Activity size={15} className="text-[#176B55]" />
                {t('Unit Change Notifications')}
              </span>
              <span className="text-xs font-normal text-ink-mid bg-[#176B55]/10 text-[#176B55] px-2 py-0.5 rounded-full">{t('Live')}</span>
            </h3>
            <div className="mt-3 space-y-2">
              {[
                { icon: <CheckCircle2 size={15} className="text-[#1B7A4A] shrink-0 mt-0.5" />, title: t('Flat 302 title verified'), sub: t('Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026'), tone: 'ok' },
                { icon: <Clock size={15} className="text-[#8A6410] shrink-0 mt-0.5" />, title: t('Flat 201 area mismatch under review'), sub: t('Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026'), tone: 'warn' },
                { icon: <ShieldCheck size={15} className="text-[#176B55] shrink-0 mt-0.5" />, title: t('SHA-256 audit entry created'), sub: t('New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026'), tone: 'info' },
              ].map((n, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border text-sm ${n.tone === 'ok' ? 'bg-[#E9F7F0] border-[#C4E8D6]' : n.tone === 'warn' ? 'bg-[#FDF4E3] border-[#F0DCAE]' : 'bg-[#E8F4EF] border-[#C6DFD4]'}`}>
                  {n.icon}
                  <div>
                    <div className="font-semibold text-[#1C2530]">{n.title}</div>
                    <div className="text-xs text-ink-mid mt-0.5">{n.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Survey Progress & Activity Grid */}
          <div className="welcome-grid">
            <div className="panel-section welcome-card">
              <h3>{t('3D Cadastre Survey Status')}</h3>
              <div className="ring-row">
                <svg width="110" height="110" viewBox="0 0 110 110" className="ring-svg">
                  <circle cx="55" cy="55" r="42" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
                  <circle
                    cx="55"
                    cy="55"
                    r="42"
                    fill="none"
                    stroke="#176B55"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - surveyedPct / 100)}
                    transform="rotate(-90 55 55)"
                    style={{ transition: 'stroke-dashoffset 0.9s ease' }}
                  />
                  <text x="55" y="61" textAnchor="middle" fill="#1C2530" style={{ fontSize: 20, fontWeight: 800 }}>
                    {surveyedPct}%
                  </text>
                </svg>
                <div className="muted tiny ring-note">
                  <b>{surveyedPct}% {t('mapped in 3D:')}</b> {t('Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.')}
                </div>
              </div>
            </div>

            <div className="panel-section welcome-card">
              <h3>{t('Recent Cadastre Notices & Activity')}</h3>
              {activity.map((a, i) => (
                <div key={a.id} className={`act-row ${i === activity.length - 1 ? 'last' : ''}`}>
                  {actIcon[a.type] || actIcon.info}
                  <div className="act-body">
                    <div className="act-text">{a.text}</div>
                    <div className="muted tiny">{a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen FAQs Section */}
          <div className="panel-section welcome-card">
            <h3 className="flex items-center gap-2">
              <HelpCircle size={15} className="text-[#176B55]" /> {t('Frequently Asked Questions for Property Owners')}
            </h3>
            <div className="faq-list mt-3">
              {faqs.map((faq, i) => (
                <div key={i} className="faq-item">
                  <button
                    className="faq-btn"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{t(faq.q)}</span>
                    {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === i && <div className="faq-ans">{t(faq.a)}</div>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── MY PROPERTIES VIEW ── */}
      {!loading && view === 'properties' && (
        <>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="records-search flex-1 min-w-[280px]">
              <Search size={15} className="rs-icon" />
              <input
                className="search"
                placeholder={t("Search by apartment number, building name, or ULPIN key…")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="filter-pills">
              <button
                className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                {t('All Properties')} ({portfolio.units.length})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setStatusFilter('verified')}
              >
                {t('✓ Clear Title')} ({portfolio.units.filter((x) => x.tone === 'verified').length})
              </button>
              <button
                className={`filter-pill ${statusFilter === 'review' ? 'active' : ''}`}
                onClick={() => setStatusFilter('review')}
              >
                {t('In Review')} ({portfolio.units.filter((x) => x.tone !== 'verified').length})
              </button>
            </div>

            {(query.trim() || statusFilter !== 'all') && (
              <span className="muted tiny whitespace-nowrap">
                Showing {filtered.units.length} of {portfolio.units.length} units
              </span>
            )}
          </div>

          {filtered.units.length === 0 && (
            portfolio.units.length === 0 ? (
              <div className="cb-empty">
                <Building2 size={26} className="cb-empty-icon" />
                <p className="text-sm font-bold text-ink">{t('No registered properties yet')}</p>
                <p className="muted tiny mt-1 max-w-[420px]">
                  {t('When a property is registered against your Aadhaar-linked account, its 3D volumetric title record will appear here automatically.')}
                </p>
                <button
                  className="btn tiny mt-3 inline-flex items-center gap-1.5"
                  onClick={() => onOpenMap(null)}
                >
                  <MapPin size={13} /> {t('Explore the 3D City Map')}
                </button>
              </div>
            ) : (
              <div className="cb-empty">
                <Search size={26} className="cb-empty-icon" />
                <p className="text-sm font-bold text-ink">{t('No properties matched your search')}</p>
                <p className="muted tiny mt-1">
                  {t('Try a different apartment number, building name or ULPIN key.')}
                </p>
                <button
                  className="btn tiny mt-3"
                  onClick={() => { setQuery(''); setStatusFilter('all'); }}
                >
                  {t('Reset Search & Filters')}
                </button>
              </div>
            )
          )}

          {filtered.units.length > 0 && (
            <div className="prop-grid property-summary-grid">
              {filtered.units.map(({ u, building, tone }) => {
                const unitId = u.unit_ulpin || u.id || 'unit-2'
                const displayUlpin = u.unit_ulpin || u.ulpin || `TN-07-${building.building_id}`
                const label = u.unitLabel || u.subunit_name || 'Residential Unit'
                const area = u.area_sqm || u.area || 82
                const statusLabel = tone === 'verified' ? 'Verified Title' : tone === 'conflict' ? 'Boundary Conflict' : 'Under Review'

                return (
                  <button
                    type="button"
                    key={unitId}
                    className={`property-summary-card tone-${tone}`}
                    onClick={() => navigate(`/portal/property/${encodeURIComponent(unitId)}`)}
                    aria-label={`Open details for ${label} in ${building.name || 'registered building'}`}
                  >
                    <div className="property-card-map">
                      <MapInset
                        highlightUnit
                        geometry={building.geometry}
                        ulpin={building.baseUlpin || displayUlpin}
                        address={building.address || 'Chennai'}
                        label={label}
                      />
                    </div>

                    <div className="property-card-content">
                      <div className="property-card-topline">
                        <span className={`property-status tone-${tone}`}>
                          {tone === 'verified' ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                          {statusLabel}
                        </span>
                        <ArrowRight size={17} className="property-card-arrow" />
                      </div>

                      <div>
                        <h3>{label}</h3>
                        <p className="property-card-address"><MapPin size={13} /> {building.name || 'Registered Building'}</p>
                      </div>

                      <div className="property-card-metrics">
                        <div><span>Floor</span><strong>{u.floor ?? 2}</strong></div>
                        <div><span>Carpet area</span><strong>{area} m²</strong></div>
                        <div><span>Title</span><strong>{tone === 'verified' ? 'Clear' : 'Review'}</strong></div>
                      </div>

                      <div className="property-card-ulpin">
                        <Hash size={12} /> <span>{displayUlpin}</span>
                      </div>
                      <span className="property-card-open">View property details <ArrowRight size={14} /></span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── GRIEVANCES & DISPUTES VIEW ── */}
      {!loading && view === 'grievances' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E4E7EC] rounded-[14px] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{t('Grievances & Disputes')}</h2>
                <p className="text-xs text-ink-mid mt-0.5">
                  Report discrepancies in registered area, floor index, or volumetric boundaries to the District Registrar.
                </p>
              </div>
              <button
                className="btn primary tiny inline-flex items-center gap-1.5"
                onClick={() => {
                  setGrievanceUnitId('')
                  setSelectedUnitForDispute(portfolio.units[0]?.u || { unit_ulpin: 'unit-2' })
                }}
              >
                <PlusCircle size={14} /> {t('File New Grievance')}
              </button>
            </div>

            {/* Complaints List */}
            <div className="space-y-3 mt-4">
              <h3 className="text-xs uppercase font-bold text-ink-mid tracking-wider">
                {t('Tracked Tickets')} ({citizenComplaints.length})
              </h3>
              {citizenComplaints.length === 0 ? (
                <div className="cb-empty cb-empty-sm">
                  <CheckCircle2 size={26} className="cb-empty-icon" />
                  <p className="text-sm font-bold text-ink">{t('No grievances on record')}</p>
                  <p className="muted tiny mt-1">
                    {t('No complaints or disputes have been filed for your properties. Flag an issue and track its resolution from here.')}
                  </p>
                  <button
                    className="btn tiny mt-3 inline-flex items-center gap-1.5"
                    onClick={() => {
                      setGrievanceUnitId('')
                      setSelectedUnitForDispute(portfolio.units[0]?.u || { unit_ulpin: 'unit-2' })
                    }}
                  >
                    <PlusCircle size={13} /> {t('File a Grievance')}
                  </button>
                </div>
              ) : (
                citizenComplaints.map((c) => {
                  const target = getUnit(c.unitId)
                  return (
                    <div
                      key={c.id}
                      className="p-4 rounded-[10px] border border-[#E4E7EC] bg-[#FAFAFB] flex items-start justify-between gap-4 flex-wrap"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{c.id}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#E8F4EF] text-[#176B55]">
                            {c.issueType}
                          </span>
                        </div>
                        <div className="text-xs text-ink-mid mt-1">
                          {t('Property:')} <span className="font-semibold text-ink">{target?.unitLabel || c.unitId}</span> · {t("Filed on")} {c.date}
                        </div>
                        <div className="text-xs text-[#1C2530] mt-2 font-medium bg-white p-2.5 rounded border border-[#E4E7EC]">
                          &ldquo;{c.description}&rdquo;
                        </div>
                      </div>

                      <div className="ticket-status flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`chip ${
                            c.status === 'resolved' ? 'status-valid' : 'under-review'
                          }`}
                        >
                          {c.status === 'resolved' ? t('✓ Resolved by Registrar') : t('⋯ Under Active Review')}
                        </span>
                        <span className="text-[11px] text-ink-mid">
                          {t('Resolution SLA: Within 7 days')}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: OFFICIAL CERTIFICATE OF OWNERSHIP ── */}
      {selectedUnitForCert && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Official Certificate of Ownership and 3D Title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <CubeMark size={22} tint="#176B55" />
                <h3 className="font-bold text-sm text-ink">{t('Official Certificate of Ownership & 3D Title')}</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForCert(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="cert-frame text-[#1C2530]">
                <div className="text-center pb-4 border-b border-[#E4E7EC]">
                  <div className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#176B55]">
                    Government of India · Department of Land Resources
                  </div>
                  <h2 className="text-xl font-black tracking-tight mt-1 text-[#0D1126]">
                    {t('CERTIFICATE OF VERTICAL PROPERTY TITLE')}
                  </h2>
                  <div className="text-xs text-ink-mid mt-0.5">
                    {t('Issued under the National Urban 3D Cadastre Framework (SIH26095)')}
                  </div>
                </div>

                <div className="my-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">{t('Unique Land Parcel Identification (3D ULPIN):')}</span>
                    <span className="font-id font-bold text-[#0D1126]">
                      {selectedUnitForCert.unit_ulpin || selectedUnitForCert.ulpin || 'TN-07-4821-9034-F2-U201'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">{t('Registered Title Holder:')}</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.owner_name || selectedUnitForCert.owner || session.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">{t('Volumetric Space Designation:')}</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.unitLabel || 'Flat 201'} · Level {selectedUnitForCert.floor ?? 2}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">{t('Registered Carpet Area:')}</span>
                    <span className="font-bold text-[#0D1126]">
                      {selectedUnitForCert.area_sqm || selectedUnitForCert.area || 82} m² (~
                      {Math.round((selectedUnitForCert.area_sqm || selectedUnitForCert.area || 82) * 10.764)} sq.ft)
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-dashed border-[#E4E7EC] pb-1.5">
                    <span className="text-ink-mid">{t('Encumbrance (NOC) Status:')}</span>
                    <span className="font-bold text-[#1B7A4A]">NIL ENCUMBRANCE · CLEAR TITLE</span>
                  </div>
                  <div className="flex justify-between pb-1.5">
                    <span className="text-ink-mid">{t('Issuance Date:')}</span>
                    <span className="font-medium text-[#0D1126]">
                      {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-between">
                  <div className="cert-stamp">{t('VERIFIED · DO NOT ALTER')}</div>
                  <div className="text-right text-[11px] text-ink-mid">
                    <div className="font-bold text-[#0D1126]">{t('Registrar of Land Records')}</div>
                    <div>{t('Cadastral Zone Chennai Central')}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => setSelectedUnitForCert(null)}
              >
                {t('Close')}
              </button>
              <button
                className="btn primary inline-flex items-center gap-1.5"
                onClick={() => window.print()}
              >
                <Printer size={14} /> {t('Print / Save as PDF')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: BLOCKCHAIN AUDIT TRAIL ── */}
      {selectedUnitForLedger && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Cryptographic title audit trail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Hash size={18} className="text-[#176B55]" />
                <h3 className="font-bold text-sm text-ink">{t('Cryptographic Title Audit Trail')}</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForLedger(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-emerald-50 text-[#1B7A4A] rounded-lg font-sans font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> {t('Blockchain State: Verified & Unbroken')}
                </span>
                <span className="text-xs font-mono">{t('3 Blocks')}</span>
              </div>

              {/* Block 3 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-[#34D399] border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>{t('BLOCK #3 · 3D ULPIN MINTING')}</span>
                  <span className="text-[10px] text-ink-mid">2026-09-02 14:10 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#1C2530] mb-2">
                  {t('Vertical volumetric boundaries minted and registered to')} 
                  {selectedUnitForLedger.owner_name || selectedUnitForLedger.owner || session.name}
                </div>
                <div className="text-[11px] text-ink-mid">
                  {t('Block Hash:')} <span className="text-[#1B7A4A]">0x4c1a...8e44</span> · {t('Prev:')}{' '}
                  <span className="text-[#176B55]">0x9f8e...3b12</span>
                </div>
              </div>

              {/* Block 2 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-[#176B55] border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>{t('BLOCK #2 · TOPOLOGY VALIDATION')}</span>
                  <span className="text-[10px] text-ink-mid">2026-08-20 09:30 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#1C2530] mb-2">
                  {t('LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected')}
                </div>
                <div className="text-[11px] text-ink-mid">
                  Block Hash: <span className="text-[#176B55]">0x9f8e...3b12</span> · Prev:{' '}
                  <span className="text-ink-mid">0x1a2b...9981</span>
                </div>
              </div>

              {/* Block 1 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border-l-4 border-gray-400 border border-[#E4E7EC]">
                <div className="flex justify-between font-bold text-[#1C2530] mb-1">
                  <span>{t('BLOCK #1 · SALE DEED CONVEYANCE')}</span>
                  <span className="text-[10px] text-ink-mid">2024-11-14 11:20 UTC</span>
                </div>
                <div className="font-sans text-xs text-[#1C2530] mb-2">
                  {t('Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12')}
                </div>
                <div className="text-[11px] text-ink-mid">
                  Block Hash: <span className="text-[#1C2530]">0x1a2b...9981</span> · Prev: 0x0000...0000
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn primary"
                onClick={() => setSelectedUnitForLedger(null)}
              >
                {t('Close Audit View')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FILE GRIEVANCE / DISPUTE ── */}
      {selectedUnitForDispute && (
        <div className="citizen-modal-backdrop" onClick={closeModals}>
          <div
            className="citizen-modal"
            role="dialog"
            aria-modal="true"
            aria-label="File a property discrepancy or grievance"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#8A6410]" />
                <h3 className="font-bold text-sm text-ink">{t('File a Property Discrepancy / Grievance')}</h3>
              </div>
              <button
                onClick={() => setSelectedUnitForDispute(null)}
                className="p-1 rounded hover:bg-black/5 text-ink-mid"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFileDispute}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">{t('Select Property')}</label>
                  <select
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceUnitId || selectedUnitForDispute.unit_ulpin || 'unit-2'}
                    onChange={(e) => setGrievanceUnitId(e.target.value)}
                  >
                    {portfolio.units.map(({ u, building }) => (
                      <option key={u.unit_ulpin || u.id} value={u.unit_ulpin || u.id}>
                        {u.unitLabel || 'Unit'} — {building.name} (Floor {u.floor ?? 2})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">{t('Issue Category')}</label>
                  <select
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceType}
                    onChange={(e) => setGrievanceType(e.target.value)}
                  >
                    <option>{t('Area mismatch (Deed area differs from 3D model)')}</option>
                    <option>{t('Boundary mismatch (Balcony/wall encroachment)')}</option>
                    <option>{t('Wrong floor level recorded')}</option>
                    <option>{t('Owner name or Aadhaar linkage spelling error')}</option>
                    <option>{t('Unauthorized vertical construction on adjacent unit')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">{t('Discrepancy Details')}</label>
                  <textarea
                    rows={4}
                    required
                    placeholder={t("Describe the discrepancy with respect to your sale deed or physical inspection…")}
                    className="w-full p-2.5 border border-[#E4E7EC] rounded-lg text-sm bg-white"
                    value={grievanceDesc}
                    onChange={(e) => setGrievanceDesc(e.target.value)}
                  />
                </div>

                {grievanceSubmitted && (
                  <div className="p-3 bg-emerald-50 text-[#1B7A4A] rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} /> {t('Ticket created! Redirecting to tracker…').replace('{grievanceSubmitted}', grievanceSubmitted)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 mb-2">
                <button
                  type="button"
                  className="btn secondary flex-1 flex items-center justify-center gap-2"
                  onClick={() => {
                    closeModals()
                    if (onOpenMap) {
                      // Pan to the building and zoom in
                      onOpenMap(selectedUnitForDispute.building_id || selectedUnitForDispute.buildingId)
                    }
                  }}
                >
                  <MapPin size={16} /> {t('Select Disputed Area on 3D Model')}
                </button>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSelectedUnitForDispute(null)}
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!grievanceDesc.trim() || grievanceSubmitted}
                  className="btn primary"
                >
                  {t('Submit Official Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
