
import { LegalCase, User, BillingConfig, Announcement, SupportTicket, Statute, DictionaryTerm, LegalTemplate, Organization, ClientFolder, CitationStatus } from "../types";

// Keys
const DB_NAME = "MyanlexDB";
const STORE_CASES = "cases";
const DB_VERSION = 1;

// Legacy Keys (Keep for non-case data)
const DB_KEY_USERS = "myanlex_users";
const DB_KEY_ORGS = "myanlex_orgs"; 
const DB_KEY_CONFIG = "myanlex_config";
const DB_KEY_ANNOUNCEMENTS = "myanlex_announcements";
const DB_KEY_TICKETS = "myanlex_tickets";
const DB_KEY_STATUTES = "myanlex_statutes";
const DB_KEY_DICTIONARY = "myanlex_dictionary";
const DB_KEY_TEMPLATES = "myanlex_templates";

// --- IN-MEMORY CACHE ---
// IndexedDB is async, but our UI expects sync data for speed. 
// We load everything into memory on app start.
const MEMORY_CACHE: {
    cases: LegalCase[];
    isInitialized: boolean;
} = {
    cases: [],
    isInitialized: false
};

// --- SEED DATA ---

// 1. CASES
const SEED_CASES: LegalCase[] = [
  // --- CRIMINAL CASES (12) ---
  {
    id: "2021-mlr-crim-1",
    caseName: "ဒေါ်ခင်စန္ဒာမိုး နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် ပါ ၂",
    caseNameEnglish: "Daw Khin Sandar Moe vs. The Union of Myanmar + 2",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၁",
    court: "Supreme Court of the Union",
    judges: ["U Soe Naing"],
    date: "2020-06-02",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၈၈ အရ ဝရမ်းကပ်ထားသောပစ္စည်းနှင့်ပတ်သက်၍ တတိယပုဂ္ဂိုလ်များက အရေးဆိုခွင့်ကာလ (၆) လ ကန့်သတ်ချက်ကျော်လွန်ပါက ပုဒ်မ ၈၉ အရ သက်သာခွင့်မရနိုင်ကြောင်း ဆုံးဖြတ်ချက်။",
    holding: "ပြင်ဆင်မှုလျှောက်ထားခြင်းကို ပယ်လိုက်သည်။ တတိယပုဂ္ဂိုလ်သည် ပုဒ်မ ၈၈(၆-က) ပါ သတ်မှတ်ကာလ (၆) လအတွင်း ကန့်ကွက်ခြင်းမပြုခဲ့သဖြင့် ပုဒ်မ ၈၉ အရ အခွင့်အရေးမရနိုင်ပါ။",
    headnotes: ["Criminal Procedure Code Section 88", "Time Limitations", "Third Party Claims"],
    legalIssues: ["တတိယပုဂ္ဂိုလ်သည် ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၈၉ အရ အခွင့်အရေးရနိုင်သလား"],
    parties: { plaintiff: "Daw Khin Sandar Moe", defendant: "The Union of Myanmar" },
    content: "ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၈၈၊ ပုဒ်မခွဲ (၆ က) (၆ ဃ) (၇) တို့ကို ဆက်စပ်ယှဉ်တွဲ ကြည့်ရှုရန်ဖြစ်ပြီး အဆိုပါပြဋ္ဌာန်းချက်များအရ ဝရမ်းကပ်ထားသည့် ပစ္စည်းနှင့်စပ်လျဉ်း၍ အကျိုးခံစားခွင့်ရှိသူ၏ စဉ်ဆက်မပြတ် အခွင့်အရေးများ အချိန်ကာလ ကန့်သတ်ချက်နှင့်တကွ အပြည့်အဝခွင့်ပြုထားသည်မှာ ထင်ရှားသည်။"
  },
  {
    id: "2021-mlr-crim-2",
    caseName: "ဒေါ်ချိုသဲ (ခ) ဒေါ်ငယ် နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် ပါ ၂",
    caseNameEnglish: "Daw Cho The (a) Daw Nge vs. The Union of Myanmar + 2",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၂၂",
    court: "Supreme Court of the Union",
    judges: ["U Htun Htun Oo", "U Myo Tint", "U Myo Maung"],
    date: "2021-10-25",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "အယူခံမှု၊ ပြင်ဆင်မှုဆိုသည်မှာ သီးခြားစစ်ဆေးစီရင်မှုမဟုတ်ဘဲ မူလအမှုတို့နှင့်တစ်ဆက်တစ်စပ်တည်းသာဖြစ်ခြင်း၊ သက်သေခံပစ္စည်းစီမံခန့်ခွဲခြင်းသည် သီးခြားအမိန့်မဟုတ်ဘဲ မူလအမှုတွင် တရားခံပြစ်မှုကျူးလွန်ခြင်း ရှိ မရှိ နှင့် ဆက်စပ်သုံးသပ်ရမည့်ကိစ္စဖြစ်ခြင်း",
    holding: "သက်သေခံပစ္စည်းစီမံခန့်ခွဲခြင်းသည် မူလအမှုနှင့် တစ်ဆက်တစ်စပ်တည်းဖြစ်သည်။",
    headnotes: ["Appeal and Revision", "Evidence Management"],
    legalIssues: ["အယူခံမှုသည် သီးခြားစီရင်မှု ဟုတ်မဟုတ်"],
    parties: { plaintiff: "Daw Cho The", defendant: "The Union of Myanmar" },
    content: "တရားစစ်ဆေးစီရင်မှုတစ်ခုသည် ပြစ်မှုထင်ရှားတွေ့ရှိ၍ ပြစ်ဒဏ်ပေးခြင်း သို့မဟုတ် ပြစ်မှုထင်ရှားမတွေ့ရှိသဖြင့် အပြီးအပြတ်လွှတ်ခြင်းတွင် ဆုံးခန်းတိုင်သည်။ အယူခံမှု၊ ပြင်ဆင်မှုဆိုသည်မှာ သီးခြားစစ်ဆေးစီရင်မှုမဟုတ်ဘဲ မူလမှုကို ဆက်လက်ဆောင်ရွက်ခြင်းသာဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-3",
    caseName: "ဦးနိုင်ဝင်း နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် ပါ ၂",
    caseNameEnglish: "U Naing Win vs. The Union of Myanmar + 2",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၃၅",
    court: "Supreme Court of the Union",
    judges: ["U Myint Aung"],
    date: "2021-09-14",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၃၈၆ (၁) အရ ယခင်အမှုမှ ဒဏ်ငွေကို အရကောက်ခံရန်စွဲဆိုမှုကို ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၄၀၃ အရ ပိတ်ပင်မှု မပြုနိုင်ခြင်း။",
    holding: "ယခင်အမှုမှ ဒဏ်ငွေကို အရကောက်ခံရန်စွဲဆိုခြင်းသည် ပုဒ်မ ၄၀၃ အရ ပိတ်ပင်ခြင်း မခံရပါ။",
    headnotes: ["Double Jeopardy", "Fine Recovery"],
    legalIssues: ["ဒဏ်ငွေအရကောက်ခံရန် စွဲဆိုမှုသည် ပုဒ်မ ၄၀၃ နှင့် ငြိစွန်းခြင်း ရှိမရှိ"],
    parties: { plaintiff: "U Naing Win", defendant: "The Union of Myanmar" },
    content: "ရာဇဝတ်ကျင့်ထုံးဥပဒေပုဒ်မ ၃၈၆ (၁) အရ အရေးယူ ဆောင်ရွက်မှုမှာ ယခင်အမှုမှ ဒဏ်ငွေကို ပေးဆောင်မှုမရှိသဖြင့် ဒဏ်ငွေ အရ ကောက်ခံရန် စွဲဆိုမှုဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-4",
    caseName: "ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် နှင့် မသက်သက်အောင် ပါ ၄",
    caseNameEnglish: "The Union of Myanmar vs. Ma Thet Thet Aung + 4",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၄၃",
    court: "Supreme Court of the Union",
    judges: ["U Thar Htay"],
    date: "2021-10-27",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "အယူခံတရားခံအား ဆင့်စာအတည်ပြု၍မရသဖြင့် ၎င်းအပေါ် ကြားနာရန် အခွင့်အရေးမရရှိသောကြောင့် အမှုကိုယာယီပိတ်သိမ်းမည့်အစား ၎င်းအား ထိခိုက်နစ်နာမှုမရှိသည့်အမိန့်မျိုး ချမှတ်နိုင်ခြင်း။",
    holding: "တရားခံအား ထိခိုက်နစ်နာမှုမရှိလျှင် အမှုကို ဆက်လက်ဆောင်ရွက်နိုင်သည်။",
    headnotes: ["Right to Hearing", "Summons Service"],
    legalIssues: ["တရားခံမလာရောက်နိုင်သည့် အခြေအနေတွင် အမှုစီရင်ခွင့်"],
    parties: { plaintiff: "The Union of Myanmar", defendant: "Ma Thet Thet Aung" },
    content: "တရားခံအားကြားနာခွင့်မပေးဘဲ တရားခံက ပြောဆိုခွင့်မရှိဘဲ ၎င်းအပေါ် အမိန့်ချမှတ်မည်ဆိုလျှင် ၎င်းအား ထိခိုက် နစ်နာမည့်အမိန့်ဖြစ်ပါက တရားမျှတမှုကို ထိခိုက်စေနိုင်မည်ဖြစ်သည်။ သို့သော် ထိုသို့ပျက်ကွက်မှုမှာ တရားမျှတမှုကိုမထိခိုက်လျှင် အမှုပျက်ပြယ်ရန် အကြောင်းရှိမည်မဟုတ်ပေ။"
  },
  {
    id: "2021-mlr-crim-5",
    caseName: "မသီတာ နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "Ma Thida vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၅၀",
    court: "Supreme Court of the Union",
    judges: ["U Aung Zaw Thein"],
    date: "2021-06-10",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ဥပဒေနှင့်ညီညွတ်မှုမရှိကြောင်း မပေါ်ပေါက်ပါက ပြစ်မှုပြစ်ဒဏ် စီရင်ပြီးသော တရားခံအပေါ် ပိုမိုကြီးလေးသောစွဲချက်ဖြင့် ပြစ်မှုပြစ်ဒဏ်ထိုက်သင့်စေရန် ရည်ရွယ်၍ မူလရုံး၏ ပြစ်မှုပြစ်ဒဏ်ထင်ရှားစီရင်ခြင်းကို ပယ်ဖျက်ရန် မသင့်ခြင်း။",
    holding: "ပြစ်မှုထင်ရှားစီရင်ပြီးဖြစ်သည့် အမှုကို ပိုမိုကြီးလေးသော ပြစ်ဒဏ်ပေးရန် ရည်ရွယ်၍ ပြန်လည်စစ်ဆေးရန် အမိန့်မချမှတ်သင့်။",
    headnotes: ["Enhancement of Sentence", "Re-trial"],
    legalIssues: ["ပြစ်ဒဏ်တိုးမြှင့်ရန် ပြန်လည်စစ်ဆေးခြင်း"],
    parties: { plaintiff: "Ma Thida", defendant: "The Union of Myanmar" },
    content: "တရားခံကို ပြစ်မှုပြစ်ဒဏ်ထင်ရှားစီရင်ပြီးဖြစ်သည့် အမှုအကြောင်းခြင်းရာများကို အကြောင်းပြု၍ အခြားပြစ်မှုအတွက် စွဲချက်တင် ပြန်လည်စစ်ဆေးစီရင်နိုင်ရန် မူလရုံး၏ ပြစ်မှုပြစ်ဒဏ် ထင်ရှားစီရင်ခြင်းကို ပယ်ဖျက်ရန်မှာ မူလရုံး၏ ပြစ်မှုပြစ်ဒဏ် ထင်ရှားစီရင်မှုသည် ဥပဒေကြောင်းအရ လွန်စွာလွဲမှားနေမှသာ ပယ်ဖျက်သင့်သည်။"
  },
  {
    id: "2021-mlr-crim-6",
    caseName: "ဒေါ်လီလီဝင်း နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "Daw Lily Win vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၆၄",
    court: "Supreme Court of the Union",
    judges: ["U Htun Htun Oo"],
    date: "2021-10-25",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "လိမ်လည်အတုပြုမှု ကျူးလွန်သည်ဟု မထင်ရှားသည့် အခြေအနေတွင် လိမ်လည်အတုပြုထားသော စာရွက်စာတမ်းအမှတ်အသားဖြစ်ကြောင်း သိလျက်နှင့် အသုံးပြုပါသည်ဟု ကောက်ယူ၍ အပြစ်ပေးနိုင်ခြင်း ရှိ မရှိ။",
    holding: "ရာဇသတ်ကြီးပုဒ်မ ၄၆၈ မထင်ရှားလျှင် ပုဒ်မ ၄၇၁ အရလည်း အပြစ်ပေး၍ မရပါ။",
    headnotes: ["Forgery", "Penal Code 471"],
    legalIssues: ["ပုဒ်မ ၄၆၈ နှင့် ၄၇၁ ဆက်စပ်မှု"],
    parties: { plaintiff: "Daw Lily Win", defendant: "The Union of Myanmar" },
    content: "ရာဇသတ်ကြီးပုဒ်မ ၄၇၁ သည် ယင်းပုဒ်မတစ်ခုတည်းသီးခြား ရပ်တည်နိုင်ခြင်းမရှိဘဲ ရှေ့တွင်ပြဋ္ဌာန်းထားသည့် ရာဇသတ်ကြီးပုဒ်မ ၄၆၅၊ ၄၆၆၊ ၄၆၇၊ ၄၆၈ တို့အပေါ် တည်မှီ၍ ဆင့်ပွားသောပုဒ်မသာ ဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-7",
    caseName: "ဦးသီဟကိုကို နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "U Thiha Koko vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၇၆",
    court: "Supreme Court of the Union",
    judges: ["U Myo Tint"],
    date: "2021-10-26",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "Main Server တွင် သိုလှောင်ထားသော အချက်အလက်များအား CD ဖြင့် ကူးယူ၍ သက်သေခံစာတမ်းအမှတ်အသားအဖြစ် တင်သွင်းခြင်းကို သက်သေခံအက်ဥပဒေပုဒ်မ ၃၊ ယင်းပုဒ်မ ၆၃ (၅) နှင့် ယင်းပုဒ်မ ၆၅ (ဃ) အရ ခွင့်ပြုနိုင်ခြင်း။",
    holding: "အီလက်ထရောနစ်မှတ်တမ်းများကို သက်သေခံအဖြစ် လက်ခံနိုင်သည်။",
    headnotes: ["Electronic Evidence", "Evidence Act Section 65"],
    legalIssues: ["Digital Evidence Admissibility"],
    parties: { plaintiff: "U Thiha Koko", defendant: "The Union of Myanmar" },
    content: "သက်သေခံ (ဂ) မှ (ဇ-၄) အထိ စာရွက်စာတမ်းများသည် အီလက်ထရောနစ်မှတ်တမ်းနှင့် သတင်းအချက်အလက်များဖြစ်ပြီး ထိုစာရွက်စာတမ်းများမှာ တရားခံသီဟကိုကို အပ်နှံသည့် ကွန်ပျူတာအတွင်းမှ ပေါ်ထွက်လာခြင်းဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-8",
    caseName: "သံချောင်း (ခ) ရဲမြင့်အောင် နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "Than Chaung (a) Ye Myint Aung vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၈၅",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-06-01",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ပြစ်မှုထင်ရှားစီရင်ပြီး ပြစ်ဒဏ်ချမှတ်ခဲ့သည့်အမိန့်ကို ပယ်ဖျက်ခြင်းမရှိဘဲ အမှုကို ပြောင်းလဲစွဲချက်တင်ရန် ချမှတ်ခဲ့သည့် အထက်တရားရုံး၏အမိန့်သည် ဥပဒေအရ တရားဝင်၍ မှန်ကန်သောအမိန့်အဖြစ် ရပ်တည်နိုင်ခြင်း ရှိ မရှိ။",
    holding: "မူလအမိန့်ကို မပယ်ဖျက်ဘဲ ပြောင်းလဲစွဲချက်တင်ရန် ညွှန်ကြားခြင်းသည် ဥပဒေနှင့်မညီ။",
    headnotes: ["Alteration of Charge", "Appellate Powers"],
    legalIssues: ["အတည်ဖြစ်ဆဲအမိန့်ကို မပယ်ဖျက်ဘဲ စွဲချက်ပြောင်းလဲခြင်း"],
    parties: { plaintiff: "Than Chaung", defendant: "The Union of Myanmar" },
    content: "ခရိုင်တရားရုံးက မူလရုံး၏စွဲချက်အမိန့်ကိုသာ ပယ်ဖျက်၍ အခြားပြစ်မှုများနှင့် စွဲချက်တင်စစ်ဆေးရန် ညွှန်ကြားသည့်အမိန့်သည် မူလရုံး၏ အတည်ဖြစ်ဆဲ အပြီးသတ်အမိန့်ကို ထိခိုက်စေသည်ဖြစ်၍ ဥပဒေအရ တရားဝင်၍ မှန်ကန်သောအမိန့်အဖြစ် ရပ်တည်နိုင်မည်မဟုတ်ပေ။"
  },
  {
    id: "2021-mlr-crim-9",
    caseName: "သန့်ဇင်ဖြိုး (ခ) ရှမ်းကြီး (ခ) ကိုစိုင်း နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "Thant Zin Phyo vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၉၈",
    court: "Supreme Court of the Union",
    judges: ["U Aung Zaw Thein"],
    date: "2021-04-26",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ရဲစုံထောက်မေးမြန်းစဉ် ရဲကစေခိုင်း၍ တယ်လီဖုန်းဖြင့်ဆက်သွယ် မှာကြားချက်အရ မူးယစ်ဆေးဝါးရောင်းချရန် ရောက်ရှိလာသူ၏ လက်ဝယ်တွေ့ရှိသော မူးယစ်ဆေးဝါးနှင့် စပ်လျဉ်း၍ ဖုန်းဆက်သွယ်ပေးရန် ခိုင်းစေခြင်းခံရသူ၏ ပြုလုပ်မှုသည် မိမိအလိုအလျောက်ပြုခြင်း ဟုတ် မဟုတ်။",
    holding: "ရဲစေခိုင်းချက်အရ ဆောင်ရွက်ခြင်းသည် ပူးပေါင်းကြံစည်မှုမဟုတ်။",
    headnotes: ["Entrapment", "Drug Enforcement"],
    legalIssues: ["ရဲ၏ စေခိုင်းချက်အရ ပြုလုပ်မှု"],
    parties: { plaintiff: "Thant Zin Phyo", defendant: "The Union of Myanmar" },
    content: "ရဲအရာရှိ၏ စေခိုင်းချက်အရ စိတ်ကြွရူးသွပ်ဆေးပြားများ ဖုန်းဆက်မှာကြားပေးပို့ခိုင်းခဲ့ခြင်းသည် ၎င်း၏ အလိုအလျောက် ပေါ်ပေါက်လာသောစိတ်ဆန္ဒအရ ပြုမူဆောင်ရွက်ခဲ့သည်ဟုလည်းကောင်း ... ဆိုနိုင်မည်မဟုတ်ပေ။"
  },
  {
    id: "2021-mlr-crim-10",
    caseName: "ဦးသန်းစိုး နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "U Than Soe vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၁၀၆",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-05-20",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ပြစ်မှုနှင့်သက်ဆိုင်သည်ဆိုရာတွင် ပြစ်မှုကျူးလွန်၍ ရရှိသည့် ငွေကြေးဖြင့်ပစ္စည်းအားဝယ်ယူခြင်းနှင့် ပြစ်မှုကျူးလွန်ရာတွင် အဆိုပါ ပစ္စည်းကို အသုံးချခြင်းတို့ပါဝင်ခြင်း။",
    holding: "ယာဉ်ကို ပြစ်မှုကျူးလွန်ရာတွင် အသုံးပြုခြင်း သို့မဟုတ် ပြစ်မှုမှရသောငွေဖြင့် ဝယ်ယူခြင်းဖြစ်မှသာ သိမ်းဆည်းရမည်။",
    headnotes: ["Confiscation of Property", "Proceeds of Crime"],
    legalIssues: ["ပြစ်မှုနှင့်သက်ဆိုင်သော ပစ္စည်းအဓိပ္ပာယ်"],
    parties: { plaintiff: "U Than Soe", defendant: "The Union of Myanmar" },
    content: "ယာဉ်ကို မည်သူကပိုင်ဆိုင်သည်ဆိုသည့်အချက်ကို အခြေခံစဉ်းစားရန်မဟုတ်ဘဲ ပြစ်မှုကျူးလွန်၍ရရှိသည့်ငွေကြေးဖြင့် ဝယ်ယူခဲ့ခြင်း ဟုတ် မဟုတ်၊ ပြစ်မှုကျူးလွန်ရာတွင် အသုံးပြုခဲ့ခြင်း ရှိ မရှိ ဆိုသည့် အချက်တို့ကို စိစစ်ရန်ဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-11",
    caseName: "ဦးအေးချို ပါ ၂ နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် ပါ ၂",
    caseNameEnglish: "U Aye Cho + 2 vs. The Union of Myanmar + 2",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၁၁၃",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-06-17",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "အမှုသည်တစ်စုံတစ်ဦးက တင်သွင်းသော အမှုနှင့်စပ်ဆိုင်သည့် သက်သေခံချက်များကို စစ်ဆေးစီရင်မှု၏ မည်သည့် အဆင့်တွင်မဆို သက်သေခံအဖြစ်လက်ခံရန် တရားရုံးတွင် မူလဘူတအာဏာရှိခြင်း။",
    holding: "တရားရုံးသည် သက်သေခံချက်များကို မည်သည့်အဆင့်တွင်မဆို လက်ခံနိုင်သည်။",
    headnotes: ["Inherent Power", "Admissibility of Evidence"],
    legalIssues: ["သက်သေခံချက် လက်ခံပိုင်ခွင့် အာဏာ"],
    parties: { plaintiff: "U Aye Cho", defendant: "The Union of Myanmar" },
    content: "စာတမ်းအမှတ်အသားသက်သေခံချက် တစ်ရပ်နှင့် စပ်လျဉ်း၍ သက်သေခံဝင်သည်၊ မဝင်သည်ကို ဆုံးဖြတ်နိုင်ခွင့်မှာ သက်သေခံအက်ဥပဒေပုဒ်မ ၁၃၆ အရ တရားသူကြီး၏ အခွင့်အာဏာဖြစ်သည်။"
  },
  {
    id: "2021-mlr-crim-12",
    caseName: "အောင်ဇော်ဦး (ခ) အဲဇော် နှင့် ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်",
    caseNameEnglish: "Aung Zaw Oo (a) Eal Zaw vs. The Union of Myanmar",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ၊ စာ - ၁၂၁",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-04-07",
    caseType: "Criminal",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ပူးတွဲတရားခံတစ်ဦး၏ ရဲထံပြောကြားချက်သည် သက်သေခံ အက်ဥပဒေပုဒ်မ ၃ တွင် အဓိပ္ပာယ်ဖွင့်ဆိုထားသော သက်သေခံချက်မဟုတ်သဖြင့် တရားခံအပေါ်အပြစ်ပေးရန် အခြေခံအဖြစ်အသုံးမပြုနိုင်ခြင်း။",
    holding: "ပူးတွဲတရားခံ၏ ရဲထံထွက်ဆိုချက်ကို အပြစ်ပေးရန် အခြေခံမပြုနိုင်။",
    headnotes: ["Confession of Co-accused", "Police Statement"],
    legalIssues: ["ပူးတွဲတရားခံ၏ ထွက်ဆိုချက် တန်ဖိုး"],
    parties: { plaintiff: "Aung Zaw Oo", defendant: "The Union of Myanmar" },
    content: "ပူးတွဲတရားခံတစ်ဦး၏ဖြောင့်ချက်သည် သက်သေခံအက်ဥပဒေပုဒ်မ ၃ တွင် အဓိပ္ပာယ်ဖွင့်ဆိုထားသည့် သက်သေခံချက်မဟုတ်ပေ။ ထို့ကြောင့်အပြစ်ပေးရန် အခြေခံအဖြစ်မသုံးနိုင်ပေ။"
  },

  // --- CIVIL CASES (6) ---
  {
    id: "2021-mlr-civil-1",
    caseName: "ဒေါ်ခိုင်ခိုင်မြင့် နှင့် ဦးကျော်မျိုးဟန် (၎င်း၏အခွင့်ရကိုယ်စားလှယ် ဦးလှဟန်)",
    caseNameEnglish: "Daw Khine Khine Myint vs. U Kyaw Myo Han",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၁",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-09-21",
    caseType: "Civil",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "တရားမနစ်နာမှုဥပဒေ- ပေါ့လျော့လစ်ဟင်းမှုကြောင့် နစ်နာကြေး ရလိုမှု၊ တရားလိုဘက်မှ သက်သေထူရမည့်အချက်များ၊ ပေါ့ဆမှု၏ အဓိပ္ပာယ်။",
    holding: "ပေါ့ဆမှုအတွက် နစ်နာကြေးရလိုမှု၌ တရားပြိုင်တွင် ဂရုစိုက်ရန်တာဝန်ရှိကြောင်း တရားလိုက သက်သေထူရမည်။",
    headnotes: ["Tort", "Negligence", "Burden of Proof"],
    legalIssues: ["ပေါ့ဆမှုမြောက်ရန် လိုအပ်ချက်များ"],
    parties: { plaintiff: "Daw Khine Khine Myint", defendant: "U Kyaw Myo Han" },
    content: "တရားမနစ်နာမှုဥပဒေပါ ပေါ့ဆမှုဆိုသည်မှာ ဆောင်ရွက်ရန်တာဝန်ရှိသည့်အလျောက် သာမန်အမျှော်အမြင်ရှိသူ တစ်ဦးလုပ်ကိုင်ဆောင်ရွက်မည့်ကိစ္စကို မဆောင်ရွက်ခြင်းကြောင့်... ထိခိုက်နစ်နာခြင်းဖြစ်သည်။"
  },
  {
    id: "2021-mlr-civil-2",
    caseName: "ဒေါက်တာစိုင်းကျော်မင်း (ခ) အိုက်ယွမ်း နှင့် ဦးစိုင်းကျော်စည်သူ",
    caseNameEnglish: "Dr. Sai Kyaw Min vs. U Sai Kyaw Sithu",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၁၃",
    court: "Supreme Court of the Union",
    judges: ["U Myo Tint"],
    date: "2021-12-28",
    caseType: "Family", // Changed from Civil to Family for better categorization
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "မိဘများသည် မိမိတို့မကွယ်လွန်ခင်သားသမီးများကို အမွေဆက်ခံ ခွင့်မရှိသော သွာနုတ္တသားသမီးအဖြစ် မြွက်ဟကြေညာ နိုင်သည့် အခွင့်အရေးရှိ မရှိ။",
    holding: "မိဘမကွယ်လွန်မီ သွာနုတ္တသားအဖြစ် ကြေညာခွင့်မရှိ။",
    headnotes: ["Inheritance", "Dog-son (Swanutta)"],
    legalIssues: ["သွာနုတ္တသားအဖြစ် ကြေညာခွင့်"],
    parties: { plaintiff: "Dr. Sai Kyaw Min", defendant: "U Sai Kyaw Sithu" },
    content: "၎င်းတောင်းဆိုသော သက်သာခွင့်သည် နောင်တစ်ချိန်မိဘများ ကွယ်လွန်ချိန်ရောက်မှ ပေါ်ပေါက်လာမည့် တရားပြိုင်၏ အမွေဆက်ခံခွင့်ကို ကြိုတင်တားဆီးရာရောက်သဖြင့် သွာနုတ္တသားအဖြစ် မြွက်ဟကြေညာနိုင်သည့် အခွင့်အရေးမရှိသည်မှာ မြင်သာသည်။"
  },
  {
    id: "2021-mlr-civil-3",
    caseName: "ဦးစန်းဝင်း ပါ ၂ နှင့် ဒေါ်အုန်းသိန်း ပါ ၃",
    caseNameEnglish: "U San Win + 2 vs. Daw Ohn Thein + 3",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၂၁",
    court: "Supreme Court of the Union",
    judges: ["U Htun Htun Oo"],
    date: "2021-12-06",
    caseType: "Land", // Changed for precision
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "၁၉၅၃ ခုနှစ် လယ်ယာမြေနိုင်ငံပိုင်ပြုလုပ်ရေးအက်ဥပဒေပုဒ်မ ၃၆၊ လယ်ယာမြေကို အမွေပုံပစ္စည်းအဖြစ် စီမံခန့်ခွဲပေးရန် စွဲဆိုသောအမှု၊ ပုဒ်မ ၃၆ တားမြစ်ချက်တွင် အကျုံးဝင်ခြင်း။",
    holding: "လယ်ယာမြေကို တရားရုံးက အမွေခွဲဝေပေးခွင့် မရှိ။",
    headnotes: ["Farmland Law", "Inheritance Jurisdiction"],
    legalIssues: ["လယ်ယာမြေ အမွေမှု စီရင်ပိုင်ခွင့်"],
    parties: { plaintiff: "U San Win", defendant: "Daw Ohn Thein" },
    content: "လယ်ယာမြေများနှင့်ပတ်သက်၍ စီမံခန့်ခွဲခွင့်မှာ ... သက်ဆိုင်ရာ မြေယာကော်မတီများ၏ လုပ်ပိုင်ခွင့်ဖြစ်သည်။ လယ်ယာမြေကို တရားရုံးများက အမွေခွဲဝေပေးခွင့် အာဏာမရှိပေ။"
  },
  {
    id: "2021-mlr-civil-4",
    caseName: "ဦးဌေးအောင် နှင့် ဒေါ်ခင်ထားရီ",
    caseNameEnglish: "U Htay Aung vs. Daw Khin Htar Yi",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၃၁",
    court: "Supreme Court of the Union",
    judges: ["U Htun Htun Oo"],
    date: "2021-11-22",
    caseType: "Civil",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "ကာလစည်းကမ်းသတ်အက်ဥပဒေပုဒ်မ ၁၄ အရ တရားရုံး၌ ကုန်လွန်ခဲ့သောအချိန်ကာလကို ထုတ်ပယ်ခွင့်ရသည့် “အခြားအလားတူသဘောရှိသောအကြောင်း”။",
    holding: "မုဆိုးမသည် ကွယ်လွန်သူ၏ကြွေးမြီရလိုမှုတွင် အမွေထိန်းလက်မှတ် လိုအပ်သည်။",
    headnotes: ["Limitation Act Section 14", "Succession Certificate"],
    legalIssues: ["ကာလစည်းကမ်းသတ် ကင်းလွတ်ခွင့်"],
    parties: { plaintiff: "U Htay Aung", defendant: "Daw Khin Htar Yi" },
    content: "မြန်မာဓလေ့ထုံးတမ်းဥပဒေအရ လင် သို့မဟုတ် မယားကွယ်လွန်သောအခါ ကျန်ရစ်သူသည် လင်မယားပိုင်ပစ္စည်းတွင် ကွယ်လွန်သူ၏ အကျိုးသက်ဆိုင်ခွင့်ကို မိသားစုအဖြစ်ဆက်ခံခြင်း (by survivorship) မဟုတ်ဘဲ အမွေကြောင်းအရ ဆက်ခံသည်။"
  },
  {
    id: "2021-mlr-civil-5",
    caseName: "ဒေါ်နန္ဒမာလာ (ခ) ဒေါ်ထံဏီဝင်းပြည့် နှင့် ဒေါ်နေဇင်မြင့်",
    caseNameEnglish: "Daw Nanda Mala vs. Daw Nay Zin Myint",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၄၄",
    court: "Supreme Court of the Union",
    judges: ["U Khin Maung Gyi"],
    date: "2021-12-28",
    caseType: "Civil",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "တရားမကျင့်ထုံးဥပဒေအမိန့် ၁၁၊ နည်းဥပဒေ ၁ အရ မေးမြန်းချက် များ တင်သွင်းမှုအပေါ် ကန့်ကွက်ရာ၌ ဆောင်ရွက်ရမည့် နည်းလမ်း။",
    holding: "မေးခွန်းများဖြေဆိုရန် အမိန့်ချမှတ်သည့်အခါ မေးခွန်းမေးမြန်းခံရသည့် တစ်ဖက်အမှုသည်က ကန့်ကွက်လိုလျှင် အမိန့် ၁၁၊ နည်းဥပဒေ ၆ အရ ဖြေဆိုချက်အဖြစ် တင်သွင်းသော ကျမ်းကျိန်လွှာတွင် ထည့်သွင်းကန့်ကွက်နိုင်သည်။",
    headnotes: ["Civil Procedure Code Order 11", "Interrogatories"],
    legalIssues: ["မေးမြန်းချက်လွှာ ကန့်ကွက်ခြင်း"],
    parties: { plaintiff: "Daw Nanda Mala", defendant: "Daw Nay Zin Myint" },
    content: "တရားမပုံစံအမှတ် ၅၀ ဖြင့် မေးခွန်းများဖြေဆိုရန် အမိန့်ချမှတ်သည့်အခါ မေးခွန်းမေးမြန်းခံရသည့် တစ်ဖက်အမှုသည်က ကန့်ကွက်လိုလျှင် အမိန့် ၁၁၊ နည်းဥပဒေ ၆ အရ ဖြေဆိုချက်အဖြစ် တင်သွင်းသော ကျမ်းကျိန်လွှာတွင် ထည့်သွင်းကန့်ကွက်နိုင်သည်။"
  },
  {
    id: "2021-mlr-civil-6",
    caseName: "ဦးဥတ္တရ (၎င်း၏အခွင့်ရကိုယ်စားလှယ် ဦးခင်မောင်တင့်) နှင့် ဦးစိုးနိုင် ပါ ၃",
    caseNameEnglish: "U Uttara vs. U Soe Naing + 3",
    citation: "၂၀၂၁ ခုနှစ်၊ မတစ (တရားမ)၊ စာ - ၅၀",
    court: "Supreme Court of the Union",
    judges: ["U Tin Hone"],
    date: "2021-03-11",
    caseType: "Civil",
    sourcePdfName: "2021_Myanmar_Law_Reports.pdf",
    extractionDate: new Date().toISOString(),
    extractedSuccessfully: true,
    extractionConfidence: 100,
    status: 'GOOD_LAW',
    summary: "အယူခံရုံးသည် နှစ်ဖက်အမှုသည်များအား လျှောက်လဲတင်ပြခွင့် မပေးဘဲ အချက်အလက်တစ်ရပ်ကို ဖော်ထုတ်၍ အမှုကို ဆုံးဖြတ်ပါက တရားမကျင့်ထုံးဥပဒေအမိန့် ၄၁၊ နည်းဥပဒေ ၂၄ အရ လုပ်ပိုင်ခွင့်ကို ကျင့်သုံးရာတွင် နည်းလမ်းတကျ ကျင့်သုံးရာရောက် မရောက်။",
    holding: "လျှောက်လဲတင်ပြခွင့်မပြုဘဲ အဆုံးအဖြတ်ပေးခြင်းသည် ဥပဒေနှင့်မညီ။",
    headnotes: ["Civil Procedure Code Order 41", "Appellate Procedure"],
    legalIssues: ["အယူခံရုံး၏ လုပ်ပိုင်ခွင့်"],
    parties: { plaintiff: "U Uttara", defendant: "U Soe Naing" },
    content: "အယူခံရုံးက ချမှတ်သည့်အကြောင်းပြချက်အရ ထိခိုက်နစ်နာမည့်အမှုသည်အား ထိုအကြောင်းပြချက်နှင့်စပ်လျဉ်း၍ လျှောက်လဲတင်ပြခွင့်မပြုခဲ့လျှင် တရားမကျင့်ထုံးဥပဒေအမိန့် ၄၁၊ နည်းဥပဒေ ၂ ပါ ပြဋ္ဌာန်းချက်ကို လိုက်နာရာမရောက်ပေ။"
  }
];

