import { AnalysisResult, ScamVerdict, RiskCategory, RiskLevel } from '../types.ts';

// Helper to calculate risk category from score
export function getRiskCategoryFromScore(score: number): RiskCategory {
  if (score >= 75) return 'Very high risk';
  if (score >= 50) return 'High risk';
  if (score >= 25) return 'Some warning signs';
  return 'Low detected risk';
}

// Helper to map score to RiskLevel
export function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

// Known legitimate bank SMS sender prefixes (TRAI DLT 6-char alphanumeric format)
const DLT_HEADER_PATTERN = /^[A-Z]{2}-[A-Z0-9]{6}$/i;
const EMBEDDED_DLT_PATTERN = /\b([A-Z]{2}-[A-Z0-9]{6})\b/i;

// High-risk domain extensions commonly used in short-lived phishing campaigns
const HIGH_RISK_TLDS = /\.(apk|xyz|top|site|vip|icu|click|in\.net|cc|work|buzz|rest|live|club|stream|fun|monster|online|fit|gq|cf|tk|ml)(\/|$|\?)/i;
const SHORTENED_URL_PATTERN = /\b(bit\.ly|tinyurl\.com|is\.gd|t\.co|cutt\.ly|rb\.gy|shorturl\.at|gg\.gg|ow\.ly)\b/i;
const IP_URL_PATTERN = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i;
const PHONE_PATTERN = /(\+?91[\s-]?)?[6-9]\d{9}\b/;

