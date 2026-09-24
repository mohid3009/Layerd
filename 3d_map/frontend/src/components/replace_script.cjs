const fs = require('fs');

const i18n_additions = {
  'Aadhaar Linked': {'हिंदी': 'आधार लिंक्ड', 'தமிழ்': 'ஆதார் இணைக்கப்பட்டது'},
  'National Urban 3D Cadastre': {'हिंदी': 'राष्ट्रीय शहरी 3D कैडस्ट्रे', 'தமிழ்': 'தேசிய நகர்ப்புற 3D காடாஸ்ட்ரே'},
  'Your portfolio holds': {'हिंदी': 'आपके पोर्टफोलियो में है', 'தமிழ்': 'உங்கள் போர்ட்ஃபோலியோவில் உள்ளது'},
  'registered property parcel(s) in Chennai with': {'हिंदी': 'चेन्नई में पंजीकृत संपत्ति पार्सल के साथ', 'தமிழ்': 'சென்னையில் பதிவு செய்யப்பட்ட சொத்து பார்சல்களுடன்'},
  'volumetric unit(s) mapped in 3D.': {'हिंदी': '3D में मैप की गई वोल्यूमेट्रिक इकाई(इकाइयां)।', 'தமிழ்': '3D இல் வரைபடமாக்கப்பட்ட வோல்யூமெட்ரிக் அலகு(கள்).'},
  'unit(s) need attention': {'हिंदी': 'इकाई(इकाइयों) पर ध्यान देने की आवश्यकता है', 'தமிழ்': 'அலகு(களுக்கு) கவனம் தேவை'},
  'flagged for review — open Grievances & Disputes to track resolution.': {'हिंदी': 'समीक्षा के लिए फ़्लैग किया गया — समाधान ट्रैक करने के लिए शिकायतें और विवाद खोलें।', 'தமிழ்': 'மதிப்பாய்வுக்காக கொடியிடப்பட்டது — தீர்மானத்தைக் கண்காணிக்க குறைகள் மற்றும் தகராறுகளைத் திறக்கவும்.'},
  'All titles are clear and verified against the state revenue register.': {'हिंदी': 'सभी स्वामित्व स्पष्ट हैं और राज्य राजस्व रजिस्टर के विरुद्ध सत्यापित हैं।', 'தமிழ்': 'அனைத்து தலைப்புகளும் தெளிவாக உள்ளன மற்றும் மாநில வருவாய் பதிவேட்டில் சரிபார்க்கப்படுகின்றன.'},
  'Good morning': {'हिंदी': 'शुभ प्रभात', 'தமிழ்': 'காலை வணக்கம்'},
  'Good afternoon': {'हिंदी': 'शुभ दोपहर', 'தமிழ்': 'மதிய வணக்கம்'},
  'Good evening': {'हिंदी': 'शुभ संध्या', 'தமிழ்': 'மாலை வணக்கம்'},
  'Digital Property Passport': {'हिंदी': 'डिजिटल संपत्ति पासपोर्ट', 'தமிழ்': 'டிஜிட்டல் சொத்து பாஸ்போர்ட்'},
  'Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.': {'हिंदी': 'अपने आधिकारिक 3D वोल्यूमेट्रिक डीड, स्कैन करने योग्य QR सत्यापन कोड और वास्तुशिल्प फर्श की सीमाओं तक पहुंचें।', 'தமிழ்': 'உங்கள் அதிகாரப்பூர்வ 3D வோல்யூமெட்ரிக் பத்திரம், ஸ்கேன் செய்யக்கூடிய QR சரிபார்ப்பு குறியீடு மற்றும் கட்டடக்கலை தரை எல்லைகளை அணுகவும்.'},
  'Certified UPC & Title Deed': {'हिंदी': 'प्रमाणित UPC और टाइटल डीड', 'தமிழ்': 'சான்றளிக்கப்பட்ட UPC & தலைப்பு பத்திரம்'},
  'Print or save an authenticated Government of India UPC Certificate & Title Deed with audit trail.': {'हिंदी': 'ऑडिट ट्रेल के साथ प्रमाणित भारत सरकार का UPC प्रमाणपत्र और टाइटल डीड प्रिंट करें या सहेजें।', 'தமிழ்': 'தணிக்கை பாதையுடன் அங்கீகரிக்கப்பட்ட இந்திய அரசின் UPC சான்றிதழ் மற்றும் தலைப்பு பத்திரத்தை அச்சிடவும் அல்லது சேமிக்கவும்.'},
  'Grievances & Dispute Desk': {'हिंदी': 'शिकायत और विवाद डेस्क', 'தமிழ்': 'குறைகள் மற்றும் தகராறு மேசை'},
  'Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.': {'हिंदी': 'सीमा बेमेल, क्षेत्र विसंगतियों की रिपोर्ट करें, या जिला रजिस्ट्रार के साथ समाधान स्थिति को ट्रैक करें।', 'தமிழ்': 'எல்லை முரண்பாடுகள், பகுதி முரண்பாடுகள் அல்லது மாவட்ட பதிவாளரிடம் தீர்மான நிலையை கண்காணிக்கவும்.'},
  'Cryptographic Audit Chain': {'हिंदी': 'क्रिप्टोग्राफिक ऑडिट चेन', 'தமிழ்': 'கிரிப்டோகிராஃபிக் தணிக்கை சங்கிலி'},
  'Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.': {'हिंदी': 'अपने सेल डीड और LiDAR सर्वेक्षण जाल को मान्य करने वाले छेड़छाड़-सबूत ब्लॉकचेन लेजर का निरीक्षण करें।', 'தமிழ்': 'உங்கள் விற்பனை பத்திரம் மற்றும் LiDAR கணக்கெடுப்பு வலையை சரிபார்க்கும் டேம்பர்-ப்ரூஃப் பிளாக்செயின் லெட்ஜரை ஆய்வு செய்யவும்.'},
  'Search by apartment number, building name, or ULPIN key…': {'हिंदी': 'अपार्टमेंट नंबर, भवन का नाम या ULPIN कुंजी द्वारा खोजें…', 'தமிழ்': 'அபார்ட்மெண்ட் எண், கட்டிடத்தின் பெயர் அல்லது ULPIN விசை மூலம் தேடுங்கள்...'},
  'Close': {'हिंदी': 'बंद करें', 'தமிழ்': 'மூடு'},
  'Print / Save as PDF': {'हिंदी': 'पीडीएफ के रूप में प्रिंट / सेव करें', 'தமிழ்': 'PDF ஆக அச்சிடுக / சேமிக்கவும்'},
  'Official Certificate of Ownership & 3D Title': {'हिंदी': 'स्वामित्व और 3D शीर्षक का आधिकारिक प्रमाणपत्र', 'தமிழ்': 'உரிமையாளர் மற்றும் 3D தலைப்பின் அதிகாரப்பூர்வ சான்றிதழ்'},
  'CERTIFICATE OF VERTICAL PROPERTY TITLE': {'हिंदी': 'वर्टिकल संपत्ति शीर्षक का प्रमाणपत्र', 'தமிழ்': 'செங்குத்து சொத்து தலைப்பின் சான்றிதழ்'},
  'Issued under the National Urban 3D Cadastre Framework (SIH26095)': {'हिंदी': 'राष्ट्रीय शहरी 3D कैडस्ट्रे फ्रेमवर्क (SIH26095) के तहत जारी', 'தமிழ்': 'தேசிய நகர்ப்புற 3D காடாஸ்ட்ரே கட்டமைப்பு (SIH26095) இன் கீழ் வழங்கப்பட்டது'},
  'Unique Land Parcel Identification (3D ULPIN):': {'हिंदी': 'अद्वितीय भूमि पार्सल पहचान (3D ULPIN):', 'தமிழ்': 'தனித்துவமான நிலக் பார்சல் அடையாளம் (3D ULPIN):'},
  'Registered Title Holder:': {'हिंदी': 'पंजीकृत शीर्षक धारक:', 'தமிழ்': 'பதிவு செய்யப்பட்ட தலைப்புதாரர்:'},
  'Volumetric Space Designation:': {'हिंदी': 'वोल्यूमेट्रिक अंतरिक्ष पदनाम:', 'தமிழ்': 'வோல்யூமெட்ரிக் விண்வெளி பதவி:'},
  'Registered Carpet Area:': {'हिंदी': 'पंजीकृत कारपेट क्षेत्र:', 'தமிழ்': 'பதிவு செய்யப்பட்ட கம்பளப் பகுதி:'},
  'Encumbrance (NOC) Status:': {'हिंदी': 'भार (NOC) स्थिति:', 'தமிழ்': 'என்கம்பரன்ஸ் (NOC) நிலை:'},
  'Issuance Date:': {'हिंदी': 'जारी करने की तिथि:', 'தமிழ்': 'வழங்கப்பட்ட தேதி:'},
  'VERIFIED · DO NOT ALTER': {'हिंदी': 'सत्यापित · न बदलें', 'தமிழ்': 'சரிபார்க்கப்பட்டது · மாற்ற வேண்டாம்'},
  'Registrar of Land Records': {'हिंदी': 'भूमि रिकॉर्ड रजिस्ट्रार', 'தமிழ்': 'நிலப் பதிவேடுகளின் பதிவாளர்'},
  'Cadastral Zone Chennai Central': {'हिंदी': 'कैडस्ट्राल ज़ोन चेन्नई सेंट्रल', 'தமிழ்': 'காடாஸ்ட்ரால் மண்டலம் சென்னை சென்ட்ரல்'},
  'Cryptographic Title Audit Trail': {'हिंदी': 'क्रिप्टोग्राफिक शीर्षक ऑडिट ट्रेल', 'தமிழ்': 'கிரிப்டோகிராஃபிக் தலைப்பு தணிக்கை பாதை'},
  'Blockchain State: Verified & Unbroken': {'हिंदी': 'ब्लॉकचेन स्थिति: सत्यापित और अखंड', 'தமிழ்': 'பிளாக்செயின் நிலை: சரிபார்க்கப்பட்டது & உடைக்கப்படாதது'},
  '3 Blocks': {'हिंदी': '3 ब्लॉक', 'தமிழ்': '3 தொகுதிகள்'},
  'BLOCK #3 · 3D ULPIN MINTING': {'हिंदी': 'ब्लॉक #3 · 3D ULPIN मिंटिंग', 'தமிழ்': 'தொகுதி #3 · 3D ULPIN மிண்டிங்'},
  'Vertical volumetric boundaries minted and registered to': {'हिंदी': 'लंबवत वोल्यूमेट्रिक सीमाएँ ढाली गईं और पंजीकृत की गईं', 'தமிழ்': 'செங்குத்து வோல்யூமெட்ரிக் எல்லைகள் அச்சிடப்பட்டு பதிவு செய்யப்பட்டன'},
  'Block Hash:': {'हिंदी': 'ब्लॉक हैश:', 'தமிழ்': 'தொகுதி ஹாஷ்:'},
  'Prev:': {'हिंदी': 'पिछला:', 'தமிழ்': 'முந்தைய:'},
  'BLOCK #2 · TOPOLOGY VALIDATION': {'हिंदी': 'ब्लॉक #2 · टोपोलॉजी सत्यापन', 'தமிழ்': 'தொகுதி #2 · டோபாலஜி சரிபார்ப்பு'},
  'LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected': {'हिंदी': 'ओवरलैप के लिए LiDAR/OpenStreetMap बहुभुज की जाँच की गई · 0 परस्पर विरोधी वोल्यूम पाए गए', 'தமிழ்': 'LiDAR/OpenStreetMap பலகோணம் மேலெழுதல்களுக்கு சரிபார்க்கப்பட்டது · 0 முரண்பட்ட தொகுதிகள் கண்டறியப்பட்டன'},
  'BLOCK #1 · SALE DEED CONVEYANCE': {'हिंदी': 'ब्लॉक #1 · सेल डीड हस्तांतरण', 'தமிழ்': 'தொகுதி #1 · விற்பனை பத்திரம் பரிமாற்றம்'},
  'Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12': {'हिंदी': 'जेनेसिस कन्वेयंस SRO टी. नगर में पंजीकृत · पुस्तक 1, खंड 12', 'தமிழ்': 'ஆதியாகமம் பரிமாற்றம் SRO டி. நகரில் பதிவு செய்யப்பட்டது · புத்தகம் 1, தொகுதி 12'},
  'Close Audit View': {'हिंदी': 'ऑडिट दृश्य बंद करें', 'தமிழ்': 'தணிக்கை காட்சியை மூடு'},
  'File a Property Discrepancy / Grievance': {'हिंदी': 'संपत्ति विसंगति / शिकायत दर्ज करें', 'தமிழ்': 'சொத்து முரண்பாடு / குறையை பதிவு செய்யவும்'},
  'Select Property': {'हिंदी': 'संपत्ति चुनें', 'தமிழ்': 'சொத்தைத் தேர்ந்தெடுக்கவும்'},
  'Issue Category': {'हिंदी': 'समस्या श्रेणी', 'தமிழ்': 'சிக்கல் வகை'},
  'Discrepancy Details': {'हिंदी': 'विसंगति विवरण', 'தமிழ்': 'முரண்பாடு விவரங்கள்'},
  'Ticket created! Redirecting to tracker…': {'हिंदी': 'टिकट बन गया! ट्रैकर पर रीडायरेक्ट कर रहा है…', 'தமிழ்': 'டிக்கெட் உருவாக்கப்பட்டது! டிராக்கருக்குத் திருப்பி விடப்படுகிறது...'},
  'Describe the discrepancy with respect to your sale deed or physical inspection…': {'हिंदी': 'अपने सेल डीड या भौतिक निरीक्षण के संबंध में विसंगति का वर्णन करें…', 'தமிழ்': 'உங்கள் விற்பனை பத்திரம் அல்லது உடல் பரிசோதனை தொடர்பாக முரண்பாட்டை விவரிக்கவும்...'},
  'Area mismatch (Deed area differs from 3D model)': {'हिंदी': 'क्षेत्र बेमेल (डीड क्षेत्र 3D मॉडल से भिन्न है)', 'தமிழ்': 'பகுதி முரண்பாடு (பத்திரப் பகுதி 3D மாதிரியிலிருந்து வேறுபடுகிறது)'},
  'Boundary mismatch (Balcony/wall encroachment)': {'हिंदी': 'सीमा बेमेल (बालकनी/दीवार अतिक्रमण)', 'தமிழ்': 'எல்லை முரண்பாடு (பால்கனி/சுவர் ஆக்கிரமிப்பு)'},
  'Wrong floor level recorded': {'हिंदी': 'गलत फ्लोर लेवल दर्ज', 'தமிழ்': 'தவறான தரை நிலை பதிவு செய்யப்பட்டுள்ளது'},
  'Owner name or Aadhaar linkage spelling error': {'हिंदी': 'मालिक का नाम या आधार लिंकेज वर्तनी त्रुटि', 'தமிழ்': 'உரிமையாளர் பெயர் அல்லது ஆதார் இணைப்பு எழுத்துப்பிழை'},
  'Unauthorized vertical construction on adjacent unit': {'हिंदी': 'आसन्न इकाई पर अनधिकृत ऊर्ध्वाधर निर्माण', 'தமிழ்': 'அருகிலுள்ள அலகு மீது அங்கீகரிக்கப்படாத செங்குத்து கட்டுமானம்'},
  'Property:': {'हिंदी': 'संपत्ति:', 'தமிழ்': 'சொத்து:'},
  'Filed on': {'हिंदी': 'पर दर्ज', 'தமிழ்': 'தாக்கல் செய்யப்பட்டது'},
  'Resolution SLA: Within 7 days': {'हिंदी': 'समाधान SLA: 7 दिनों के भीतर', 'தமிழ்': 'தீர்வு SLA: 7 நாட்களுக்குள்'},
  '✓ Resolved by Registrar': {'हिंदी': '✓ रजिस्ट्रार द्वारा हल किया गया', 'தமிழ்': '✓ பதிவாளரால் தீர்க்கப்பட்டது'},
  '⋯ Under Active Review': {'हिंदी': '⋯ सक्रिय समीक्षा के तहत', 'தமிழ்': '⋯ செயலில் உள்ள மதிப்பாய்வில் உள்ளது'},
  'Flat 302 title verified': {'हिंदी': 'फ्लैट 302 शीर्षक सत्यापित', 'தமிழ்': 'பிளாட் 302 தலைப்பு சரிபார்க்கப்பட்டது'},
  'Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026': {'हिंदी': 'रजिस्ट्रार अरुण कृष्णन ने 3D सीमा अद्यतन को मंजूरी दी · 2 सितंबर 2026', 'தமிழ்': 'பதிவாளர் அருண் கிருஷ்ணன் 3D எல்லை புதுப்பிப்பை அங்கீகரித்தார் · 2 செப் 2026'},
  'Flat 201 area mismatch under review': {'हिंदी': 'फ्लैट 201 क्षेत्र बेमेल समीक्षा के अधीन', 'தமிழ்': 'பிளாட் 201 பகுதி முரண்பாடு மதிப்பாய்வில் உள்ளது'},
  'Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026': {'हिंदी': 'सर्वेयर प्रिया वेंकटेशन को सौंपा गया · प्रतिक्रिया 29 सितंबर 2026 को देय', 'தமிழ்': 'சர்வேயர் பிரியா வெங்கடேசன் நியமிக்கப்பட்டுள்ளார் · பதில் 29 செப் 2026 அன்று நிலுவையில் உள்ளது'},
  'SHA-256 audit entry created': {'हिंदी': 'SHA-256 ऑडिट प्रविष्टि बनाई गई', 'தமிழ்': 'SHA-256 தணிக்கை உள்ளீடு உருவாக்கப்பட்டது'},
  'New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026': {'हिंदी': 'फ्लैट 203, लेकव्यू रेजिडेंसी के लिए नया हैश-चेन रिकॉर्ड जोड़ा गया · 27 अगस्त 2026', 'தமிழ்': 'பிளாட் 203, லேக்வியூ ரெசிடென்சிக்கான புதிய ஹாஷ்-சங்கிலி பதிவு சேர்க்கப்பட்டது · 27 ஆகஸ்ட் 2026'},
  'Live': {'हिंदी': 'लाइव', 'தமிழ்': 'நேரலை'},
  'mapped in 3D:': {'हिंदी': '3D में मैप किया गया:', 'தமிழ்': '3D இல் வரைபடமாக்கப்பட்டது:'},
  'Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.': {'हिंदी': 'आपकी संपत्तियों ने ग्रेटर चेन्नई कैडस्ट्रे के साथ पंजीकृत LiDAR और OpenStreetMap वोल्यूमेट्रिक स्टोरीज़ को सत्यापित किया है।', 'தமிழ்': 'உங்கள் சொத்துக்கள் கிரேட்டர் சென்னை காடாஸ்ட்ரேயில் பதிவு செய்யப்பட்ட LiDAR மற்றும் OpenStreetMap வோல்யூமெட்ரிக் தளங்களை சரிபார்த்துள்ளன.'},
  'What is a 3D ULPIN and how does it protect my flat?': {'हिंदी': '3D ULPIN क्या है और यह मेरे फ्लैट की रक्षा कैसे करता है?', 'தமிழ்': '3D ULPIN என்றால் என்ன, அது எனது பிளாட்டை எவ்வாறு பாதுகாக்கிறது?'},
  'Standard land records only register ground land parcels (2D). A 3D ULPIN assigns a unique, immutable spatial volume code to your specific apartment floor and unit envelope. This guarantees your vertical ownership rights against duplication, encroachment, or boundary ambiguity.': {'हिंदी': 'मानक भूमि रिकॉर्ड केवल जमीनी भूमि पार्सल (2D) को पंजीकृत करते हैं। एक 3D ULPIN आपके विशिष्ट अपार्टमेंट फ्लोर और यूनिट लिफाफे को एक अद्वितीय, अपरिवर्तनीय स्थानिक वॉल्यूम कोड प्रदान करता है। यह दोहराव, अतिक्रमण या सीमा अस्पष्टता के खिलाफ आपके ऊर्ध्वाधर स्वामित्व अधिकारों की गारंटी देता है।', 'தமிழ்': 'நிலையான நிலப் பதிவேடுகள் தரை நிலப் பார்சல்களை (2D) மட்டுமே பதிவு செய்கின்றன. ஒரு 3D ULPIN உங்கள் குறிப்பிட்ட அபார்ட்மெண்ட் தளம் மற்றும் யூனிட் உறைக்கு ஒரு தனித்துவமான, மாறாத இடஞ்சார்ந்த தொகுதி குறியீட்டை ஒதுக்குகிறது. இது நகல், ஆக்கிரமிப்பு அல்லது எல்லை முரண்பாட்டிற்கு எதிராக உங்கள் செங்குத்து உரிமை உரிமைகளுக்கு உத்தரவாதம் அளிக்கிறது.'},
  'Can I use this Digital Passport to obtain a bank mortgage or NOC?': {'हिंदी': 'क्या मैं बैंक बंधक या NOC प्राप्त करने के लिए इस डिजिटल पासपोर्ट का उपयोग कर सकता हूं?', 'தமிழ்': 'வங்கி அடமானம் அல்லது NOC பெற இந்த டிஜிட்டல் பாஸ்போர்ட்டைப் பயன்படுத்தலாமா?'},
  'Yes. The 3D Digital Passport contains verified encumbrance status, Record of Rights (RoR) data, and a digitally scannable QR code recognized by participating financial institutions and the National Generic Document Registration System (NGDRS).': {'हिंदी': 'हाँ। 3D डिजिटल पासपोर्ट में सत्यापित भार स्थिति, रिकॉर्ड ऑफ राइट्स (RoR) डेटा और भाग लेने वाले वित्तीय संस्थानों और राष्ट्रीय जेनेरिक दस्तावेज़ पंजीकरण प्रणाली (NGDRS) द्वारा मान्यता प्राप्त एक डिजिटल स्कैन करने योग्य QR कोड शामिल है।', 'தமிழ்': 'ஆம். 3D டிஜிட்டல் பாஸ்போர்ட்டில் சரிபார்க்கப்பட்ட என்கம்பரன்ஸ் நிலை, உரிமைகளின் பதிவு (RoR) தரவு மற்றும் பங்கேற்கும் நிதி நிறுவனங்கள் மற்றும் தேசிய பொதுவான ஆவணப் பதிவு முறை (NGDRS) மூலம் அங்கீகரிக்கப்பட்ட டிஜிட்டல் ஸ்கேன் செய்யக்கூடிய QR குறியீடு ஆகியவை உள்ளன.'},
  'What should I do if my registered area does not match my sale deed?': {'हिंदी': 'यदि मेरा पंजीकृत क्षेत्र मेरे सेल डीड से मेल नहीं खाता है तो मुझे क्या करना चाहिए?', 'தமிழ்': 'எனது பதிவு செய்யப்பட்ட பகுதி எனது விற்பனை பத்திரத்துடன் பொருந்தவில்லை என்றால் நான் என்ன செய்ய வேண்டும்?'},
  'You can file a quick grievance directly via the "Grievance Desk" tab. The District Land Registrar and Cadastral Surveyors will review your deed against the 3D LiDAR/OSM volumetric mesh and issue an updated spatial determination within 7 working days.': {'हिंदी': 'आप सीधे "शिकायत डेस्क" टैब के माध्यम से एक त्वरित शिकायत दर्ज कर सकते हैं। जिला भूमि रजिस्ट्रार और कैडस्ट्राल सर्वेयर 3D LiDAR/OSM वोल्यूमेट्रिक मेश के खिलाफ आपके डीड की समीक्षा करेंगे और 7 कार्य दिवसों के भीतर एक अद्यतन स्थानिक निर्धारण जारी करेंगे।', 'தமிழ்': 'நீங்கள் நேரடியாக "குறை தீர்க்கும் மேசை" தாவல் மூலம் விரைவான குறையை பதிவு செய்யலாம். மாவட்ட நிலப் பதிவாளர் மற்றும் காடாஸ்ட்ரல் சர்வேயர்கள் 3D LiDAR/OSM வோல்யூமெட்ரிக் மெஷ்க்கு எதிராக உங்கள் பத்திரத்தை மதிப்பாய்வு செய்து 7 வேலை நாட்களுக்குள் புதுப்பிக்கப்பட்ட இடஞ்சார்ந்த தீர்மானத்தை வழங்குவார்கள்.'}
};