// 2. USERS
const SEED_USERS: User[] = [
  {
    id: "admin-1",
    email: "tzathaw.95@gmail.com", 
    password: "W@termelon123",
    name: "System Administrator",
    role: "ADMIN",
    subscriptionExpiry: "2099-12-31T00:00:00.000Z",
    isTrial: false,
    isBanned: false,
    createdAt: new Date().toISOString(),
    folders: [],
    savedCaseIds: []
  },
  {
    id: "admin-user-demo",
    email: "admin@myanlex.com",
    password: "password123",
    name: "Demo Admin",
    role: "ADMIN",
    subscriptionExpiry: "2030-01-01T00:00:00.000Z",
    isTrial: false,
    isBanned: false,
    createdAt: new Date().toISOString(),
    savedCaseIds: [],
    folders: []
  },
  {
    id: "demo-user",
    email: "user@example.com",
    password: "password123",
    name: "Demo User",
    role: "USER",
    subscriptionExpiry: "2025-12-31T00:00:00.000Z",
    isTrial: true,
    isBanned: false,
    createdAt: new Date().toISOString(),
    savedCaseIds: [],
    folders: []
  }
];

// 3. ORGS
const SEED_ORGS: Organization[] = [
  {
    id: "org-1",
    name: "Myanmar Legal Associates",
    adminUserId: "admin-1",
    members: ["admin-1"],
    maxSeats: 5,
    sharedCaseIds: [],
    plan: "TEAM_ENTERPRISE"
  }
];