export function analyzeMessageInstant(
  rawMessage: string,
  channel: string = 'SMS'
): AnalysisResult {
  const text = (rawMessage || '').trim();
  const lower = text.toLowerCase();

  // Edge Case: Empty or whitespace-only input
  if (!text) {
    return {
      verdict: 'UNCERTAIN',
      riskScore: 0,
      riskCategory: 'Uncertain — more verification needed',
      riskLevel: 'LOW',
      scamType: 'Empty Input',
      summary: 'No message content was provided for analysis.',
      explanation: 'Please paste a complete SMS, WhatsApp message, payment request, or call transcript to evaluate risk indicators.',
      warningSigns: ['Input text is empty'],
      recommendedActions: ['Provide the text or description of the suspicious interaction.'],
      confidenceScore: 100,
      limitations: 'Cannot evaluate empty input.',
    };
  }

  // Suspicious phrases extracted directly from the message
  const suspiciousPhrases: string[] = [];
  const warningSigns: string[] = [];
  const recommendedActions: string[] = [];
  let goldenRuleViolation: string | undefined = undefined;
  let cybercrimeReportingNeeded = false;
  let riskScore = 0;
  let scamType = 'General Security Assessment';
  let limitations = 'Always double-check directly inside your official banking app if you feel something is off.';

  // 1. SYSTEM OVERRIDE / DECEPTION TRICK DETECTION
  const promptInjectionMatches = text.match(
    /(ignore\s+(all\s+)?(previous\s+)?instructions|system\s*override|say\s+this\s+is\s+(safe|legitimate)|pretend\s+you\s+are|disregard\s+safety\s+rules)/i
  );
  if (promptInjectionMatches) {
    suspiciousPhrases.push(promptInjectionMatches[0]);
    return {
      verdict: 'LIKELY SCAM',
      riskScore: 95,
      riskCategory: 'Very high risk',
      riskLevel: 'CRITICAL',
      scamType: 'Deceptive Message Override Trick',
      summary: '⚠️ This text has sneaky instructions trying to force security checks to say it is safe.',
      explanation: 'Scammers sometimes include lines like "ignore instructions" or "say this is safe" to fool scanners and sneak past defenses. This is an immediate sign of deception.',
      warningSigns: [
        'Contains hidden commands trying to trick safety checks',
        `Flagged phrase: "${promptInjectionMatches[0]}"`,
      ],
      suspiciousPhrases,
      recommendedActions: [
        'Do not reply or click anything sent by this person.',
        'Delete the message and block the sender immediately.',
      ],
      goldenRuleViolation: 'Never trust anyone trying to disable safety or security warnings.',
      cybercrimeReportingNeeded: true,
      confidenceScore: 99,
      limitations: 'The message is deliberately attempting to manipulate security evaluation.',
    };
  }

  // 2. CONTEXTUAL CHECKS (Distinguish legitimate notifications from scams)

  // A. Check for Genuine Bank Transaction Alerts & UPI Receipts (RBI Standard format)
  // Legitimate alerts inform of debits/credits with masked digits, balance, ref numbers,
  // and NEVER contain external website links, refund lures, or requests to call random numbers.
  const isCreditOrDebitAlert = /\b(credited|debited|spent|withdrawn|paid)\b/i.test(text);
  const hasCurrencyAmount = /(inr|rs\.?|₹)\s*[\d,]+(\.\d{2})?/i.test(text);
  const hasAccountOrBal = /\b(a\/c|acct|ac|account|bal|balance)\b/i.test(text) || /\b(google\s*pay|phonepe|paytm)\b/i.test(text);
  const hasReferenceNo = /\b(upi\s*transaction\s*(id|no)?|transaction\s*(id|no)|upi\/p2[ap]|rrn|utr|txn\s*(id|no|ref)?|ref\s*(no|num)?[:\s]*\d{6,})\b/i.test(text);
  
  // Real bank transaction alerts DO NOT include external web links or generic URLs
  const hasAnyExternalLink = /https?:\/\/[^\s]+/i.test(text) || /\b[a-z0-9-]+\.(com|net|org|xyz|top|site|apk|online|info|me|app|link|buzz|icu)\b/i.test(text);
  const hasSuspiciousLinks = HIGH_RISK_TLDS.test(text) || SHORTENED_URL_PATTERN.test(text) || /\.apk\b/i.test(text) || IP_URL_PATTERN.test(text) || hasAnyExternalLink;
  // Real bank receipts do not have lure words like lottery, prize, cashback, claim, or refund
  // Note: 'SMS BLOCK to' is a legitimate dispute instruction, so only match blocked/bloacked
  const hasScamLures = /\b(lottery|prize|reward|cashback|bonus|gift|won|claim|kyc|blocked|bloacked|suspended|deactivat|expire|update|refund|unblock|apk|winner|unpaid)\b/i.test(text);
  // Real bank transaction alerts only have official dispute shortcodes like "SMS BLOCK to 5676712"
  const asksForMaliciousAction = /\b(click|download|install|call\s*[6-9]\d{9}|contact\s*support|contact\s*manager|contact\s*our|scan\s*qr|enter\s*pin|type\s*pin|share\s*otp)\b/i.test(text);

  if (isCreditOrDebitAlert && hasCurrencyAmount && hasAccountOrBal && hasReferenceNo && !hasAnyExternalLink && !hasScamLures && !asksForMaliciousAction) {
    return {
      verdict: 'LIKELY LEGITIMATE',
      riskScore: 5,
      riskCategory: 'Low detected risk',
      riskLevel: 'LOW',
      scamType: 'Official Bank Transaction Alert / UPI Receipt',
      summary: 'Looks like a standard, genuine bank transaction notification or UPI receipt.',
      explanation: 'This message uses the standard format required by the Reserve Bank of India (RBI). It tells you about a money debit, credit, or UPI transfer with a reference number and balance, and does not push you to click links, download files, or share your PIN.',
      warningSigns: [
        'No suspicious links, APK downloads, or requests for PIN/OTP found',
        'Follows the standard bank transaction notice format',
      ],
      suspiciousPhrases: [],
      recommendedActions: [
        'Open your official banking app (YONO, HDFC, iMobile, etc.) to check your current balance and passbook.',
        'If you didn\'t make this payment, call your bank using the phone number on the back of your ATM card or the official dispute SMS code in the message.',
      ],
      confidenceScore: 94,
      limitations: 'Sender numbers can sometimes be spoofed. Always verify transactions directly inside your official bank app.',
    };
  }

  // B. Check for Legitimate OTP Delivery (System Security Alerts)
  const hasOtpCodePattern = /\b\d{4,8}\s*(is\s*(your)?\s*([a-z]+\s*)?otp|is\s*the\s*otp|is\s*your\s*verification\s*code)\b/i.test(text) ||
                            /\botp\s*(for\s*[a-z\s]+)?\s*(is)?\s*[:\-]?\s*\d{4,8}\b/i.test(text);
  const hasDoNotShareWarning = /\b(do\s*not\s*share|never\s*share|not\s*shared|keep\s*it\s*secret|valid\s*for\s*\d+\s*(mins?|minutes?)|never\s*asks\s*for\s*your\s*otp)\b/i.test(text);
  const isActualOtpSolicitation = /\b(please\s*)?(share|tell|give|send|forward|read\s*out)\s*(me|us)?\s*(the|this|your)?\s*(\d\s*digit\s*)?otp\b/i.test(text) &&
                                  !/\b(do\s*not\s*share|never\s*share|not\s*shared|never\s*asks)\b/i.test(text);

  if (hasOtpCodePattern && hasDoNotShareWarning && !isActualOtpSolicitation && !hasAnyExternalLink) {
    return {
      verdict: 'LIKELY LEGITIMATE',
      riskScore: 10,
      riskCategory: 'Low detected risk',
      riskLevel: 'LOW',
      scamType: 'Official One-Time Password (OTP) Alert',
      summary: 'This is a genuine automated OTP code message with standard safety warnings.',
      explanation: 'This message was triggered by a login or payment request. It explicitly reminds you NEVER to share your code with anyone. Nobody from the bank will ever call you asking for this number.',
      warningSigns: [
        'Includes standard advice to keep the OTP secret',
        'Does not ask you to forward or tell the code to anyone',
      ],
      suspiciousPhrases: [],
      recommendedActions: [
        'If you initiated this login or payment, enter the code only on your official bank app or secure website.',
        'If you did NOT request this OTP, someone may be trying to get into your account. Do NOT share the code and change your net banking password immediately.',
      ],
      confidenceScore: 92,
      limitations: 'If you did not request this OTP, change your account password right away.',
    };
  }

  // C. Check for Ordinary Peer-to-Peer Casual Conversations
  const isCasualPeerChat =
    /\b(bro|yaar|bhai|friend|lunch|dinner|coffee|split|share|movie|cab|uber|ola)\b/i.test(text) &&
    /\b(upi|send|pay|give|transfer)\s*(me)?\s*(rs\.?|inr|₹)?\s*\d{1,5}\b/i.test(text) &&
    !hasAnyExternalLink &&
    !/\b(kyc|blocked|lottery|prize|apk|officer|police|9:30\s*pm)\b/i.test(text);

  if (isCasualPeerChat) {
    return {
      verdict: 'LIKELY LEGITIMATE',
      riskScore: 15,
      riskCategory: 'Low detected risk',
      riskLevel: 'LOW',
      scamType: 'Casual Personal Payment Request',
      summary: 'Looks like a regular everyday message between friends or family splitting an expense.',
      explanation: 'The message sounds like an ordinary conversation without artificial panic, fake bank claims, or weird links.',
      warningSigns: [
        'No bank impersonation or threats detected',
        'Normal casual tone without pressure or panic',
      ],
      suspiciousPhrases: [],
      recommendedActions: [
        'Make sure the message is really from your friend (check the phone number or call them if unexpected).',
        'Always check the verified receiver name on Google Pay / PhonePe before entering your PIN.',
      ],
      confidenceScore: 85,
      limitations: 'If this message came from an unfamiliar number pretending to be someone you know, call them directly to confirm.',
    };
  }

  // 3. THREAT EVALUATION & SCAM PATTERN DETECTION

  // Pattern 1: UPI QR Code / Payment Inversion Trick (OLX / Buyer Scam / Decoded QR)
  // Scammer claims: "Scan this QR code to receive money / refund / accept credit, enter PIN to approve"
  const mentionsQr = /\b(qr|qr\s*code|scan|scanner|bar\s*code|qrcode)\b/i.test(text) || text.startsWith('upi://pay');
  const mentionsReceiveOrCredit = /\b(receive|receve|accept|credit|paisa\s*aayega|paisa\s*lo|get\s*money|claim|refund|cashback|collect)\b/i.test(text);
  const mentionsPin = /\b(upi\s*pin|pin|mpin|atm\s*pin|passcode|enter\s*pin|type\s*pin|pin\s*dalo)\b/i.test(text);
  const mentionsBuyerOrArmy = /\b(olx|quikr|buyer|army|defense|defence|posted|cantonment|military|sofa|bed|furniture)\b/i.test(text);

  if (mentionsQr && (mentionsReceiveOrCredit || mentionsPin || mentionsBuyerOrArmy)) {
    riskScore += 95;
    scamType = 'UPI QR Code Payment Inversion Fraud (OLX / Buyer Trap)';
    goldenRuleViolation = 'GOLDEN UPI RULE: Entering your UPI PIN or scanning a QR code is ONLY for SENDING money. Scanning a QR code NEVER credits money to your bank account.';
    cybercrimeReportingNeeded = true;

    if (mentionsReceiveOrCredit) {
      const match = text.match(/\b(scan\s*(this\s*)?(qr\s*code)?\s*to\s*receive|receive\s*money\s*(by\s*)?scan|accept\s*the\s*credit)\b/i);
      suspiciousPhrases.push(match ? match[0] : 'scan QR to receive money');
      warningSigns.push('Claims you must scan a QR code to receive or accept a payment.');
    }
    if (mentionsPin) {
      const match = text.match(/\b(enter\s*(your\s*)?(6\s*digit\s*)?upi\s*pin|type\s*your\s*pin|pin\s*to\s*accept)\b/i);
      suspiciousPhrases.push(match ? match[0] : 'enter your UPI PIN');
      warningSigns.push('Instructs you to type your UPI PIN to "accept" incoming funds.');
    }
    if (mentionsBuyerOrArmy) {
      warningSigns.push('Impersonates army or defense personnel to build false trust and evade in-person inspection.');
    }

    recommendedActions.push('Do NOT scan the QR code under any circumstances.');
    recommendedActions.push('Never enter your UPI PIN on Google Pay, PhonePe, Paytm, or BHIM to receive money.');
    recommendedActions.push('Block and report the buyer immediately on the classifieds platform.');
    recommendedActions.push('If you already scanned and entered your PIN, call 1930 immediately and block your UPI on your bank app.');
  }

  // Pattern 2: Fake Bank KYC / Suspension with Malicious APK or Links
  const mentionsBank = /\b(sbi|yono|hdfc|icici|axis|pnb|bob|canara|kotak|rbi|bank|netbanking)\b/i.test(text);
  const mentionsKycOrPan = /\b(kyc|pan|pan\s*card|aadhaar|biometric|document)\b/i.test(text);
  const mentionsSuspension = /\b(blocked|bloacked|blckd|deactivated|suspended|hold|closed|deactivate)\b/i.test(text);
  const hasUrgencyTime = /\b(today|tonight|24\s*hours?|immediately|immedetly|urgnt|turant|jaldi)\b/i.test(text);

  if ((mentionsBank || mentionsKycOrPan) && mentionsSuspension) {
    riskScore += 90;
    scamType = 'Fake Bank KYC Suspension & APK Phishing Attack';
    goldenRuleViolation = 'Banks NEVER send SMS links or APK files to update KYC or reactivate accounts.';
    cybercrimeReportingNeeded = true;

    const suspMatch = text.match(/\b(acount\s*(has\s*been\s*)?bloacked|account\s*blocked\s*today|update\s*kyc\s*immedetly)\b/i);
    if (suspMatch) suspiciousPhrases.push(suspMatch[0]);

    warningSigns.push('Threatens immediate account blockage to induce panic and hasty action.');

    if (/\.apk\b/i.test(text)) {
      const apkMatch = text.match(/https?:\/\/[^\s]+\.apk/i) || text.match(/\b[^\s]+\.apk\b/i);
      if (apkMatch) suspiciousPhrases.push(apkMatch[0]);
      warningSigns.push('Directs you to download an Android APK file (.apk), which acts as a banking trojan to steal OTPs and SMS.');
    } else if (hasSuspiciousLinks) {
      warningSigns.push('Directs to an unverified third-party domain mimicking official bank portals.');
    }

    recommendedActions.push('Do NOT click the link and do not download or install any .apk files.');
    recommendedActions.push('Never enter netbanking passwords, card details, or OTPs on links received via SMS.');
    recommendedActions.push('Verify your account status by logging into your bank\'s official app downloaded from Google Play Store or Apple App Store.');
    recommendedActions.push('Report the SMS on the Chakshu portal (sancharsaathi.gov.in) and cybercrime.gov.in (1930).');
  }

  // Pattern 3: Electricity / Utility Disconnection Threat
  const mentionsPower = /\b(electricity|bijli|power\s*cut|power\s*supply|light\s*kat)\b/i.test(text);
  const mentionsDisconnectionTime = /\b(9:30\s*pm|tonight|disconnected\s*tonight|unpaid\s*bill|bill\s*not\s*updated)\b/i.test(text);
  const hasOfficerCall = /\b(officer|contact|call\s*our|call\s*at)\s*([6-9]\d{9}|mr\.)/i.test(text);

  if (mentionsPower && (mentionsDisconnectionTime || hasOfficerCall)) {
    riskScore += 92;
    scamType = 'Urgent Electricity Disconnection Extortion';
    goldenRuleViolation = 'State utility boards never send disconnection threats from personal numbers asking you to call individual agents.';
    cybercrimeReportingNeeded = true;

    const powerMatch = text.match(/\b(disconnected\s*tonight\s*at\s*9:30\s*pm|previous\s*month\s*bill\s*was\s*not\s*updated|contact\s*our\s*electricity\s*officer)\b/i);
    if (powerMatch) suspiciousPhrases.push(powerMatch[0]);

    warningSigns.push('Creates high panic by threatening electricity power cut at night (typically 9:30 PM).');
    warningSigns.push('Instructs you to call a personal 10-digit mobile number instead of official electricity board helplines.');

    recommendedActions.push('Do NOT call the personal phone number provided in the message.');
    recommendedActions.push('Check your electricity bill status directly in your official electricity provider app or authorized payment app.');
    recommendedActions.push('Report the scam number to 1930 and the telecom department\'s Chakshu portal.');
  }

  // Pattern 4: Bank Manager / Fraud Dept OTP Solicitation Call/SMS
  const isCallerOtpScam = isActualOtpSolicitation || (mentionsBank && /\b(unauthorized|international|charge|card\s*blocked)\b/i.test(text) && /\b(share|tell|give|cancel)\b/i.test(text) && /\b(otp|code|pin)\b/i.test(text) && !hasDoNotShareWarning);
  if (isCallerOtpScam) {
    riskScore += 98;
    scamType = 'Bank Executive Impersonation OTP Phishing';
    goldenRuleViolation = 'No bank executive, police officer, or RBI official will EVER ask for your OTP or UPI PIN.';
    cybercrimeReportingNeeded = true;

    const otpMatch = text.match(/\b(share\s*(the\s*)?(6\s*digit\s*)?otp|tell\s*me\s*the\s*code|cancel\s*unauthorized\s*charge)\b/i);
    if (otpMatch) suspiciousPhrases.push(otpMatch[0]);

    warningSigns.push('Caller or sender impersonating bank fraud team requesting your OTP to "cancel" a transaction.');
    warningSigns.push('Revealing an OTP allows the scammer to authorize the fraudulent transaction.');

    recommendedActions.push('NEVER share your OTP, PIN, or CVV with anyone over the phone or text.');
    recommendedActions.push('Disconnect the call immediately.');
    recommendedActions.push('Call your bank directly using the official toll-free number printed on the back of your debit/credit card.');
  }

  // Pattern 5: Fake Cashback, Rewards, Scratch Cards, or Lottery
  const mentionsPrize = /\b(cashback|reward|scratch\s*card|voucher|won|lottery|kbc|lucky\s*draw|lakh|crore)\b/i.test(text);
  const mentionsPrizeClaim = /\b(claim|redeem|winner|congratulation|congrats|click\s*to\s*claim)\b/i.test(text);

  if (mentionsPrize && (mentionsPrizeClaim || hasSuspiciousLinks || /\b(registration\s*fee|tax|advance)\b/i.test(text))) {
    riskScore += 88;
    scamType = 'Fake Cashback / Lottery Advance-Fee Scam';
    goldenRuleViolation = 'Legitimate cashback in PhonePe/GooglePay is credited automatically. You NEVER need to pay a fee or enter your PIN to claim a prize.';
    cybercrimeReportingNeeded = true;

    const prizeMatch = text.match(/\b(won\s*(a\s*)?(cash\s*)?(reward|voucher|cashback)\s*of\s*₹?\d+|claim\s*(your\s*)?instant\s*(cashback|refund))\b/i);
    if (prizeMatch) suspiciousPhrases.push(prizeMatch[0]);

    warningSigns.push('Promises unrealistic cash prizes or lottery winnings to lure you into clicking unverified links.');
    if (hasSuspiciousLinks) {
      warningSigns.push('Directs to an unofficial domain mimicking PhonePe, Google Pay, or KBC.');
    }

    recommendedActions.push('Do NOT click the prize or reward link.');
    recommendedActions.push('Check the Rewards section directly inside your official PhonePe or Google Pay app.');
    recommendedActions.push('Never send advance fees or taxes to release promised prize money.');
  }

  // Pattern 6: Part-Time Job / YouTube Like / Telegram Task Fraud
  const mentionsTaskJob = /\b(work\s*from\s*home|part[\s-]*time|youtube\s*likes?|rating\s*google|telegram\s*task|like\s*and\s*subscribe)\b/i.test(text);
  const mentionsDailyIncome = /\b(earn\s*(₹|rs\.?)?\s*\d{3,5}|daily\s*(income|payout)|flexible\s*work)\b/i.test(text);

  if (mentionsTaskJob && (mentionsDailyIncome || /\btelegram\b/i.test(text))) {
    riskScore += 90;
    scamType = 'Part-Time Task & YouTube Like Employment Scam';
    cybercrimeReportingNeeded = true;

    const jobMatch = text.match(/\b(earn\s*₹?\d+[\s-]*to\s*₹?\d+\s*daily|liking\s*youtube\s*videos|telegram\s*@[a-z0-9_]+)\b/i);
    if (jobMatch) suspiciousPhrases.push(jobMatch[0]);

    warningSigns.push('Promises exorbitant daily earnings for trivial tasks like liking videos or rating maps.');
    warningSigns.push('Operates anonymously through Telegram or WhatsApp, leading to advance-fee deposit demands.');

    recommendedActions.push('Do NOT contact the recruiter or join their Telegram channel.');
    recommendedActions.push('Never deposit money or "prepaid task funds" to withdraw supposed earnings.');
  }

  // Pattern 7: Remote Screen-Sharing Tool Trap (AnyDesk, TeamViewer, RustDesk)
  const mentionsRemoteTool = /\b(anydesk|teamviewer|rustdesk|quicksupport|screen\s*share|zoho\s*assist)\b/i.test(text);
  if (mentionsRemoteTool) {
    riskScore += 96;
    scamType = 'Remote Desktop Screen-Sharing Fraud';
    goldenRuleViolation = 'Customer care and bank agents will NEVER ask you to install remote screen-sharing tools.';
    cybercrimeReportingNeeded = true;

    const toolMatch = text.match(/\b(anydesk|teamviewer|rustdesk|quicksupport)\b/i);
    if (toolMatch) suspiciousPhrases.push(toolMatch[0]);

    warningSigns.push('Asks you to install remote desktop software, granting the caller live view and control over your phone.');
    warningSigns.push('Used by scammers to watch you log into your banking app and intercept two-factor OTPs.');

    recommendedActions.push('Do NOT install any screen-sharing application.');
    recommendedActions.push('If already installed, immediately disconnect Wi-Fi and mobile data, uninstall the app, and inform your bank.');
  }

  // Pattern 8: Family Distress / Impersonation Scam
  const mentionsRelative = /\b(dad|mom|papa|mummy|beta|brother|sister)\b/i.test(text);
  const mentionsAccidentOrEmergency = /\b(phone\s*(fell|broke|lost)|hospital|emergency|police|arrested|friend('s)?\s*number)\b/i.test(text);
  const asksUrgentMoney = /\b(urgent(ly)?|need\s*(rs\.?|inr|₹)?\s*\d{3,6}|upi\s*to\s*this|send\s*money)\b/i.test(text);

  if (mentionsRelative && mentionsAccidentOrEmergency && asksUrgentMoney) {
    riskScore += 80;
    scamType = 'Family Emergency Impersonation Scam';
    cybercrimeReportingNeeded = true;

    const emergMatch = text.match(/\b(phone\s*fell\s*in(to)?\s*water|friend'?s\s*number|urgently\s*need\s*₹?\d+)\b/i);
    if (emergMatch) suspiciousPhrases.push(emergMatch[0]);

    warningSigns.push('Claims to be a distressed relative using a friend\'s phone to bypass regular calling.');
    warningSigns.push('Manufactures urgent emotional pressure to induce immediate money transfer without verification.');

    recommendedActions.push('Do NOT send money to the unfamiliar number.');
    recommendedActions.push('Call your family member directly on their known regular phone number or contact other relatives to verify.');
  }

  // Pattern 9: Fake Courier / India Post Parcel Scam
  const mentionsCourier = /\b(india\s*post|courier|parcel|delivery|fedex|dhl|blue\s*dart)\b/i.test(text);
  const mentionsAddressIncomplete = /\b(address\s*incomplete|missing\s*house|update\s*address|package\s*on\s*hold|return\s*to\s*sender)\b/i.test(text);

  if (mentionsCourier && (mentionsAddressIncomplete || hasSuspiciousLinks)) {
    riskScore += 85;
    scamType = 'Fake Courier / India Post Delivery Phishing';
    goldenRuleViolation = 'Official postal and courier services in India use official .gov.in or registered company domains, never arbitrary .top or .site domains.';
    cybercrimeReportingNeeded = true;

    const courierMatch = text.match(/\b(india\s*post\s*delivery\s*address|update\s*address|avoid\s*parcel\s*return)\b/i);
    if (courierMatch) suspiciousPhrases.push(courierMatch[0]);

    warningSigns.push('Impersonates courier services claiming incomplete delivery address.');
    if (hasSuspiciousLinks) {
      warningSigns.push('Directs to an unverified domain designed to capture credit card and UPI details under the guise of a small "redelivery fee".');
    }

    recommendedActions.push('Do NOT click the link or provide your address and card details.');
    recommendedActions.push('Track parcels directly on the official India Post website (indiapost.gov.in) using your booking consignment number.');
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // If score is 0 and no specific patterns matched, evaluate residual risk
  if (riskScore === 0) {
    if (hasSuspiciousLinks) {
      riskScore = 55;
      scamType = 'Unverified External Link Detected';
      warningSigns.push('Message contains an unverified URL or shortened link.');
      recommendedActions.push('Do not click unfamiliar links from unverified senders.');
    } else if (hasUrgencyTime && /\b(pay|money|call)\b/i.test(text)) {
      riskScore = 40;
      scamType = 'Urgent Request Requiring Manual Verification';
      warningSigns.push('Message creates urgency regarding an action or payment.');
      recommendedActions.push('Confirm sender identity through independent channels.');
    } else {
      // Truly ambiguous / benign
      return {
        verdict: 'UNCERTAIN',
        riskScore: 15,
        riskCategory: 'Low detected risk',
        riskLevel: 'LOW',
        scamType: 'Unclassified Message / Low Context',
        summary: 'The message does not contain typical fraud patterns, but lacks sufficient context to confirm authenticity.',
        explanation: 'We did not identify malicious links, requests for sensitive credentials, or deceptive payment inversion mechanics. However, if this message is followed by a request for money, an OTP, or personal details, re-scan the follow-up message here.',
        warningSigns: ['No immediate threat indicators found; exercise normal digital caution.'],
        suspiciousPhrases: [],
        recommendedActions: [
          'If the sender asks for a payment, OTP, or UPI PIN later, do not comply.',
          'Remember: Never enter your UPI PIN to receive money.',
        ],
        confidenceScore: 70,
        limitations: 'General message with no active financial solicitation detected.',
      };
    }
  }

  // Determine final verdict based on calibrated risk score
  let verdict: ScamVerdict;
  if (riskScore >= 75) {
    verdict = 'LIKELY SCAM';
  } else if (riskScore >= 45) {
    verdict = 'SUSPICIOUS';
  } else if (riskScore >= 20) {
    verdict = 'UNCERTAIN';
  } else {
    verdict = 'LIKELY LEGITIMATE';
  }

  const riskCategory = getRiskCategoryFromScore(riskScore);
  const riskLevel = getRiskLevelFromScore(riskScore);

  return {
    verdict,
    riskScore,
    riskCategory,
    riskLevel,
    scamType,
    summary:
      verdict === 'LIKELY SCAM'
        ? '⚠️ High risk of fraud detected. Do not click links, send money, or reply to this message.'
        : '⚠️ Be careful: this message has warning signs. Verify the sender before taking any action.',
    explanation:
      verdict === 'LIKELY SCAM'
        ? 'This message matches known scam patterns such as false urgency, fake bank links, or payment tricks. Fraudsters use these tactics to steal your money or bank access.'
        : 'This message has suspicious elements like unverified links or urgency. Scammers often use these to lure you into sharing details.',
    warningSigns,
    suspiciousPhrases: Array.from(new Set(suspiciousPhrases)),
    recommendedActions,
    goldenRuleViolation,
    cybercrimeReportingNeeded,
    confidenceScore: Math.min(100, Math.max(65, riskScore > 50 ? riskScore : 100 - riskScore)),
    limitations,
  };
}