let content = fs.readFileSync('CitizenDashboard.jsx', 'utf8');

// Insert the new i18n additions
const insertionPoint = content.indexOf('};');
if (insertionPoint !== -1) {
    const existingStr = content.substring(0, insertionPoint);
    let newEntries = '';
    for (const [key, val] of Object.entries(i18n_additions)) {
        newEntries += `  '${key}': ${JSON.stringify(val)},\n`;
    }
    content = existingStr + newEntries + content.substring(insertionPoint);
}

// Write the script to replace the strings in the jsx
const replacements = [
  ['Aadhaar Linked', "{t('Aadhaar Linked')}"],
  ['National Urban 3D Cadastre', "{t('National Urban 3D Cadastre')}"],
  ['Your portfolio holds', "{t('Your portfolio holds')}"],
  [`registered property parcel{totals.count !== 1 ? 's' : ''} in Chennai with`, "{t('registered property parcel(s) in Chennai with')}"],
  [`volumetric unit{totals.units !== 1 ? 's' : ''} mapped in 3D.`, "{t('volumetric unit(s) mapped in 3D.')}"],
  [`unit{totals.conflicts !== 1 ? 's' : ''} need attention`, "{t('unit(s) need attention')}"],
  ['flagged for review — open Grievances & Disputes to track resolution.', "{t('flagged for review — open Grievances & Disputes to track resolution.')}"],
  ['All titles are clear and verified against the state revenue register.', "{t('All titles are clear and verified against the state revenue register.')}"],
  ['Good morning', "{t('Good morning')}"],
  ['Good afternoon', "{t('Good afternoon')}"],
  ['Good evening', "{t('Good evening')}"],
  ['<div className="qs-title">Digital Property Passport</div>', '<div className="qs-title">{t(\'Digital Property Passport\')}</div>'],
  ['Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.', "{t('Access your official 3D volumetric deed, scannable QR verification code, and architectural floor bounds.')}"],
  ['<div className="qs-title">Certified UPC &amp; Title Deed</div>', '<div className="qs-title">{t(\'Certified UPC & Title Deed\')}</div>'],
  ['Print or save an authenticated Government of India UPC Certificate &amp; Title Deed with audit trail.', "{t('Print or save an authenticated Government of India UPC Certificate & Title Deed with audit trail.')}"],
  ['<div className="qs-title">Grievances &amp; Dispute Desk</div>', '<div className="qs-title">{t(\'Grievances & Dispute Desk\')}</div>'],
  ['Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.', "{t('Report boundary mismatches, area discrepancies, or track resolution status with the District Registrar.')}"],
  ['<div className="qs-title">Cryptographic Audit Chain</div>', '<div className="qs-title">{t(\'Cryptographic Audit Chain\')}</div>'],
  ['Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.', "{t('Inspect the tamper-proof blockchain ledger validating your sale deed and LiDAR survey mesh.')}"],
  ['placeholder="Search by apartment number, building name, or ULPIN key…"', 'placeholder={t("Search by apartment number, building name, or ULPIN key…")}'],
  ['Close\\n', "{t('Close')}\\n"],
  ['<Printer size={14} /> Print / Save as PDF', "<Printer size={14} /> {t('Print / Save as PDF')}"],
  ['Official Certificate of Ownership &amp; 3D Title', "{t('Official Certificate of Ownership & 3D Title')}"],
  ['CERTIFICATE OF VERTICAL PROPERTY TITLE', "{t('CERTIFICATE OF VERTICAL PROPERTY TITLE')}"],
  ['Issued under the National Urban 3D Cadastre Framework (SIH26095)', "{t('Issued under the National Urban 3D Cadastre Framework (SIH26095)')}"],
  ['Unique Land Parcel Identification (3D ULPIN):', "{t('Unique Land Parcel Identification (3D ULPIN):')}"],
  ['Registered Title Holder:', "{t('Registered Title Holder:')}"],
  ['Volumetric Space Designation:', "{t('Volumetric Space Designation:')}"],
  ['Registered Carpet Area:', "{t('Registered Carpet Area:')}"],
  ['Encumbrance (NOC) Status:', "{t('Encumbrance (NOC) Status:')}"],
  ['Issuance Date:', "{t('Issuance Date:')}"],
  ['VERIFIED · DO NOT ALTER', "{t('VERIFIED · DO NOT ALTER')}"],
  ['Registrar of Land Records', "{t('Registrar of Land Records')}"],
  ['Cadastral Zone Chennai Central', "{t('Cadastral Zone Chennai Central')}"],
  ['<h3 className="font-bold text-sm text-ink">Cryptographic Title Audit Trail</h3>', '<h3 className="font-bold text-sm text-ink">{t(\'Cryptographic Title Audit Trail\')}</h3>'],
  ['Blockchain State: Verified &amp; Unbroken', "{t('Blockchain State: Verified & Unbroken')}"],
  ['3 Blocks', '<span className="text-xs font-mono">{t(\'3 Blocks\')}</span>'],
  ['BLOCK #3 · 3D ULPIN MINTING', "{t('BLOCK #3 · 3D ULPIN MINTING')}"],
  [`Vertical volumetric boundaries minted and registered to{' '}`, "{t('Vertical volumetric boundaries minted and registered to')} "],
  ['Block Hash:', "{t('Block Hash:')}"],
  ['Prev:', "{t('Prev:')}"],
  ['BLOCK #2 · TOPOLOGY VALIDATION', "{t('BLOCK #2 · TOPOLOGY VALIDATION')}"],
  ['LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected', "{t('LiDAR/OpenStreetMap polygon checked for overlaps · 0 conflicting volumes detected')}"],
  ['BLOCK #1 · SALE DEED CONVEYANCE', "{t('BLOCK #1 · SALE DEED CONVEYANCE')}"],
  ['Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12', "{t('Genesis conveyance registered at SRO T. Nagar · Book 1, Volume 12')}"],
  ['Close Audit View', "{t('Close Audit View')}"],
  ['File a Property Discrepancy / Grievance', "{t('File a Property Discrepancy / Grievance')}"],
  ['Select Property', "{t('Select Property')}"],
  ['Issue Category', "{t('Issue Category')}"],
  ['Discrepancy Details', "{t('Discrepancy Details')}"],
  ['Ticket {grievanceSubmitted} created! Redirecting to tracker…', "Ticket {grievanceSubmitted} {t('created! Redirecting to tracker…')}"],
  ['placeholder="Describe the discrepancy with respect to your sale deed or physical inspection…"', 'placeholder={t("Describe the discrepancy with respect to your sale deed or physical inspection…")}'],
  ['Area mismatch (Deed area differs from 3D model)', "{t('Area mismatch (Deed area differs from 3D model)')}"],
  ['Boundary mismatch (Balcony/wall encroachment)', "{t('Boundary mismatch (Balcony/wall encroachment)')}"],
  ['Wrong floor level recorded', "{t('Wrong floor level recorded')}"],
  ['Owner name or Aadhaar linkage spelling error', "{t('Owner name or Aadhaar linkage spelling error')}"],
  ['Unauthorized vertical construction on adjacent unit', "{t('Unauthorized vertical construction on adjacent unit')}"],
  ['Property: ', "{t('Property:')} "],
  ['· Filed on ', '· {t("Filed on")} '],
  ['Resolution SLA: Within 7 days', "{t('Resolution SLA: Within 7 days')}"],
  ['✓ Resolved by Registrar', "{t('✓ Resolved by Registrar')}"],
  ['⋯ Under Active Review', "{t('⋯ Under Active Review')}"],
  ['Live', "{t('Live')}"],
  ['mapped in 3D:', "{t('mapped in 3D:')}"],
  ['Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.', "{t('Your properties have verified LiDAR and OpenStreetMap volumetric storeys registered with the Greater Chennai cadastre.')}"],
];