// 4. CONFIG
const DEFAULT_CONFIG: BillingConfig = {
  kbz: {
    name: "Myanlex Services",
    phone: "09977123456"
  },
  wave: {
    name: "Myanlex Services",
    phone: "09977123456"
  },
  support: {
    phone: "09977123456",
    email: "support@myanlex.com"
  },
  plans: [
    { id: "basic", title: "Monthly", price: "25,000 MMK" },
    { id: "pro", title: "Yearly", price: "250,000 MMK", isPopular: true },
    { id: "team", title: "Team (3 Seats)", price: "600,000 MMK" }
  ]
};

// 5. RESOURCES (Statutes, Dict, Templates - Small enough for LocalStorage)
const SEED_STATUTES: Statute[] = [
  {
    id: "st-1",
    title: "The Penal Code",
    titleMm: "ရာဇသတ်ကြီး",
    year: "1861",
    category: "Criminal Law",
    description: "The main criminal code of Myanmar."
  },
  {
    id: "st-2",
    title: "The Code of Civil Procedure",
    titleMm: "တရားမကျင့်ထုံးဥပဒေ",
    year: "1909",
    category: "Civil Law",
    description: "Procedural law for civil litigation."
  }
];

const SEED_DICTIONARY: DictionaryTerm[] = [
  {
    id: "dt-1",
    term: "Res Judicata",
    definitionMm: "စီရင်ပြီးသောအမှု",
    definitionEn: "A matter that has been adjudicated by a competent court and may not be pursued further by the same parties.",
    category: "Civil Procedure"
  },
  {
    id: "dt-2",
    term: "Mens Rea",
    definitionMm: "ပြစ်မှုကျူးလွန်လိုသောစိတ်",
    definitionEn: "The intention or knowledge of wrongdoing that constitutes part of a crime.",
    category: "Criminal Law"
  }
];

