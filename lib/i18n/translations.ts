export type Locale = 'en' | 'id'

export interface Translations {
  // Header / Title
  title: string
  description: string

  // Form
  enterUrl: string
  urlPlaceholder: string
  checkButton: string

  // Loading messages
  checking: string
  analyzingUrl: string
  scanningForThreats: string
  almostDone: string
  kindlyWait: string
  startingScan: string

  // Progress messages
  urlValidated: string
  validatingDomainExtension: string
  checkingLegitimateDomainList: string
  checkingBlacklist: string
  scanningWithUrlScanner: string
  urlScannerScanComplete: string
  checkingDomainRegistrationInfo: string
  capturingScreenshot: string
  complete: string

  // Error messages
  failedToCheckWebsite: string
  pleaseTryAgain: string
  scanFailed: string
  noResponseBody: string

  // URL validation errors
  errorEnterUrl: string
  errorInvalidUrlHostname: string
  errorInvalidUrlAddress: string
  errorInvalidUrlTld: string
  errorInvalidUrlFormat: string

  // Prompt messages
  domainNotFoundInDb: string
  domainNotFoundDetail: string
  yesContinue: string
  noCancel: string

  // Result section
  websiteScreenshot: string
  clickToZoom: string
  websiteScreenshotFullSize: string

  // Risk level messages
  legitimate: string
  legitimateDetail: string
  suspiciousNewDomain: string
  suspiciousDomainStructure: string
  warningKnownPhishing: string
  warningKnownPhishingDetail: string
  warningVeryNewDomain: string
  warningSuspiciousDomainStructure: string
  warningUnusualTld: string
  warningNoSecureConnection: string
  highRiskUnusualTld: string
  highRiskUnusualTldDetail: string
  highRiskSubdomainHeavy: string
  highRiskSubdomainHeavyDetail: string
  highRiskNoSecureConnection: string
  highRiskNoSecureConnectionDetail: string

  // Check result messages
  websiteInLegitimateList: string
  passedUrlScannerCheck: string
  urlScannerDetectedThreats: string
  urlScannerThreatTypes: string
  urlScannerUnlisted: string
  urlScannerUnavailable: string
  urlScannerNotAvailable: string
  usesFreeSuspiciousTld: string
  usesStandardDomainExtension: string
  domainExtensionUnknown: string
  domainContainsPhishingKeywords: string
  websiteReachableSecure: string
  websiteReachableNotSecure: string
  websiteNotReachable: string
  websiteCouldNotBeReached: string
  domainStructureUnusual: string
  domainIsDaysOld: string
  domainAgeUnavailable: string
  domainExpiresSoon: string
  abuseContact: string

  // TLD validation messages
  invalidDomainExtension: string

  // URL format errors
  invalidUrlFormat: string
  invalidUrlFormatDetail: string
}