for (const [find, replace] of replacements) {
    if (content.includes(find)) {
        content = content.replace(find, replace);
    } else {
        console.warn('Could not find:', find);
    }
}

// Special dynamic replacements
content = content.replace(
  "Ticket {grievanceSubmitted} {t('created! Redirecting to tracker…')}",
  "{t('Ticket created! Redirecting to tracker…').replace('{grievanceSubmitted}', grievanceSubmitted)}"
);

content = content.replace(
  "greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'",
  "greeting = hour < 12 ? t('Good morning') : hour < 17 ? t('Good afternoon') : t('Good evening')"
);

content = content.replace(
  "greeting} · National Urban 3D Cadastre",
  "greeting} · {t('National Urban 3D Cadastre')}"
);

// fix faqs array mapping in JSX directly
content = content.replace(
  "<span>{faq.q}</span>",
  "<span>{t(faq.q)}</span>"
);
content = content.replace(
  "<div className=\"faq-ans\">{faq.a}</div>",
  "<div className=\"faq-ans\">{t(faq.a)}</div>"
);

// update activity log texts
content = content.replace(
  "\\`Volumetric 3D title record for ${firstLabel} verified against state registry\\`",
  "\\`\\${t('Volumetric 3D title record for ${firstLabel} verified against state registry').replace('${firstLabel}', firstLabel)}\\`"
);
content = content.replace(
  "\\`Annual 3D Cadastral tax assessment synced for ${bldgName}\\`",
  "\\`\\${t('Annual 3D Cadastral tax assessment synced for ${bldgName}').replace('${bldgName}', bldgName)}\\`"
);

// fix notifications
content = content.replace(
  "title: 'Flat 302 title verified', sub: 'Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026'",
  "title: t('Flat 302 title verified'), sub: t('Registrar Arun Krishnan approved the 3D boundary update · 2 Sep 2026')"
);
content = content.replace(
  "title: 'Flat 201 area mismatch under review', sub: 'Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026'",
  "title: t('Flat 201 area mismatch under review'), sub: t('Surveyor Priya Venkatesan assigned · Response due 29 Sep 2026')"
);
content = content.replace(
  "title: 'SHA-256 audit entry created', sub: 'New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026'",
  "title: t('SHA-256 audit entry created'), sub: t('New hash-chained record appended for Flat 203, Lakeview Residency · 27 Aug 2026')"
);


fs.writeFileSync('CitizenDashboard.jsx', content);
console.log('Done');