const SEED_TEMPLATES: LegalTemplate[] = [
  {
    id: "tmp-1",
    title: "General Power of Attorney",
    category: "Civil",
    description: "Standard template for granting general power of attorney.",
    format: "DOCX"
  },
  {
    id: "tmp-2",
    title: "Sale and Purchase Agreement (Land)",
    category: "Property",
    description: "Agreement for the sale of land and property.",
    format: "DOCX"
  }
];

// --- INDEXED DB UTILS ---

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_CASES)) {
                db.createObjectStore(STORE_CASES, { keyPath: "id" });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            console.error("IndexedDB Error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

const idbGetAll = async <T>(storeName: string): Promise<T[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
    });
};

const idbPut = async <T>(storeName: string, item: T): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const idbDelete = async (storeName: string, key: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// --- INITIALIZATION ---

export const initDatabase = async (): Promise<void> => {
    if (MEMORY_CACHE.isInitialized) return;

    try {
        console.log("Initializing Database...");
        let cases = await idbGetAll<LegalCase>(STORE_CASES);
        
        if (cases.length === 0) {
            console.log("Database empty. Seeding...");
            // Seed DB
            for (const c of SEED_CASES) {
                await idbPut(STORE_CASES, c);
            }
            cases = SEED_CASES;
        }
        
        MEMORY_CACHE.cases = cases;
        MEMORY_CACHE.isInitialized = true;
        console.log(`Database Initialized. Loaded ${cases.length} cases into memory.`);
    } catch (error) {
        console.error("Database initialization failed:", error);
        // Fallback to seeds if IDB fails completely
        MEMORY_CACHE.cases = SEED_CASES; 
    }
};

// --- CASES (SYNC ACCESS VIA MEMORY CACHE) ---

export const getCases = (): LegalCase[] => {
  // If not initialized yet (rare in App flow), return what we have (likely empty or seeds)
  return MEMORY_CACHE.cases;
};

export const saveCase = (newCase: LegalCase) => {
  // 1. Update Memory Cache (Sync) -> UI updates immediately
  const index = MEMORY_CACHE.cases.findIndex(c => c.id === newCase.id);
  if (index >= 0) {
    MEMORY_CACHE.cases[index] = newCase;
  } else {
    MEMORY_CACHE.cases.unshift(newCase);
  }

  // 2. Update IndexedDB (Async) -> Persist to disk
  idbPut(STORE_CASES, newCase).catch(err => console.error("Failed to persist case:", err));
};

export const batchUpdateCaseStatuses = (updates: { id: string; status: CitationStatus }[]) => {
  const updateMap = new Map(updates.map(u => [u.id, u.status]));
  
  // Update Cache
  MEMORY_CACHE.cases = MEMORY_CACHE.cases.map(c => {
    if (updateMap.has(c.id)) {
      const updated = { ...c, status: updateMap.get(c.id)! };
      // Fire and forget update
      idbPut(STORE_CASES, updated); 
      return updated;
    }
    return c;
  });
};

export const searchCases = (query: string): LegalCase[] => {
  const cases = getCases();
  if (!query.trim()) return cases; 
  
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(t => t.trim().length > 0);
  
  const hasBoolean = terms.includes('and') || terms.includes('or') || terms.includes('not');
  if (hasBoolean) {
     return cases.filter(c => {
         const text = (c.caseName + " " + c.citation + " " + c.summary + " " + c.content).toLowerCase();
          const orGroups = query.split(' OR ');
          return orGroups.some(group => {
              const andTerms = group.split(' AND ');
              return andTerms.every(term => {
                  if (term.includes('NOT ')) {
                      const [positive, negative] = term.split(' NOT ');
                      const posMatch = positive.trim() === '' || text.includes(positive.trim().toLowerCase());
                      const negMatch = text.includes(negative.trim().toLowerCase());
                      return posMatch && !negMatch;
                  }
                  return text.includes(term.trim().toLowerCase());
              });
          });
     });
  }

  const scoredResults = cases.map(c => {
      let score = 0;
      const titleLower = c.caseName.toLowerCase();
      const citationLower = c.citation.toLowerCase();
      const courtLower = c.court.toLowerCase();
      const summaryLower = c.summary.toLowerCase();
      const contentLower = c.content.toLowerCase();

      if (titleLower.includes(lowerQuery)) score += 100;
      if (citationLower.includes(lowerQuery)) score += 100;

      let matchesAllTerms = true;
      
      terms.forEach(term => {
          let termScore = 0;
          let foundInDoc = false;

          if (titleLower.includes(term) || citationLower.includes(term) || courtLower.includes(term)) {
              termScore += 20;
              foundInDoc = true;
          }
          if (summaryLower.includes(term) || (c.headnotes && c.headnotes.some(h => h.toLowerCase().includes(term)))) {
              termScore += 10;
              foundInDoc = true;
          }
          if (contentLower.includes(term)) {
              termScore += 1;
              foundInDoc = true;
          }

          if (!foundInDoc) {
              matchesAllTerms = false;
          }
          
          score += termScore;
      });

      if (!matchesAllTerms) return null;

      return { case: c, score };
  }).filter(item => item !== null) as { case: LegalCase, score: number }[];

  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.map(item => item.case);
};

export const getCaseById = (id: string): LegalCase | undefined => {
  return getCases().find(c => c.id === id);
};

export const clearDatabase = () => {
  // Clear Memory
  MEMORY_CACHE.cases = SEED_CASES;
  
  // Clear Disk
  openDB().then(db => {
      const tx = db.transaction(STORE_CASES, 'readwrite');
      tx.objectStore(STORE_CASES).clear();
      // Re-seed
      SEED_CASES.forEach(c => idbPut(STORE_CASES, c));
  });
};

// --- USERS (Keep in LocalStorage - Small Data) ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(DB_KEY_USERS);
  if (!stored) {
    localStorage.setItem(DB_KEY_USERS, JSON.stringify(SEED_USERS));
    return SEED_USERS;
  }
  
  const parsedUsers = JSON.parse(stored) as User[];
  
  // AUTO-RECOVER ADMIN: Check if seed users exist in stored users
  let needsUpdate = false;
  const emailMap = new Set(parsedUsers.map(u => u.email.toLowerCase()));

  SEED_USERS.forEach(seedUser => {
      if (!emailMap.has(seedUser.email.toLowerCase())) {
          parsedUsers.push(seedUser);
          needsUpdate = true;
      }
  });

  if (needsUpdate) {
      localStorage.setItem(DB_KEY_USERS, JSON.stringify(parsedUsers));
  }

  return parsedUsers;
};