export const translations: Record<Locale, Translations> = {
  en: {
    // Header / Title
    title: 'Ceker - Your Truly Link Checker',
    description: 'Verify if a website is legitimate or suspicious',

    // Form
    enterUrl: 'Enter Website URL',
    urlPlaceholder: 'https://example.com',
    checkButton: 'Check Website',

    // Loading messages
    checking: 'Checking...',
    analyzingUrl: 'Analyzing URL...',
    scanningForThreats: 'Scanning for threats...',
    almostDone: 'Almost done...',
    kindlyWait: 'Kindly wait for a second...',

    // Progress messages
    startingScan: 'Starting scan...',
    urlValidated: 'URL validated',
    validatingDomainExtension: 'Validating domain extension...',
    checkingLegitimateDomainList: 'Checking legitimate domain list...',
    checkingBlacklist: 'Checking blacklist...',
    scanningWithUrlScanner: 'Scanning with URL Scanner...',
    urlScannerScanComplete: 'URL Scanner scan complete',
    checkingDomainRegistrationInfo: 'Checking domain registration information...',
    capturingScreenshot: 'Capturing screenshot...',
    complete: 'Complete',

    // Error messages
    failedToCheckWebsite: 'Failed to check website. Please try again.',
    pleaseTryAgain: 'Please try again.',
    scanFailed: 'Scan failed',
    noResponseBody: 'No response body',

    // URL validation errors
    errorEnterUrl: 'Please enter a URL',
    errorInvalidUrlHostname: 'Invalid URL: hostname is required',
    errorInvalidUrlAddress: 'Invalid URL: please enter a valid website address (e.g., example.com)',
    errorInvalidUrlTld: 'Invalid URL: top-level domain must be at least 2 characters',
    errorInvalidUrlFormat: 'Invalid URL format',

    // Prompt messages
    domainNotFoundInDb: 'Domain not found in our database.',
    domainNotFoundDetail: 'This domain is not in our legitimate list. We will perform additional checks, but results may not be accurate. Continue?',
    yesContinue: 'Yes, continue',
    noCancel: 'No, cancel',

    // Result section
    websiteScreenshot: 'Website Screenshot',
    clickToZoom: 'Click to zoom',
    websiteScreenshotFullSize: 'Website Screenshot - Full Size',

    // Risk level messages
    legitimate: '✓ Appears to be a Legitimate Website',
    legitimateDetail: '✓ Website is available in our legitimate website list',
    suspiciousNewDomain: '⚠️ Suspicious - Recently Registered Domain',
    suspiciousDomainStructure: '⚠️ Suspicious - Unusual Domain Structure',
    warningKnownPhishing: '⚠️ WARNING - Known Phishing Website',
    warningKnownPhishingDetail: '⚠️ This website is in our blacklist of known phishing sites',
    warningVeryNewDomain: '⚠️ High Risk - Very New Domain',
    warningSuspiciousDomainStructure: '⚠️ High Risk - Suspicious Domain Structure',
    warningUnusualTld: '⚠️ High Risk - Unusual Domain Extension',
    warningNoSecureConnection: '⚠️ High Risk - Not Using Secure Connection',
    highRiskUnusualTld: '⚠️ High Risk - Unusual Domain Extension',
    highRiskUnusualTldDetail: '⚠️ The domain extension is unknown',
    highRiskSubdomainHeavy: '⚠️ High Risk - Suspicious Domain Structure',
    highRiskSubdomainHeavyDetail: '⚠️ Uses a free/suspicious top-level domain' + ' - ' + 'Domain structure seems unusual (subdomain heavy)',
    highRiskNoSecureConnection: '⚠️ High Risk - Not Using Secure Connection',
    highRiskNoSecureConnectionDetail: '⚠️ Website is reachable, but not using secure connection',

    // Check result messages
    websiteInLegitimateList: '✓ Website is available in our legitimate website list',
    passedUrlScannerCheck: '✓ Passed URL Scanner check',
    urlScannerDetectedThreats: '⚠️ URL Scanner detected threats',
    urlScannerThreatTypes: '',
    urlScannerUnlisted: 'ℹ️ The URL is not registered in internal website.',
    urlScannerUnavailable: 'ℹ️ URL Scanner check unavailable',
    urlScannerNotAvailable: '⚠️ URL Scanner not available',
    usesFreeSuspiciousTld: '⚠️ Uses a free/suspicious top-level domain',
    usesStandardDomainExtension: '✓ Uses a standard domain extension',
    domainExtensionUnknown: '⚠️ The domain extension is unknown',
    domainContainsPhishingKeywords: '⚠️ Domain contains common phishing keywords',
    websiteReachableSecure: '✓ Website is reachable, responding, and using secure connection',
    websiteReachableNotSecure: '⚠️ Website is reachable, but not using secure connection',
    websiteNotReachable: '⚠️ Website cannot be reached',
    websiteCouldNotBeReached: '⚠️ Website could not be reached',
    domainStructureUnusual: '⚠️ Domain structure seems unusual (subdomain heavy)',
    domainIsDaysOld: '✓ Domain is {days} days old{suffix}',
    domainAgeUnavailable: 'ℹ️ Domain age information unavailable{suffix}',
    domainExpiresSoon: '⚠️ Domain expires soon ({days} days)',
    abuseContact: 'ℹ️ Abuse contact: {email}',

    // TLD validation messages
    invalidDomainExtension: 'The domain extension is invalid.',

    // URL format errors
    invalidUrlFormat: 'Invalid URL Format',
    invalidUrlFormatDetail: 'The URL you entered is not in a valid format.',
  },

  id: {
    // Header / Title
    title: 'Ceker - Cek Website Sebelum Klik!',
    description: 'Apakah website yang anda akan akses aman?',

    // Form
    enterUrl: 'Masukkan URL Website',
    urlPlaceholder: 'https://contoh.com',
    checkButton: 'Cek Website Sekarang',

    // Loading messages
    checking: 'Memeriksa...',
    analyzingUrl: 'Menganalisis URL...',
    scanningForThreats: 'Memeriksa ancaman...',
    almostDone: 'Hampir selesai...',
    kindlyWait: 'Mohon tunggu sebentar...',

    // Progress messages
    startingScan: 'Memulai pemeriksaan...',
    urlValidated: 'Website tervalidasi...',
    validatingDomainExtension: 'Memvalidasi website...',
    checkingLegitimateDomainList: 'Memeriksa daftar website internal...',
    checkingBlacklist: 'Memeriksa daftar blacklist...',
    scanningWithUrlScanner: 'Memeriksa dengan Website Scanner...',
    urlScannerScanComplete: 'Pemeriksaan Website Scanner selesai',
    checkingDomainRegistrationInfo: 'Memeriksa informasi tambahan website...',
    capturingScreenshot: 'Mengakses dan screenshot website...',
    complete: 'Selesai',

    // Error messages
    failedToCheckWebsite: 'Gagal memeriksa website. Silakan coba lagi.',
    pleaseTryAgain: 'Silakan coba lagi.',
    scanFailed: 'Pemeriksaan gagal',
    noResponseBody: 'Tidak ada respons',

    // URL validation errors
    errorEnterUrl: 'Silakan masukkan Website',
    errorInvalidUrlHostname: 'Website tidak valid: periksa apakah domain yang diinputkan benar',
    errorInvalidUrlAddress: 'Website tidak valid: silakan masukkan website yang valid (misalnya: contoh.com)',
    errorInvalidUrlTld: 'Website tidak valid: domain minimal 2 karakter',
    errorInvalidUrlFormat: 'Format website tidak valid',

    // Prompt messages
    domainNotFoundInDb: 'Website tidak ditemukan dalam daftar website internal.',
    domainNotFoundDetail: 'Website ini tidak ada dalam daftar website internal kami. Kami akan melakukan pemeriksaan tambahan. Lanjutkan?',
    yesContinue: 'Ya, lanjutkan',
    noCancel: 'Tidak, batal',

    // Result section
    websiteScreenshot: 'Screenshot Website',
    clickToZoom: 'Klik untuk perbesar',
    websiteScreenshotFullSize: 'Screenshot Website - Ukuran Penuh',

    // Risk level messages
    legitimate: '✓ Website aman',
    legitimateDetail: '✓ Website tersedia dalam daftar website internal',
    suspiciousNewDomain: '⚠️ Mencurigakan - Website Baru Terdaftar',
    suspiciousDomainStructure: '⚠️ Mencurigakan - Struktur Website Tidak Umum',
    warningKnownPhishing: '⚠️ PERINGATAN - Website Phishing yang Diketahui',
    warningKnownPhishingDetail: '⚠️ Website ini berada dalam daftar web phising',
    warningVeryNewDomain: '⚠️ Risiko Tinggi - Website Sangat Baru Terdaftar',
    warningSuspiciousDomainStructure: '⚠️ Risiko Tinggi - Struktur Website Mencurigakan',
    warningUnusualTld: '⚠️ Risiko Tinggi - Ekstensi Website Tidak Biasa',
    warningNoSecureConnection: '⚠️ Risiko Tinggi - Tidak Menggunakan Koneksi yang Aman',
    highRiskUnusualTld: '⚠️ Risiko Tinggi - Ekstensi Website Tidak Biasa',
    highRiskUnusualTldDetail: '⚠️ Ekstensi website tidak dikenal',
    highRiskSubdomainHeavy: '⚠️ Risiko Tinggi - Struktur Website Mencurigakan',
    highRiskSubdomainHeavyDetail: '⚠️ Menggunakan domain gratis/mencurigakan' + ' - ' + 'Struktur domain tampak tidak biasa (banyak subdomain)',
    highRiskNoSecureConnection: '⚠️ Risiko Tinggi - Tidak Menggunakan Koneksi yang Aman',
    highRiskNoSecureConnectionDetail: '⚠️ Website dapat diakses, tetapi tidak menggunakan koneksi yang aman',

    // Check result messages
    websiteInLegitimateList: '✓ Website berada daftar website internal',
    passedUrlScannerCheck: '✓ Lolos pemeriksaan Website Scanner',
    urlScannerDetectedThreats: '⚠️ Website Scanner mendeteksi ancaman',
    urlScannerThreatTypes: '',
    urlScannerUnlisted: '',
    urlScannerUnavailable: '',
    urlScannerNotAvailable: '⚠️ Website Scanner tidak tersedia',
    usesFreeSuspiciousTld: '⚠️ Menggunakan domain gratis/mencurigakan',
    usesStandardDomainExtension: '✓ Menggunakan ekstensi domain standar',
    domainExtensionUnknown: '⚠️ Ekstensi domain tidak dikenal',
    domainContainsPhishingKeywords: '⚠️ Domain mengandung kata kunci phishing umum',
    websiteReachableSecure: '✓ Website dapat diakses, merespons, dan menggunakan koneksi aman',
    websiteReachableNotSecure: '⚠️ Website dapat diakses, tetapi tidak menggunakan koneksi aman',
    websiteNotReachable: '⚠️ Website tidak dapat diakses',
    websiteCouldNotBeReached: '⚠️ Website tidak dapat diakses',
    domainStructureUnusual: '⚠️ Struktur domain tampak tidak biasa (banyak subdomain)',
    domainIsDaysOld: '✓ Domain berusia {days} hari{suffix}',
    domainAgeUnavailable: 'ℹ️ Informasi usia domain tidak tersedia{suffix}',
    domainExpiresSoon: '⚠️ Domain akan segera kedaluwarsa ({days} hari)',
    abuseContact: 'ℹ️ Kontak penyalahgunaan: {email}',

    // TLD validation messages
    invalidDomainExtension: 'Ekstensi domain tidak valid.',

    // URL format errors
    invalidUrlFormat: 'Format Website Tidak Valid',
    invalidUrlFormatDetail: 'Website yang Anda masukkan tidak dalam format yang valid.',
  },
}

// Helper function for parameter interpolation
export function t(
  locale: Locale,
  key: keyof Translations,
  params?: Record<string, string | number>
): string {
  const translation = translations[locale][key]

  if (!params) {
    return translation
  }

  // Replace {key} placeholders with actual values
  return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
    return params[paramKey]?.toString() || match
  })
}