export const saveUser = (user: User) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
  
  const currentUserStr = localStorage.getItem("myanlex_current_user");
  if(currentUserStr) {
      const currentUser = JSON.parse(currentUserStr);
      if(currentUser.id === user.id) {
          localStorage.setItem("myanlex_current_user", JSON.stringify(user));
      }
  }
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const createFolder = (userId: string, folderName: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    if (!user.folders) user.folders = [];
    
    user.folders.push({
        id: `folder-${Date.now()}`,
        name: folderName,
        dateCreated: new Date().toISOString(),
        caseIds: []
    });

    saveUser(user);
    return user;
};

export const addCaseToFolder = (userId: string, folderId: string, caseId: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.folders) return null;

    const folder = user.folders.find(f => f.id === folderId);
    if (!folder) return null;

    if (!folder.caseIds.includes(caseId)) {
        folder.caseIds.push(caseId);
        saveUser(user);
    }
    return user;
};

export const removeCaseFromFolder = (userId: string, folderId: string, caseId: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.folders) return null;

    const folder = user.folders.find(f => f.id === folderId);
    if (!folder) return null;

    folder.caseIds = folder.caseIds.filter(id => id !== caseId);
    saveUser(user);
    return user;
};

export const toggleSavedCase = (userId: string, caseId: string): User | null => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  
  if (!user) return null;

  if (!user.folders || user.folders.length === 0) {
      user.folders = [{
          id: `default-${userId}`,
          name: "General Saved",
          dateCreated: new Date().toISOString(),
          caseIds: []
      }];
  }

  const defaultFolder = user.folders[0];
  const idx = defaultFolder.caseIds.indexOf(caseId);
  
  if (idx >= 0) {
      defaultFolder.caseIds.splice(idx, 1);
  } else {
      defaultFolder.caseIds.push(caseId);
  }

  saveUser(user);
  return user;
};

// --- ORGS & CONFIG (LocalStorage) ---

export const getOrganizations = (): Organization[] => {
  const stored = localStorage.getItem(DB_KEY_ORGS);
  if (!stored) {
    localStorage.setItem(DB_KEY_ORGS, JSON.stringify(SEED_ORGS));
    return SEED_ORGS;
  }
  return JSON.parse(stored);
};

export const getOrganizationById = (id: string): Organization | undefined => {
  return getOrganizations().find(o => o.id === id);
};

export const saveOrganization = (org: Organization) => {
  const orgs = getOrganizations();
  const index = orgs.findIndex(o => o.id === org.id);
  if (index >= 0) {
    orgs[index] = org;
  } else {
    orgs.push(org);
  }
  localStorage.setItem(DB_KEY_ORGS, JSON.stringify(orgs));
};

export const createOrganizationForUser = (user: User, firmName: string): User => {
    const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: firmName,
        adminUserId: user.id,
        members: [user.id],
        maxSeats: 3, 
        plan: "TEAM_STARTER",
        sharedCaseIds: []
    };
    saveOrganization(newOrg);
    
    const updatedUser = { ...user, organizationId: newOrg.id };
    saveUser(updatedUser);
    return updatedUser;
};

export const addMemberToOrganization = (orgId: string, name: string, email: string): { success: boolean, msg?: string } => {
  const existingUser = getUserByEmail(email);
  if (existingUser) return { success: false, msg: "User already exists in system." };

  const org = getOrganizationById(orgId);
  if (!org) return { success: false, msg: "Organization not found." };
  
  if (org.members.length >= org.maxSeats) return { success: false, msg: "Max seats reached. Upgrade plan." };

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password: "password123",
    role: 'USER',
    subscriptionExpiry: "2025-12-31T00:00:00.000Z",
    isTrial: false,
    savedCaseIds: [],
    folders: [{ id: `f-${Date.now()}`, name: "My Research", dateCreated: new Date().toISOString(), caseIds: [] }],
    organizationId: org.id,
    createdAt: new Date().toISOString()
  };
  
  saveUser(newUser);

  org.members.push(newUser.id);
  saveOrganization(org);

  return { success: true, msg: "Member added successfully." };
};

export const toggleSharedCase = (orgId: string, caseId: string): Organization | null => {
  const org = getOrganizationById(orgId);
  if (!org) return null;

  if (!org.sharedCaseIds) org.sharedCaseIds = [];
  
  const idx = org.sharedCaseIds.indexOf(caseId);
  if (idx >= 0) {
    org.sharedCaseIds.splice(idx, 1);
  } else {
    org.sharedCaseIds.push(caseId);
  }
  
  saveOrganization(org);
  return org;
};

export const getConfig = (): BillingConfig => {
  const stored = localStorage.getItem(DB_KEY_CONFIG);
  
  const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  if (!config.support) config.support = DEFAULT_CONFIG.support;
  if (!config.plans) config.plans = DEFAULT_CONFIG.plans;
  
  return config;
};

export const saveConfig = (config: BillingConfig) => {
  localStorage.setItem(DB_KEY_CONFIG, JSON.stringify(config));
};

export const getAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem(DB_KEY_ANNOUNCEMENTS);
  return stored ? JSON.parse(stored) : [];
};

export const saveAnnouncement = (announcement: Announcement) => {
  const list = getAnnouncements();
  list.unshift(announcement);
  localStorage.setItem(DB_KEY_ANNOUNCEMENTS, JSON.stringify(list));
};

export const deleteAnnouncement = (id: string) => {
  const list = getAnnouncements();
  const newList = list.filter(a => a.id !== id);
  localStorage.setItem(DB_KEY_ANNOUNCEMENTS, JSON.stringify(newList));
};

export const getTickets = (): SupportTicket[] => {
  const stored = localStorage.getItem(DB_KEY_TICKETS);
  return stored ? JSON.parse(stored) : [];
};

export const saveTicket = (ticket: SupportTicket) => {
  const list = getTickets();
  list.unshift(ticket);
  localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(list));
};

export const updateTicketStatus = (id: string, status: 'OPEN' | 'RESOLVED') => {
  const list = getTickets();
  const index = list.findIndex(t => t.id === id);
  if (index >= 0) {
    list[index].status = status;
    localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(list));
  }
};

export const deleteTicket = (id: string) => {
  const list = getTickets();
  const newList = list.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY_TICKETS, JSON.stringify(newList));
};

export const getStatutes = (): Statute[] => {
  const stored = localStorage.getItem(DB_KEY_STATUTES);
  if (!stored) {
    localStorage.setItem(DB_KEY_STATUTES, JSON.stringify(SEED_STATUTES));
    return SEED_STATUTES;
  }
  return JSON.parse(stored);
};

export const saveStatute = (statute: Statute) => {
  const list = getStatutes();
  const index = list.findIndex(s => s.id === statute.id);
  if (index >= 0) list[index] = statute;
  else list.unshift(statute);
  localStorage.setItem(DB_KEY_STATUTES, JSON.stringify(list));
};

export const deleteStatute = (id: string) => {
  const list = getStatutes();
  const newList = list.filter(s => s.id !== id);
  localStorage.setItem(DB_KEY_STATUTES, JSON.stringify(newList));
};

export const getDictionaryTerms = (query: string): DictionaryTerm[] => {
  const stored = localStorage.getItem(DB_KEY_DICTIONARY);
  let allTerms: DictionaryTerm[] = [];
  
  if (!stored) {
    localStorage.setItem(DB_KEY_DICTIONARY, JSON.stringify(SEED_DICTIONARY));
    allTerms = SEED_DICTIONARY;
  } else {
    allTerms = JSON.parse(stored);
  }

  if (!query) return allTerms;
  const q = query.toLowerCase();
  return allTerms.filter(t => 
    t.term.toLowerCase().includes(q) || 
    t.definitionEn.toLowerCase().includes(q) ||
    t.definitionMm.includes(q)
  );
};

export const saveDictionaryTerm = (term: DictionaryTerm) => {
  const stored = localStorage.getItem(DB_KEY_DICTIONARY);
  let list: DictionaryTerm[] = stored ? JSON.parse(stored) : SEED_DICTIONARY;
  
  const index = list.findIndex(t => t.id === term.id);
  if (index >= 0) list[index] = term;
  else list.unshift(term);
  
  localStorage.setItem(DB_KEY_DICTIONARY, JSON.stringify(list));
};

export const deleteDictionaryTerm = (id: string) => {
  const stored = localStorage.getItem(DB_KEY_DICTIONARY);
  let list: DictionaryTerm[] = stored ? JSON.parse(stored) : SEED_DICTIONARY;
  const newList = list.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY_DICTIONARY, JSON.stringify(newList));
};

export const getTemplates = (): LegalTemplate[] => {
  const stored = localStorage.getItem(DB_KEY_TEMPLATES);
  if (!stored) {
    localStorage.setItem(DB_KEY_TEMPLATES, JSON.stringify(SEED_TEMPLATES));
    return SEED_TEMPLATES;
  }
  return JSON.parse(stored);
};

export const saveTemplate = (template: LegalTemplate) => {
  const list = getTemplates();
  const index = list.findIndex(t => t.id === template.id);
  if (index >= 0) list[index] = template;
  else list.unshift(template);
  localStorage.setItem(DB_KEY_TEMPLATES, JSON.stringify(list));
};

export const deleteTemplate = (id: string) => {
  const list = getTemplates();
  const newList = list.filter(t => t.id !== id);
  localStorage.setItem(DB_KEY_TEMPLATES, JSON.stringify(newList));
};
