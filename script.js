// ===== Global Variables =====
let formData = {};
let savedRecords = [];
const DB_NAME = 'SchoolSupportDB';
const DB_VERSION = 1;
const STORE_NAME = 'records';
const OWNER_ACCESS_KEY = 'ownerAccess';
const OWNER_ACCESS_CODE = 'CHANGE_ME';

// ===== IndexedDB Setup =====
let db;

// ===== Week Date Ranges Mapping =====
const weekDateRanges = {
    'الأسبوع الأول - ٢٠٢٦/٠١/١٨ إلى ٢٠٢٦/٠١/٢٢': { start: '2026-01-18', end: '2026-01-22' },
    'الأسبوع الثاني - ٢٠٢٦/٠١/٢٥ إلى ٢٠٢٦/٠١/٢٩': { start: '2026-01-25', end: '2026-01-29' },
    'الأسبوع الثالث - ٢٠٢٦/٠٢/٠٢ إلى ٢٠٢٦/٠٢/٠٦': { start: '2026-02-02', end: '2026-02-06' },
    'الأسبوع الرابع - ٢٠٢٦/٠٢/٠٩ إلى ٢٠٢٦/٠٢/١٢': { start: '2026-02-09', end: '2026-02-12' },
    'الأسبوع الخامس - ٢٠٢٦/٠٢/١٥ إلى ٢٠٢٦/٠٢/١٩': { start: '2026-02-15', end: '2026-02-19' },
    'الأسبوع السادس - ٢٠٢٦/٠٢/٢٢ إلى ٢٠٢٦/٠٢/٢٦': { start: '2026-02-22', end: '2026-02-26' },
    'الأسبوع السابع - ٢٠٢٦/٠٣/٠١ إلى ٢٠٢٦/٠٣/٠٥': { start: '2026-03-01', end: '2026-03-05' },
    'الأسبوع الثامن - ٢٠٢٦/٠٣/٢٩ إلى ٢٠٢٦/٠٤/٠٢': { start: '2026-03-29', end: '2026-04-02' },
    'الأسبوع التاسع - ٢٠٢٦/٠٤/٠٥ إلى ٢٠٢٦/٠٤/٠٩': { start: '2026-04-05', end: '2026-04-09' },
    'الأسبوع العاشر - ٢٠٢٦/٠٤/١٢ إلى ٢٠٢٦/٠٤/١٦': { start: '2026-04-12', end: '2026-04-16' },
    'الأسبوع الحادي عشر - ٢٠٢٦/٠٤/١٩ إلى ٢٠٢٦/٠٤/٢٣': { start: '2026-04-19', end: '2026-04-23' },
    'الأسبوع الثاني عشر - ٢٠٢٦/٠٤/٢٦ إلى ٢٠٢٦/٠٤/٣٠': { start: '2026-04-26', end: '2026-04-30' },
    'الأسبوع الثالث عشر - ٢٠٢٦/٠٥/٠٣ إلى ٢٠٢٦/٠٥/٠٧': { start: '2026-05-03', end: '2026-05-07' },
    'الأسبوع الرابع عشر - ٢٠٢٦/٠٥/١٠ إلى ٢٠٢٦/٠٥/١٤': { start: '2026-05-10', end: '2026-05-14' },
    'الأسبوع الخامس عشر - ٢٠٢٦/٠٥/١٧ إلى ٢٠٢٦/٠٥/٢١': { start: '2026-05-17', end: '2026-05-21' },
    'الأسبوع السادس عشر - ٢٠٢٦/٠٥/٣١ إلى ٢٠٢٦/٠٦/٠٤': { start: '2026-05-31', end: '2026-06-04' },
    'الأسبوع السابع عشر - ٢٠٢٦/٠٦/٠٧ إلى ٢٠٢٦/٠٦/١١': { start: '2026-06-07', end: '2026-06-11' },
    'الأسبوع الثامن عشر - ٢٠٢٦/٠٦/١٤ إلى ٢٠٢٦/٠٦/١٨': { start: '2026-06-14', end: '2026-06-18' },
    'الأسبوع التاسع عشر - ٢٠٢٦/٠٦/٢١ إلى ٢٠٢٦/٠٦/٢٥': { start: '2026-06-21', end: '2026-06-25' },
    'الأسبوع العشرون - ٢٠٢٦/٠٦/٢٨ إلى ٢٠٢٦/٠٧/٠٢': { start: '2026-06-28', end: '2026-07-02' }
};

// ===== Arabic Days Mapping =====
const arabicDays = {
    0: 'الأحد',
    1: 'الاثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت'
};

function isOwner() {
    return localStorage.getItem(OWNER_ACCESS_KEY) === 'true';
}

function applyOwnerState() {
    const owner = isOwner();
    document.body.classList.toggle('is-owner', owner);
    document.body.classList.toggle('owner-reveal', !owner && window.location.hash === '#owner');
}

function requireOwnerAccess(message = 'هذه الميزة متاحة للمالك فقط.') {
    if (!isOwner()) {
        showMessage(message, 'warning');
        return false;
    }
    return true;
}

function getAllSupervisors() {
    const list = [];
    Object.entries(supervisorsBySectorGender).forEach(([sector, genders]) => {
        Object.entries(genders).forEach(([gender, names]) => {
            names.forEach(name => {
                list.push({ name, sector, gender });
            });
        });
    });
    return list;
}

const supervisorsBySectorGender = {
    'الجبيل': {
        'بنين': [
            'إبراهيم بن سليمان العمرو',
            'سامي بن صالح الغامدي',
            'ناصر بن عايد الشمري',
            'علي بن ناصر الحربي'
        ],
        'بنات': [
            'ناريمان بنت عبد الوهاب الوهيبي',
            'مها بنت رزق الروضان',
            'واجد بنت علي البعيجي',
            'سميرة بنت علي الغامدي',
            'شوق بنت عبدالله الزرم',
            'قرموشه بنت مبارك الهاجري',
            'سناء بنت عبدالحليم الصبيحي'
        ]
    },
    'الخبر': {
        'بنات': [
            'ابتسام بنت عبدالله العبدالقادر',
            'ابتهال بنت ناصر الكبش',
            'أمل بنت سليمان العمري',
            'آمنه بنت علي تويتي',
            'بدريه بنت عبدالعزيز الجلعود',
            'تركية بنت محمد المالكي',
            'جملاء بنت رشيد السليمي',
            'خولة بنت سعد المدرع',
            'سهام بنت عيسى البريك',
            'شروق بنت محمود العثمان',
            'شريفة بنت عبدالله العمر',
            'عزه بنت صالح الزهراني',
            'غادة بنت منصور العسكر',
            'فريال بنت صالح الدوسري',
            'لمياء بنت محمد الدرويش',
            'مريم بنت حمدي الروقي',
            'مشاعل بنت سليمان العيدي',
            'زينة بنت عائض القحطاني',
            'ناهد بنت محمد الفزيع',
            'نسرين بنت عبدالله حلواني'
        ],
        'بنين': [
            'تركي بن عبداللطيف السبيعي',
            'سعد بن عبد الله الدوسري',
            'محمد بن أحمد المهناء',
            'فرحان بن مسعد الشعباني',
            'عبدالله بن يحيى ضرغام',
            'عبدالله بن جزاء العنزي',
            'أحمد بن محمد القاسم',
            'محمد بن مبارك الدوسري',
            'ماجد بن محمد الجهني',
            'ابراهيم بن محمد العسيري',
            'علي بن عبدالله العمرى',
            'إبراهيم بن محمد الغامدي',
            'محمد بن مشبب الأحمري',
            'فيصل بن أحمد الغامدي',
            'سالم بن مطلق القحطاني',
            'خالد بن علي الشامي',
            'بندر بن عبداللطيف الجمعان',
            'سليمان بن أحمد السويد',
            'أنور بن أحمد المقهوي',
            'سامي بن عبدالله العبدالسلام',
            'محمد بن عبدالإله السبحي',
            'زياد بن سعد العامر',
            'محمد بن خليل الغامدي',
            'محمد بن عبدالرحمن الزهراني',
            'عبدالهادي بن محمد المطيري',
            'أحمد بن عبدالله الخضر',
            'وليد بن محمد بوعايشه',
            'خالد بن يحيى الجحدلي',
            'عبدالله بن محمد الوليدي',
            'نايف بن عيسى الشدي',
            'عبدالله بن محمد العسيري',
            'محمد بن خالد الخضير',
            'يوسف بن سعدون السعدون',
            'محمد بن علي القحطاني',
            'أسعد بن عمران العمران',
            'مانع بن عبدالله القرني',
            'فؤاد بن أحمد الزهراني',
            'عبدالله بن عبدالعزيز البطيح',
            'عبدالله بن محمد الشهري',
            'ماهر بن عبدالعزيز التمار',
            'محمد بن أحمد العبود',
            'صالح بن محمد القرني',
            'عيظه بن محمد الزهراني'
        ]
    },
    'الخفجي': {
        'بنين': [
            'منصور بن مخضر المضيبري',
            'علي بن جمعان السبيعي',
            'محمد بن عبدالله المطيري',
            'نايف بن عنيد الخالدي',
            'سالم بن خلف البقعاوي',
            'احمد بن خلف البقعاوي',
            'إبراهيم بن حسين الأعجم',
            'خالد بن محمد المطيري',
            'عبدالعزيز بن عسيكر المطيري'
        ],
        'بنات': [
            'مها بنت ابداح المطيري',
            'فريدة بنت ذياب الشمري',
            'سلوى بنت علي الظلعي',
            'نورة بنت طرجم السبيعي',
            'نورة بنت مبارك القحطاني',
            'عيدة بنت سعدون الشمري',
            'نورة بنت هديش آل فاضل',
            'دليل بنت سيف القحطاني',
            'سارة بنت هديش الفاضل',
            'شرف بنت ناصر السلولي',
            'مريم بنت سالم المري',
            'فائزة بنت لافي المهاشر',
            'صافية بنت سالم المري',
            'خلود بنت جبر الجبر',
            'امل بنت سليمان الزويمل',
            'فاطمة بنت عوض القحطاني',
            'نوير بنت حمود السبيعي',
            'نورة بنت عبد العزيز المناحي',
            'منيرة بنت حمدان الشمري'
        ]
    },
    'الدمام': {
        'بنات': [
            'سميرة بنت حمد بن راشد بالحارث',
            'فاطمة بنت عبده ميقاق',
            'نجلاء بنت احمد البسام',
            'عبير بنت خالد الصياح',
            'صبحه بنت حامد الغامدي',
            'عايشه بنت مصلح الشمراني',
            'عائشة بنت ابراهيم دراج',
            'عائشة بنت صالح الشهري',
            'أمل بنت محمد هوساوي',
            'فتحيه بنت سالم النفيعي',
            'مؤمنة بنت محمد القرني',
            'النيرة بنت حسن الحلفي',
            'أسماء بنت سعيد الشهراني',
            'ليلى بنت مزهر الزهراني',
            'نوره بنت إبراهيم العبدالهادي',
            'ابتسام بنت محمد مباركي',
            'نوال بنت عبدالرحمن اللهيبي',
            'عبير بنت سعيد الغامدي',
            'فاطمة بنت عيسى المطيري',
            'فدوى بنت منصور الدوسري',
            'نورة بنت راشد المهاشير',
            'حصة بنت ماجد السبيعي',
            'باسمة بنت محمد الراشد',
            'ولاء بنت حسن سندي',
            'مي بنت محمد السليم',
            'عالية بنت سعيد الشمراني',
            'إيمان بنت يوسف الحماد',
            'ليلى بنت أحمد الغامدي',
            'بدرية بنت عبدالله الشهري',
            'خلود بنت بكر بامسعود',
            'منيره بنت متروك الفريدي',
            'شاهه بنت خالد الخالدي',
            'زهره بنت علي مباركي',
            'البندري بنت محمد العتيبي',
            'عائشة بنت احمد الشهري',
            'مريم بنت حسن باخشوين',
            'مها بنت محمد العيسى'
        ],
        'بنين': [
            'د.أحمد بن محمد حكمي',
            'بندر بن سعيد القحطاني',
            'فهد بن محمد الشهري',
            'فائز بن علي الغامدي',
            'جهاد بن محمد آل طلحة',
            'مبارك بن فهد المرير',
            'ماهر بن عبدالعزيز العفيصان',
            'سعيد بن جروان القرني',
            'عبد المحسن بن محيميد العتيبي',
            'ثابت بن عايض القحطاني',
            'سعد بن مسفر الغامدي',
            '‏عبد العزيز بن يوسف الناس',
            'عبدالله بن مزيد العتيبي',
            'عوض بن علي القحطاني',
            'محمد بن مصنهت الدعجاني',
            'أحمد بن محمد الشامي',
            'عبدالعزيز بن راشد الطويرش',
            'عبد الرحمن بن عبدالله العوجان',
            'قاسم بن حمود مكتلي',
            'حسين بن محمد الغامدي',
            'علي بن محمد الغامدي',
            'جمعان بن محمد الغامدي',
            'حمود بن علي الميموني',
            'خالد بن جمعه الشامسي',
            'ياسر بن عبدالله العضل',
            'منصور بن صالح الزهراني',
            'عادل بن عودة العوهلي',
            'علي بن محمد الفارس',
            'أحمد بن خليفة الجميعه',
            'عبدالله بن عيسى العنزي',
            'محمد بن سعيد الشهري',
            'أحمد بن محمد الغامدي',
            'ظافر بن مشبب الأحمري',
            'علي بن عيسى الرشيد',
            'سعود بن عبدالعزيز العبيد',
            'محمد بن سحمي السبيعي',
            'إبراهيم بن حامد الغامدي',
            'محمد بن عثمان الغامدي',
            'محمد بن حمزة الشهري',
            'بدر بن محمد القحطاني',
            'حاتم بن عبدالرحيم الغامدي',
            'علي بن حسن الذياب',
            'محمد بن مهنا المعيبد',
            'عبداللطيف بن إبراهيم المحيش',
            'عبدالرحيم بن عبدالله بوبشيت',
            'عبدالرحمن بن علي الغامدي',
            'عبدالعزيز بن سالم الجهني',
            'عبدالرزاق بن يوسف العبد الرزاق',
            'رشيد بن عبدالله الزهراني',
            'مراد بن حسين الفلاح',
            'سعود بن عيسى الدوسري',
            'عبدالله بن سالم الحربي',
            'عادل بن خميس السلمة',
            'فهد بن ظافر الشهري',
            'ماهر بن عبدالرحمن السعيد',
            'خالد بن غرم الله الغامدي',
            'يعن الله بن عطية الزهراني',
            'فواز بن عبدالرحمن النعيم',
            'عادل بن عبدالله السليم',
            'حسن بن خالد الزياني',
            'هيثم بن خضير الخضير',
            'أحمد بن عبدالرحمن العبدالعظيم',
            'عبدالحميد بن مسفر الغامدي',
            'عبدالعزيز بن محمد الصائغ',
            'خلف بن محمد الغامدي',
            'علي بن ماطر العنزي',
            'جمعان بن سعيد الغامدي'
        ]
    },
    'القطيف': {
        'بنين': [
            'أحمد بن إبراهيم العبيد',
            'أحمد بن محمد شراحيلي',
            'بندر بن سعيد المسيب',
            'خالد بن محمد الشهري',
            'خليفه بن سلمان المهناء',
            'رياض بن دغش الخالدي',
            'سعيد بن يحيى القحطاني',
            'صلاح بن محمد آل مطر',
            'طارق بن إبراهيم العوده',
            'طارق بن عبدالعزيز الجامع',
            'طارق بن يوسف العصيل',
            'عبدالرحمن بن علي القحطاني',
            'عبدالله بن سالم الشهري',
            'عبدالله بن محمد بن غدرا',
            'عصام بن علي الزهراني',
            'علي بن سعد الماجد',
            'علي بن سعيد آل حارس',
            'علي بن محمد الشيتي',
            'فهد بن محمد آل رقيب',
            'فيصل بن إبراهيم العجيان',
            'فيصل بن مرزوق العتيبي',
            'ماجد بن عبدالله العمري',
            'محمد بن حسن الخميس',
            'محمد بن حمد الخالدي',
            'محمد بن سلمان الناصر',
            'محمد بن ناصر الجويسم',
            'محمد بن هندي العمري',
            'معتصم بن مسعود العبدالله',
            'نادر بن عبدالله السويكت',
            'ياسر بن سعيد القحطاني',
            'يحي بن محمد مدخلي',
            'محمد بن حسن المرزوق'
        ],
        'بنات': [
            'هيفاء بنت عبدالعزيز الشمري',
            'أسماء بنت صايل الشمري',
            'اشجان بنت عبدالرحمن الدوسري',
            'امل بنت عبدالله السبيعي',
            'امل بنت معدى القحطاني',
            'بدريه بنت يوسف العواد',
            'جوهره بنت سعود الخالدي',
            'حصة بنت عبدالرحمن الدوسري',
            'خلود بنت عبدالله الدحيم',
            'رحاب بنت علي العواد',
            'رحاب بنت محمد آل سيف',
            'روان بنت سعد العميري',
            'زينب بنت كاظم ال رضوان',
            'سامية بنت عبدالكريم الخطيب',
            'سعدية بنت عبدالله العلياني',
            'سميرة بنت سالم القحطاني',
            'سها بنت محمد السلطان',
            'سهام بنت حميد الكردي',
            'طفله بنت محمد الدوسري',
            'عائشة بنت سيف البوعينين',
            'فاطمة بنت سعد الدخيل',
            'فاطمة بنت سعيد الغامدي',
            'فوزيه بنت سعد القحطاني',
            'مريم بنت عبدالله الدوسري',
            'مكيه بنت عبدالعزيز البنعلي',
            'منى بنت حمد الخالدي',
            'نادية بنت احمد الدوسري',
            'ناهد بنت عبدالله السماعيل',
            'نشأ بنت علي الشيوخ',
            'نورة بنت عجاج الخالدى',
            'هنادي بنت صالح المطوع',
            'هويدا بنت عبدالهادي الجشي',
            'وسمية بنت علي الزاهر',
            'وفاء بنت عبدالله الشهري',
            'ولاء بنت محمد الشخص'
        ]
    },
    'النعيرية': {
        'بنات': [
            'صافيه بنت هادي المري',
            'نوف بنت سعد القحطاني'
        ],
        'بنين': []
    },
    'بقيق': {
        'بنين': [
            'مرعي بن محمد البارقي',
            'محمد بن حمد الهاجري',
            'أحمد بن خليل النصيب',
            'حمد بن محمد الحسين',
            'أسامة بن نامي الأحمدي'
        ],
        'بنات': [
            'هدى بنت ضيف الله العتيبي',
            'دلال بنت مسفر الدوسري',
            'سهام بنت مسفر الدوسري',
            'منال بنت عبيد المطيري',
            'نحاء بنت رزقان الرشيدي',
            'نوره بنت سالم النجم',
            'حصة بنت علي المري'
        ]
    },
    'رأس تنورة': {
        'بنات': [
            'عزيزة بنت سويد الغامدي',
            'صافيه بنت سالم المري',
            'عائشة بنت احمد آل نورالدين',
            'عبير بنت سالم آل حمامه'
        ],
        'بنين': [
            'حمود بن سعد الاكلبي',
            'عماد بن علي اللباد',
            'نعيم بن إبراهيم المرهون',
            'فيصل بن صالح آل لعجم'
        ]
    },
    'القرية العليا': {
        'بنين': [
            'عبدالهادي بن رجاء المطيري'
        ],
        'بنات': [
            'موضي بنت الدرزي المطيري'
        ]
    },
    'حفر الباطن': {
        'بنات': [
            'نشمية بنت رجاء العنزي',
            'عزيزه بنت علي القرني',
            'عايشة بنت عوض المطيري',
            'رحمه بنت سعيد الاحمري',
            'نورة بنت أحمد الغامدي',
            'مريم بنت سعود الشمري',
            'بهيه بنت عبدالله العتيق',
            'سلمى بنت عذبي الشمري',
            'جميله بنت دخيل العنزي',
            'قمراء بنت ثويني الشمري',
            'البندري بنت سويلم الشمري',
            'زينب بنت مرزوق الرشيدي',
            'اسماء بنت محمد الشمري',
            'فوزية بنت كرزي الشمري',
            'نوال بنت عمار الشريف',
            'نوره بنت زعال الشمري',
            'منيرة بنت مبارك السهلي',
            'بدرية بنت صالح الحميميدي',
            'ضحية بنت عليوي العنزي',
            'مشاعل بنت مضحي الشمري',
            'عيده بنت عيد العنزي',
            'ريم بنت تركي الملحم',
            'مريم بنت سعد المطيري',
            'مهاء بنت مزيد العفاسي',
            'أمل بنت عبدالله المطيري',
            'أمل بنت عايض المطيري',
            'خلود بنت خليوي الشمري',
            'موضي بنت ثاني الشمري',
            'دليل بنت محمد القحطاني',
            'مها بنت سعيد الزهراني',
            'نوره بنت مدهوس المطيري',
            'أميرة بنت دهيسان الحربي',
            'حمده بنت سعد الرشيدي',
            'شيمة بنت عبدالله المطيري',
            'العنود بنت محمد المقبل',
            'جواهر بنت مطر العنزي',
            'نوف بنت سعد المطيري',
            'شيخه بنت محسن الحربي',
            'ريم بنت هزاع الشمري',
            'خزنه بنت ناصر العنزي',
            'مشاعل فلاح المطيري',
            'نشميه بنت راشد الجميعه',
            'ريسة بنت محمد العمري',
            'هناء بنت منفل العنزي',
            'شريفه بنت عائض العسيري',
            'بدريه بنت حميدي العنزي',
            'عبير بنت عايض بن المطيري',
            'ليلى بنت محمد العفاسي',
            'ساره بنت مقبل الحربي',
            'بدور بنت مزعل الظفيري',
            'جوزاء بنت منصور الرشيدي',
            'امل بنت عامر العنزي',
            'وفاء بنت مشعان الشمري',
            'وفاء بنت صالح القصيّر',
            'طفله بنت عبدالله العنزي',
            'بدريه بنت صاهود الرويلي',
            'مريفه بنت دهيش الزبني',
            'مها بنت فيصل المطيري',
            'عيده عريفان مطير السليمانى',
            'فضة بنت علي المطيري',
            'ميثاء بنت سليمان الخمسان',
            'رنا بنت شمران الشمري',
            'ريم بنت هادي اليامي',
            'فاطمة بنت مصبح الظفيري',
            'لطيفة بنت ردام الشمري',
            'غزيه بنت زعال الشمري',
            'العنود بنت عشق المطيري',
            'ساره بنت ناهض السهلي'
        ],
        'بنين': [
            'سعد بن مفرح حجي الحربي',
            'عويض بن مطر وني الهزيمي',
            'فهد بن عيد راشد العنزي',
            'عواد بن صغير عوض العنزي',
            'محمد بن عويض المطيري',
            'حماد بن عوض الحربي',
            'إبراهيم بن عبدالله الخلف',
            'عماش بن صعب السهلي',
            'بندر بن شاهر الشمري',
            'صالح بن مزلوه العنزي',
            'حمود بن العاصي الهذال',
            'إبراهيم بن صالح السليمان',
            'نادر بن محمد الشمري',
            'علي بن خليف العنزي',
            'عادل بن عوض السرور',
            'محمد بن سعد المطيري',
            'عبدالسلام بن عوض القحطاني',
            'سعد بن نافع العنزي',
            'عبدالعزيز بن عامر العامر',
            'مبارك بن محسن الحربي',
            'ناصر بن سعد الرشيدي',
            'عبدالرحمن بن مقحم المطيري',
            'سعود بن مشيل الظفيري',
            'فهد بن خلف الجميلي',
            'شامان بن فيحان البرازي',
            'سليمان بن خلف الشمري',
            'مبارك بن ظاهر الظفيري',
            'عيد بن رمضان العنزي',
            'منديل بن سعود الحربي',
            'سند بن مشيل الظفيري',
            'عايش بن محارب العنزي',
            'بدر بن غلاب الحربي',
            'خالد بن عايد الشمري',
            'محمد بن سهل العنزي',
            'محمد بن فريح العنزي',
            'محمد بن صالح الطيار',
            'مبارك بن متعب الظفيري',
            'صالح بن عبدالله الاحمدي',
            'عبيد بن شافي العنزي',
            'عبدالله بن مفلح الشمري',
            'نواف بن حمد الشمري',
            'سلمان بن بطاح الظفيري',
            'مسعود بن حماد البذالي',
            'محمد بن خلف الشمري',
            'فرحان بن عايش العنزي',
            'عايد بن عوده الدهمشي',
            'خلف بن مطلق الجميلي',
            '‏أحمد بن عبدالله الخلف',
            'عبدالله بن حمدان السعيدي',
            'فايز بن صالح الدهمشي',
            'شافي بن عايد الظفيري',
            'حسين بن نداء العنزي',
            'حجي بن مفرح الحربي',
            'عبدالله بن صفوق المطيري',
            'جدلان بن هزاع بن المريخي',
            'وليد بن عوض السرور',
            'حبيب بن غازي الشمري',
            'د. عمر بن رمضان العنزي',
            'سعيد بن عبدالرحمن المطيري',
            'لافي بن عشبان السعيدي',
            'حمدان بن نايف الشمري',
            'حمدان بن مقبل الحربي',
            'محمد بن سيد الظفيري',
            'خالد بن هليل العنزي',
            'سليمان بن شليويح الزبني',
            'مطر بن رحيل الشمري',
            'سعود بن محمد العوفي',
            'خالد بن حمد العنزي',
            'محمد بن طرقي العنزي',
            'عبدالله بن محمد الحربي',
            'مطلق بن محمد السبيعي',
            'محمد بن عبدالله الشمري',
            'مشعل بن حميد الهزيمي',
            'عودة بن مذري العنزي',
            'زبن بن مفرح الشمري',
            'مذكر بن هديان البصيص',
            'عزيز بن دخيل الظفيري',
            'علي بن عالي بن المطيري',
            'فارس بن مهل الحربي',
            'خالد بن مزعل الشمري',
            'ساير بن مناور الشمري',
            'خلف بن صالح السرور',
            'عبدالله بن عبدالرحمن المطيري',
            'عبدالله بن سليمان العلوي'
        ]
    }
};

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('فشل في فتح قاعدة البيانات');
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('تم فتح قاعدة البيانات بنجاح');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { 
                    keyPath: 'id', 
                    autoIncrement: true 
                });
                
                objectStore.createIndex('date', 'date', { unique: false });
                objectStore.createIndex('week', 'week', { unique: false });
                objectStore.createIndex('school', 'mainSchool', { unique: false });
                objectStore.createIndex('sector', 'sector', { unique: false });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                
                console.log('تم إنشاء قاعدة البيانات');
            }
        };
    });
}

// ===== Save Record to IndexedDB =====
function saveRecord(record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        record.timestamp = new Date().toISOString();
        const request = objectStore.add(record);
        
        request.onsuccess = () => {
            console.log('تم حفظ السجل بنجاح');
            showMessage('تم حفظ البيانات بنجاح! ✅', 'success');
            resolve(request.result);
        };
        
        request.onerror = () => {
            console.error('فشل في حفظ السجل');
            showMessage('فشل في حفظ البيانات! ❌', 'error');
            reject(request.error);
        };
    });
}

// ===== Get All Records from IndexedDB =====
function getAllRecords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
            resolve(request.result);
        };
        
        request.onerror = () => {
            reject(request.error);
        };
    });
}

// ===== Delete Record from IndexedDB =====
function deleteRecord(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);
        
        request.onsuccess = () => {
            showMessage('تم حذف السجل بنجاح! ✅', 'success');
            resolve();
        };
        
        request.onerror = () => {
            showMessage('فشل في حذف السجل! ❌', 'error');
            reject(request.error);
        };
    });
}

// ===== DOM Elements =====
const form = document.getElementById('mainForm');
const saveBtn = document.getElementById('saveBtn');
const previewBtn = document.getElementById('previewBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const printBtn = document.getElementById('printBtn');
const resetBtn = document.getElementById('resetBtn');
const viewRecordsBtn = document.getElementById('viewRecordsBtn');
const exportAllExcelBtn = document.getElementById('exportAllExcelBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.querySelector('.close');
const recordsList = document.getElementById('recordsList');
const recordsBody = document.getElementById('recordsBody');
const ownerLogoutBtn = document.getElementById('ownerLogout');
const ownerLoginBtn = document.getElementById('ownerLogin');
const ownerOnlySections = document.querySelectorAll('.owner-only');
const statsSectorFilter = document.getElementById('statsSectorFilter');
const statsWeekFilter = document.getElementById('statsWeekFilter');
const statsDayFilter = document.getElementById('statsDayFilter');
const statsDateFilter = document.getElementById('statsDateFilter');
const statsSortBy = document.getElementById('statsSortBy');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');
const clearStatsFiltersBtn = document.getElementById('clearStatsFiltersBtn');
const statsBody = document.getElementById('statsBody');
const statsSummary = document.getElementById('statsSummary');
const showStatsBtn = document.getElementById('showStatsBtn');
const ownerStatsSection = document.getElementById('ownerStats');

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        setupEventListeners();
        if (form) {
            setupConditionalFields();
            updateSupervisorOptions();
        }
        loadOwnerConfig();
        applyOwnerAccessRules();
        initOwnerVisibility();
        initOwnerStatsFilters();
        setupConditionalFields();
        applyOwnerState();
        if (isOwner()) {
            updateSupervisorStats();
        }
        
        // Disable date input initially
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.disabled = true;
        }
        
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        showMessage('حدث خطأ في تحميل التطبيق! ❌', 'error');
    }
});

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Form submission prevention
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
        });
    }
    
    // Button event listeners
    saveBtn.addEventListener('click', handleSave);
    previewBtn.addEventListener('click', handlePreview);
    exportPdfBtn.addEventListener('click', handleExportPDF);
    printBtn.addEventListener('click', handlePrint);
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', handleExportExcel);
    }
    resetBtn.addEventListener('click', handleReset);
    viewRecordsBtn.addEventListener('click', handleViewRecords);
    exportAllExcelBtn.addEventListener('click', handleExportAllExcel);
    
    // Modal close
    closeModal.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // Week selection - update date range
    const weekSelect = document.getElementById('week');
    weekSelect.addEventListener('change', handleWeekChange);

    const sectorSelect = document.getElementById('sector');
    const genderSelect = document.getElementById('gender');

    if (sectorSelect && genderSelect) {
        sectorSelect.addEventListener('change', updateSupervisorOptions);
        genderSelect.addEventListener('change', updateSupervisorOptions);
    }

    const ownerPasswordSave = document.getElementById('ownerPasswordSave');
    const scheduleSave = document.getElementById('scheduleSave');

    if (ownerPasswordSave) {
        ownerPasswordSave.addEventListener('click', handleOwnerPasswordSave);
    }

    if (scheduleSave) {
        scheduleSave.addEventListener('click', handleScheduleSave);
    }

    if (ownerLogoutBtn) {
        ownerLogoutBtn.addEventListener('click', handleOwnerLogout);
    }

    if (ownerLoginBtn) {
        ownerLoginBtn.addEventListener('click', attemptOwnerLogin);
    }

    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', handleRefreshStats);
    }

    if (clearStatsFiltersBtn) {
        clearStatsFiltersBtn.addEventListener('click', handleClearStatsFilters);
    }

    if (showStatsBtn) {
        showStatsBtn.addEventListener('click', handleShowStats);
    }
    
    // Date selection - update day automatically
    const dateInput = document.getElementById('date');
    dateInput.addEventListener('change', handleDateChange);
    dateInput.addEventListener('input', handleDateChange);

    // Sector/gender selection - update supervisor list
    const sectorSelect = document.getElementById('sector');
    const genderSelect = document.getElementById('gender');
    sectorSelect.addEventListener('change', updateSupervisorOptions);
    genderSelect.addEventListener('change', updateSupervisorOptions);

    const ownerLoginBtn = document.getElementById('ownerLoginBtn');
    const ownerLogoutBtn = document.getElementById('ownerLogoutBtn');
    const refreshStatsBtn = document.getElementById('refreshStatsBtn');

    if (ownerLoginBtn) {
        ownerLoginBtn.addEventListener('click', handleOwnerLogin);
    }
    if (ownerLogoutBtn) {
        ownerLogoutBtn.addEventListener('click', handleOwnerLogout);
    }
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', handleRefreshStats);
    }

    window.addEventListener('hashchange', applyOwnerState);
    
    // Support areas checkboxes
    const supportAreasCheckboxes = document.querySelectorAll('input[name="supportAreas"]');
    if (supportAreasCheckboxes.length > 0) {
        supportAreasCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleSupportAreasChange);
        });
    }
    
    // Other checkboxes with "other" option
    setupOtherCheckboxes('supportAreas', 'supportAreasOther', 'supportAreasOtherText');
    setupOtherCheckboxes('teachingActions', 'teachingActionsOther', 'teachingActionsOtherText');
    setupOtherCheckboxes('outcomesActions', 'outcomesActionsOther', 'outcomesActionsOtherText');
    setupOtherCheckboxes('guidanceActions', 'guidanceActionsOther', 'guidanceActionsOtherText');
    setupOtherCheckboxes('activityActions', 'activityActionsOther', 'activityActionsOtherText');
    setupOtherCheckboxes('empowerment', 'empowermentOther', 'empowermentOtherText');
}

function initOwnerVisibility() {
    const isOwner = isOwnerSessionActive();
    setOwnerVisibility(isOwner);

    if (window.location.hash === '#owner') {
        attemptOwnerLogin();
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'o') {
            attemptOwnerLogin();
        }
    });
}

function isOwnerSessionActive() {
    const config = getOwnerConfig();
    const session = sessionStorage.getItem(OWNER_SESSION_KEY);
    return Boolean(config.passwordHash && session === config.passwordHash);
}

function setOwnerVisibility(isOwner) {
    ownerOnlySections.forEach(section => {
        section.style.display = isOwner ? '' : 'none';
    });

    if (!isOwner && ownerStatsSection) {
        ownerStatsSection.classList.add('stats-hidden');
    }
}

async function attemptOwnerLogin() {
    const config = getOwnerConfig();
    if (!config.passwordHash) {
        setOwnerVisibility(true);
        showMessage('يرجى تعيين كلمة مرور للمالك أولاً. ⚠️', 'warning');
        return;
    }

    const hasAccess = await requireOwnerAccess();
    if (hasAccess) {
        handleRefreshStats();
    }
}

function handleOwnerLogout() {
    sessionStorage.removeItem(OWNER_SESSION_KEY);
    setOwnerVisibility(false);
    showMessage('تم تسجيل خروج المالك بنجاح. ✅', 'success');
}

function initOwnerStatsFilters() {
    if (!statsSectorFilter || !statsWeekFilter || !statsDayFilter) {
        return;
    }

    const sectorOptions = Object.keys(supervisorsBySectorGender).sort();
    sectorOptions.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        statsSectorFilter.appendChild(option);
    });

    Object.keys(weekDateRanges).forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = week;
        statsWeekFilter.appendChild(option);
    });

    Object.values(arabicDays).forEach(day => {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        statsDayFilter.appendChild(option);
    });
}

async function handleRefreshStats() {
    if (!statsBody) {
        return;
    }

    const hasAccess = await requireOwnerAccess();
    if (!hasAccess) {
        return;
    }

    const records = await getAllRecords();
    const filters = {
        sector: statsSectorFilter?.value || '',
        week: statsWeekFilter?.value || '',
        day: statsDayFilter?.value || '',
        date: statsDateFilter?.value || ''
    };

    const stats = buildSupervisorStats(records, filters);
    const sortedStats = sortSupervisorStats(stats, statsSortBy?.value || 'name');
    renderStatsTable(sortedStats);
    renderStatsSummary(sortedStats);
}

async function handleShowStats() {
    const hasAccess = await requireOwnerAccess();
    if (!hasAccess) {
        return;
    }

    if (ownerStatsSection) {
        ownerStatsSection.classList.remove('stats-hidden');
        ownerStatsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    handleRefreshStats();
}

function handleClearStatsFilters() {
    if (statsSectorFilter) statsSectorFilter.value = '';
    if (statsWeekFilter) statsWeekFilter.value = '';
    if (statsDayFilter) statsDayFilter.value = '';
    if (statsDateFilter) statsDateFilter.value = '';
    if (statsSortBy) statsSortBy.value = 'name';
    handleRefreshStats();
}

function buildSupervisorCatalog() {
    const catalog = [];
    Object.entries(supervisorsBySectorGender).forEach(([sector, genders]) => {
        Object.entries(genders).forEach(([gender, names]) => {
            names.forEach(name => {
                catalog.push({ name, sector, gender });
            });
        });
    });
    return catalog;
}

function buildSupervisorStats(records, filters) {
    const catalog = buildSupervisorCatalog();

    return catalog.map(supervisor => {
        const matchingRecords = records.filter(record => {
            if (record.supervisor !== supervisor.name) {
                return false;
            }
            if (filters.sector && record.sector !== filters.sector) {
                return false;
            }
            if (filters.week && record.week !== filters.week) {
                return false;
            }
            if (filters.day && record.day !== filters.day) {
                return false;
            }
            if (filters.date && record.date !== filters.date) {
                return false;
            }
            return true;
        });

        const lastRecord = matchingRecords.reduce((latest, current) => {
            if (!latest) {
                return current;
            }
            return (current.date || '') > (latest.date || '') ? current : latest;
        }, null);

        const count = matchingRecords.length;

        return {
            name: supervisor.name,
            sector: supervisor.sector,
            gender: supervisor.gender,
            count,
            lastDate: lastRecord?.date || '—',
            lastWeek: lastRecord?.week || '—',
            lastDay: lastRecord?.day || '—',
            status: count > 0 ? 'تمت التعبئة' : 'لم تعبأ'
        };
    });
}

function sortSupervisorStats(stats, sortBy) {
    const sorted = [...stats];
    const compareText = (a, b, key) => String(a[key]).localeCompare(String(b[key]), 'ar');
    const compareDate = (a, b) => {
        const dateA = a.lastDate === '—' ? '' : a.lastDate;
        const dateB = b.lastDate === '—' ? '' : b.lastDate;
        return dateB.localeCompare(dateA);
    };

    switch (sortBy) {
        case 'sector':
            sorted.sort((a, b) => compareText(a, b, 'sector') || compareText(a, b, 'name'));
            break;
        case 'week':
            sorted.sort((a, b) => compareText(a, b, 'lastWeek') || compareText(a, b, 'name'));
            break;
        case 'day':
            sorted.sort((a, b) => compareText(a, b, 'lastDay') || compareText(a, b, 'name'));
            break;
        case 'date':
            sorted.sort((a, b) => compareDate(a, b) || compareText(a, b, 'name'));
            break;
        case 'count':
            sorted.sort((a, b) => b.count - a.count || compareText(a, b, 'name'));
            break;
        default:
            sorted.sort((a, b) => compareText(a, b, 'name'));
            break;
    }

    return sorted;
}

function renderStatsTable(stats) {
    if (!statsBody) {
        return;
    }

    statsBody.innerHTML = '';

    stats.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.sector}</td>
            <td>${item.gender}</td>
            <td>${item.count}</td>
            <td>${item.lastDate}</td>
            <td>${item.lastWeek}</td>
            <td>${item.lastDay}</td>
            <td>${item.status}</td>
        `;
        statsBody.appendChild(row);
    });
}

function renderStatsSummary(stats) {
    if (!statsSummary) {
        return;
    }

    const totalSupervisors = stats.length;
    const completed = stats.filter(item => item.count > 0).length;
    const remaining = totalSupervisors - completed;
    const totalSubmissions = stats.reduce((sum, item) => sum + item.count, 0);

    statsSummary.innerHTML = `
        <div>إجمالي المشرفين/ات: <strong>${totalSupervisors}</strong></div>
        <div>المعبئون/ات: <strong>${completed}</strong></div>
        <div>غير المعبئين/ات: <strong>${remaining}</strong></div>
        <div>إجمالي مرات التعبئة: <strong>${totalSubmissions}</strong></div>
    `;
}

function loadOwnerConfig() {
    const storedConfig = localStorage.getItem(OWNER_CONFIG_KEY);
    if (storedConfig) {
        try {
            const config = JSON.parse(storedConfig);
            const scheduleEnabled = document.getElementById('scheduleEnabled');
            const scheduleDay = document.getElementById('scheduleDay');
            const scheduleTime = document.getElementById('scheduleTime');
            const scheduleDuration = document.getElementById('scheduleDuration');

            if (scheduleEnabled) scheduleEnabled.value = config.scheduleEnabled || 'yes';
            if (scheduleDay) scheduleDay.value = config.scheduleDay ?? '0';
            if (scheduleTime) scheduleTime.value = config.scheduleTime || '08:00';
            if (scheduleDuration) scheduleDuration.value = config.scheduleDuration || 24;
        } catch (error) {
            console.error('خطأ في تحميل إعدادات المالك:', error);
        }
    }
}

function handleOwnerPasswordSave() {
    const passwordInput = document.getElementById('ownerPassword');
    const confirmInput = document.getElementById('ownerPasswordConfirm');

    if (!passwordInput || !confirmInput) {
        return;
    }

    const password = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();

    if (!password || !confirm) {
        showMessage('يرجى إدخال كلمة المرور وتأكيدها. ⚠️', 'warning');
        return;
    }

    if (password !== confirm) {
        showMessage('كلمة المرور وتأكيدها غير متطابقين. ⚠️', 'warning');
        return;
    }

    const config = getOwnerConfig();
    config.passwordHash = btoa(password);
    localStorage.setItem(OWNER_CONFIG_KEY, JSON.stringify(config));
    passwordInput.value = '';
    confirmInput.value = '';
    showMessage('تم حفظ كلمة المرور بنجاح. ✅', 'success');
}

function handleScheduleSave() {
    const scheduleEnabled = document.getElementById('scheduleEnabled');
    const scheduleDay = document.getElementById('scheduleDay');
    const scheduleTime = document.getElementById('scheduleTime');
    const scheduleDuration = document.getElementById('scheduleDuration');

    if (!scheduleEnabled || !scheduleDay || !scheduleTime || !scheduleDuration) {
        return;
    }

    const config = getOwnerConfig();
    config.scheduleEnabled = scheduleEnabled.value;
    config.scheduleDay = scheduleDay.value;
    config.scheduleTime = scheduleTime.value;
    config.scheduleDuration = Number(scheduleDuration.value || 24);
    localStorage.setItem(OWNER_CONFIG_KEY, JSON.stringify(config));

    applyOwnerAccessRules();
    showMessage('تم تحديث جدول الإتاحة. ✅', 'success');
}

function getOwnerConfig() {
    const storedConfig = localStorage.getItem(OWNER_CONFIG_KEY);
    if (storedConfig) {
        try {
            return JSON.parse(storedConfig);
        } catch (error) {
            console.error('خطأ في قراءة إعدادات المالك:', error);
        }
    }
    return {
        scheduleEnabled: 'yes',
        scheduleDay: '0',
        scheduleTime: '08:00',
        scheduleDuration: 24,
        passwordHash: ''
    };
}

function applyOwnerAccessRules() {
    const config = getOwnerConfig();
    const scheduleStatus = document.getElementById('scheduleStatus');
    const isAllowed = isFormOpen(config);

    if (scheduleStatus) {
        scheduleStatus.textContent = isAllowed
            ? 'الاستمارة متاحة حاليًا حسب الجدول.'
            : 'الاستمارة مغلقة حاليًا حسب الجدول.';
    }

    setFormAvailability(isAllowed);
}

function isFormOpen(config) {
    if (!config || config.scheduleEnabled === 'no') {
        return true;
    }

    const now = new Date();
    const currentDay = String(now.getDay());
    if (currentDay !== String(config.scheduleDay)) {
        return false;
    }

    const [hour, minute] = (config.scheduleTime || '08:00').split(':').map(Number);
    const start = new Date(now);
    start.setHours(hour || 0, minute || 0, 0, 0);
    const durationHours = Number(config.scheduleDuration || 24);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    return now >= start && now <= end;
}

function setFormAvailability(isAllowed) {
    const form = document.getElementById('mainForm');
    const formActions = document.querySelector('.form-actions');
    const message = document.getElementById('availabilityMessage');

    if (!form) {
        return;
    }

    if (!isAllowed) {
        form.querySelectorAll('input, select, textarea, button').forEach(element => {
            if (!element.closest('#ownerPanel')) {
                element.disabled = true;
            }
        });
        if (formActions) {
            formActions.style.display = 'none';
        }
        if (!message) {
            const notice = document.createElement('div');
            notice.id = 'availabilityMessage';
            notice.className = 'message message-warning';
            notice.textContent = 'الاستمارة غير متاحة حاليًا. يرجى المحاولة لاحقًا.';
            form.parentElement.insertBefore(notice, form);
        }
    } else {
        form.querySelectorAll('input, select, textarea, button').forEach(element => {
            if (!element.closest('#ownerPanel')) {
                element.disabled = false;
            }
        });
        if (formActions) {
            formActions.style.display = '';
        }
        if (message) {
            message.remove();
        }
    }
}

async function requireOwnerAccess() {
    const config = getOwnerConfig();
    if (!config.passwordHash) {
        showMessage('يرجى تعيين كلمة مرور للمالك أولاً. ⚠️', 'warning');
        return false;
    }

    const session = sessionStorage.getItem(OWNER_SESSION_KEY);
    if (session === config.passwordHash) {
        setOwnerVisibility(true);
        return true;
    }

    const password = prompt('أدخل كلمة مرور المالك للوصول إلى السجلات:');
    if (!password) {
        return false;
    }

    if (btoa(password) !== config.passwordHash) {
        showMessage('كلمة المرور غير صحيحة. ❌', 'error');
        return false;
    }

    sessionStorage.setItem(OWNER_SESSION_KEY, config.passwordHash);
    setOwnerVisibility(true);
    return true;
}

// ===== Handle Week Change =====
function handleWeekChange() {
    const weekSelect = document.getElementById('week');
    const dateInput = document.getElementById('date');
    const dateNote = document.getElementById('dateNote');
    const dayInput = document.getElementById('day');
    
    const selectedWeek = weekSelect.value;
    
    if (selectedWeek && weekDateRanges[selectedWeek]) {
        const range = weekDateRanges[selectedWeek];
        
        // Set min and max for date input
        dateInput.min = range.start;
        dateInput.max = range.end;
        dateInput.disabled = false;
        dateInput.setCustomValidity('');
        
        // Update note
        const startDate = formatDateArabic(range.start);
        const endDate = formatDateArabic(range.end);
        dateNote.textContent = `يمكنك اختيار تاريخ من ${startDate} إلى ${endDate}`;
        dateNote.style.color = '#17a2b8';
        
        // Reset date and day if current date is outside range
        if (dateInput.value) {
            const currentDate = dateInput.value;
            if (currentDate < range.start || currentDate > range.end) {
                dateInput.value = '';
                dayInput.value = '';
                dateInput.setCustomValidity('يرجى اختيار تاريخ ضمن نطاق الأسبوع المحدد.');
            } else {
                updateDayFromDate(currentDate, dayInput);
            }
        }
    } else {
        // Reset if no week selected
        dateInput.min = '';
        dateInput.max = '';
        dateInput.disabled = true;
        dateInput.value = '';
        dateInput.setCustomValidity('');
        dayInput.value = '';
        dateNote.textContent = 'اختر الأسبوع الدراسي أولاً';
        dateNote.style.color = '#6c757d';
    }
}

function updateDayFromDate(dateValue, dayInput) {
    const selectedDate = new Date(`${dateValue}T00:00:00`);
    const dayIndex = selectedDate.getDay();
    dayInput.value = arabicDays[dayIndex];
}

// ===== Handle Date Change =====
function handleDateChange() {
    const dateInput = document.getElementById('date');
    const dayInput = document.getElementById('day');
    const weekSelect = document.getElementById('week');
    
    if (dateInput.value) {
        // Validate date is within week range
        const selectedWeek = weekSelect.value;
        if (selectedWeek && weekDateRanges[selectedWeek]) {
            const range = weekDateRanges[selectedWeek];
            if (dateInput.value < range.start || dateInput.value > range.end) {
                showMessage('التاريخ المختار خارج نطاق الأسبوع المحدد! ⚠️', 'warning');
                dateInput.value = '';
                dayInput.value = '';
                dateInput.setCustomValidity('يرجى اختيار تاريخ ضمن نطاق الأسبوع المحدد.');
                return;
            }
        }

        dateInput.setCustomValidity('');
        updateDayFromDate(dateInput.value, dayInput);
    } else {
        dayInput.value = '';
        dateInput.setCustomValidity('');
    }
}

function updateSupervisorOptions() {
    const sectorSelect = document.getElementById('sector');
    const genderSelect = document.getElementById('gender');
    const supervisorSelect = document.getElementById('supervisor');

    const selectedSector = sectorSelect.value;
    const selectedGender = genderSelect.value;

    supervisorSelect.innerHTML = '';

    if (!selectedSector || !selectedGender) {
        supervisorSelect.disabled = true;
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'اختر القطاع والنوع أولاً';
        supervisorSelect.appendChild(option);
        return;
    }

    const sectorData = supervisorsBySectorGender[selectedSector] || {};
    const supervisors = sectorData[selectedGender] || [];

    supervisorSelect.disabled = false;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'اختر اسم المشرف/ة';
    supervisorSelect.appendChild(placeholder);

    if (supervisors.length === 0) {
        const emptyOption = document.createElement('option');
        emptyOption.value = 'لا يوجد';
        emptyOption.textContent = 'لا يوجد مشرفون/مشرفات لهذا الاختيار';
        supervisorSelect.appendChild(emptyOption);
        supervisorSelect.value = 'لا يوجد';
        return;
    }

    supervisors.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        supervisorSelect.appendChild(option);
    });
}

function handleOwnerLogin() {
    const ownerCodeInput = document.getElementById('ownerCode');
    if (!ownerCodeInput) {
        return;
    }

    if (OWNER_ACCESS_CODE === 'CHANGE_ME') {
        showMessage('يرجى تحديث رمز المالك في إعدادات النظام أولاً.', 'warning');
        return;
    }

    if (ownerCodeInput.value.trim() === OWNER_ACCESS_CODE) {
        localStorage.setItem(OWNER_ACCESS_KEY, 'true');
        ownerCodeInput.value = '';
        applyOwnerState();
        showMessage('تم تسجيل الدخول كمالك بنجاح. ✅', 'success');
        handleRefreshStats();
    } else {
        showMessage('رمز المالك غير صحيح.', 'error');
    }
}

function handleOwnerLogout() {
    localStorage.removeItem(OWNER_ACCESS_KEY);
    applyOwnerState();
    showMessage('تم تسجيل الخروج من وضع المالك.', 'success');
}

function handleRefreshStats() {
    if (!requireOwnerAccess('هذه الإحصائية متاحة للمالك فقط.')) {
        return;
    }
    updateSupervisorStats();
}

function updateSupervisorStats() {
    const statsBody = document.getElementById('statsBody');
    if (!statsBody) {
        return;
    }

    getAllRecords().then(records => {
        const filterWeek = document.getElementById('filterWeek')?.value || '';
        const filterDay = document.getElementById('filterDay')?.value || '';
        const filterSector = document.getElementById('filterSector')?.value || '';
        const filterDate = document.getElementById('filterDate')?.value || '';

        const filtered = records.filter(record => {
            if (filterWeek && record.week !== filterWeek) return false;
            if (filterDay && record.day !== filterDay) return false;
            if (filterSector && record.sector !== filterSector) return false;
            if (filterDate && record.date !== filterDate) return false;
            return true;
        });

        const counts = new Map();
        filtered.forEach(record => {
            const key = `${record.supervisor || 'غير محدد'}|${record.sector || ''}|${record.gender || ''}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        const supervisors = getAllSupervisors();
        statsBody.innerHTML = '';

        supervisors.forEach(({ name, sector, gender }) => {
            const key = `${name}|${sector}|${gender}`;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${name}</td>
                <td>${sector}</td>
                <td>${gender}</td>
                <td>${counts.get(key) || 0}</td>
            `;
            statsBody.appendChild(row);
        });
    });
}

// ===== Format Date in Arabic =====
function formatDateArabic(dateString) {
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ===== Setup Conditional Fields =====
function setupConditionalFields() {
    // School type conditional fields
    const schoolTypeSelect = document.getElementById('schoolType');
    const mainSchoolGroup = document.getElementById('mainSchoolGroup');
    const additionalSchoolGroup = document.getElementById('additionalSchoolGroup');
    
    schoolTypeSelect.addEventListener('change', () => {
        if (schoolTypeSelect.value === 'المدرسة الإضافية لتقديم الدعم') {
            additionalSchoolGroup.style.display = 'flex';
        } else {
            additionalSchoolGroup.style.display = 'none';
            document.getElementById('additionalSchool').value = '';
        }
    });
    
    // E-learning conditional field
    const elearningSelect = document.getElementById('elearning');
    const elearningReasonGroup = document.getElementById('elearningReasonGroup');
    
    elearningSelect.addEventListener('change', () => {
        if (elearningSelect.value === 'لا') {
            elearningReasonGroup.style.display = 'flex';
        } else {
            elearningReasonGroup.style.display = 'none';
            document.getElementById('elearningReason').value = '';
        }
    });
}

function updateSupervisorOptions() {
    const sectorSelect = document.getElementById('sector');
    const genderSelect = document.getElementById('gender');
    const supervisorSelect = document.getElementById('supervisor');

    if (!sectorSelect || !genderSelect || !supervisorSelect) {
        return;
    }

    const sector = sectorSelect.value;
    const gender = genderSelect.value;

    supervisorSelect.innerHTML = '';

    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = sector && gender ? 'اختر المشرف/ة' : 'اختر القطاع والنوع أولاً';
    supervisorSelect.appendChild(placeholderOption);

    if (!sector || !gender) {
        supervisorSelect.disabled = true;
        return;
    }

    const supervisors = supervisorsBySectorGender[sector]?.[gender] || [];
    supervisorSelect.disabled = false;

    if (supervisors.length === 0) {
        const noneOption = document.createElement('option');
        noneOption.value = 'لا يوجد';
        noneOption.textContent = 'لا يوجد';
        supervisorSelect.appendChild(noneOption);
        return;
    }

    supervisors.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        supervisorSelect.appendChild(option);
    });
}

// ===== Setup Other Checkboxes =====
function setupOtherCheckboxes(groupName, otherId, otherTextId) {
    const otherCheckbox = document.getElementById(otherId);
    const otherTextInput = document.getElementById(otherTextId);
    
    if (otherCheckbox && otherTextInput) {
        otherCheckbox.addEventListener('change', () => {
            if (otherCheckbox.checked) {
                otherTextInput.style.display = 'block';
            } else {
                otherTextInput.style.display = 'none';
                otherTextInput.value = '';
            }
        });
    }
}

// ===== Handle Support Areas Change =====
function handleSupportAreasChange(e) {
    const teachingSection = document.getElementById('teachingSection');
    const outcomesSection = document.getElementById('outcomesSection');
    const guidanceSection = document.getElementById('guidanceSection');
    const activitySection = document.getElementById('activitySection');
    
    const checkedValues = Array.from(document.querySelectorAll('input[name="supportAreas"]:checked'))
        .map(cb => cb.value);
    
    teachingSection.style.display = checkedValues.includes('التدريس') ? 'block' : 'none';
    outcomesSection.style.display = checkedValues.includes('نواتج التعلم') ? 'block' : 'none';
    guidanceSection.style.display = checkedValues.includes('التوجيه الطلابي') ? 'block' : 'none';
    activitySection.style.display = checkedValues.includes('النشاط الطلابي') ? 'block' : 'none';
}

// ===== Collect Form Data =====
function collectFormData() {
    const data = {};
    
    // Basic fields
    const basicFields = ['week', 'date', 'day', 'taskType', 'sector', 'gender', 'supervisor', 'stage', 
                         'schoolType', 'mainSchool', 'additionalSchool', 'serviceType',
                         'elearning', 'elearningReason', 'participation', 'experiences',
                         'initiatives', 'challenges', 'treatments', 'recommendations', 'suggestions',
                         'teachingCount', 'outcomesCount', 'guidanceCount', 'activityCount'];
    
    basicFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            data[field] = element.value;
        }
    });
    
    // Checkbox fields
    data.supportAreas = getCheckedValues('supportAreas');
    data.teachingActions = getCheckedValues('teachingActions');
    data.outcomesActions = getCheckedValues('outcomesActions');
    data.guidanceActions = getCheckedValues('guidanceActions');
    data.activityActions = getCheckedValues('activityActions');
    data.empowerment = getCheckedValues('empowerment');
    
    return data;
}

// ===== Get Checked Values =====
function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    const values = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.value === 'other') {
            const otherTextId = `${name}OtherText`;
            const otherText = document.getElementById(otherTextId);
            if (otherText && otherText.value) {
                values.push(`غير ذلك: ${otherText.value}`);
            }
        } else {
            values.push(checkbox.value);
        }
    });
    
    return values;
}

// ===== Validate Form =====
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalidField = null;
    
    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.style.borderColor = 'var(--danger-color)';
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.style.borderColor = 'var(--border-color)';
        }
    });
    
    // Check if at least one support area is selected
    const supportAreas = document.querySelectorAll('input[name="supportAreas"]:checked');
    if (supportAreas.length === 0) {
        isValid = false;
        showMessage('يجب اختيار مجال دعم واحد على الأقل! ⚠️', 'warning');
    }
    
    // Check if at least one empowerment option is selected
    const empowerment = document.querySelectorAll('input[name="empowerment"]:checked');
    if (empowerment.length === 0) {
        isValid = false;
        showMessage('يجب اختيار خيار واحد على الأقل من تمكين المدرسة! ⚠️', 'warning');
    }
    
    if (!isValid && firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField.focus();
        showMessage('يرجى ملء جميع الحقول المطلوبة! ⚠️', 'warning');
    }
    
    return isValid;
}

// ===== Handle Save =====
async function handleSave() {
    if (!validateForm()) {
        return;
    }
    
    try {
        formData = collectFormData();
        await saveRecord(formData);
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
        showMessage('حدث خطأ في حفظ البيانات! ❌', 'error');
    }
}

// ===== Handle Preview =====
function handlePreview() {
    if (!validateForm()) {
        return;
    }
    
    formData = collectFormData();
    const previewHTML = generatePreviewHTML(formData);
    document.getElementById('previewContent').innerHTML = previewHTML;
    previewModal.style.display = 'block';
}

// ===== Generate Preview HTML =====
function generatePreviewHTML(data) {
    let html = `
        <div class="preview-header">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="logo2.png" 
                     alt="شعار وزارة التعليم" 
                     style="max-height: 120px; width: auto; object-fit: contain;">
            </div>
            <h1>استمارة خدمات دعم التميز المدرسي</h1>
            <p>وزارة التعليم - إدارة التعليم بالمنطقة الشرقية</p>
            <p>العام الدراسي ١٤٤٧هـ - ٢٠٢٦م</p>
        </div>
    `;
    
    // Basic Information Section
    html += `
        <div class="preview-section">
            <h3>📋 المعلومات الأساسية</h3>
            <div class="preview-field"><strong>الأسبوع الدراسي:</strong> ${data.week}</div>
            <div class="preview-field"><strong>التاريخ:</strong> ${data.date}</div>
            <div class="preview-field"><strong>اليوم:</strong> ${data.day}</div>
            <div class="preview-field"><strong>المهمة:</strong> ${data.taskType}</div>
            <div class="preview-field"><strong>القطاع:</strong> ${data.sector}</div>
            <div class="preview-field"><strong>النوع:</strong> ${data.gender}</div>
            <div class="preview-field"><strong>المشرف/ة:</strong> ${data.supervisor}</div>
            <div class="preview-field"><strong>المرحلة:</strong> ${data.stage}</div>
            <div class="preview-field"><strong>نوع المدرسة:</strong> ${data.schoolType}</div>
            <div class="preview-field"><strong>اسم المدرسة:</strong> ${data.mainSchool}</div>
            ${data.additionalSchool ? `<div class="preview-field"><strong>المدرسة الإضافية:</strong> ${data.additionalSchool}</div>` : ''}
            <div class="preview-field"><strong>نوع الخدمة:</strong> ${data.serviceType}</div>
        </div>
    `;
    
    // Support Areas Section
    if (data.supportAreas.length > 0) {
        html += `
            <div class="preview-section">
                <h3>📊 مجالات الدعم الرئيسة</h3>
                <ul>
                    ${data.supportAreas.map(area => `<li>${area}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Teaching Field Section
    if (data.teachingActions && data.teachingActions.length > 0) {
        html += `
            <div class="preview-section">
                <h3>📚 مجال التدريس</h3>
                <div class="preview-field"><strong>الإجراءات المنفذة:</strong></div>
                <ul>
                    ${data.teachingActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
                <div class="preview-field"><strong>عدد الإجراءات:</strong> ${data.teachingCount || 0}</div>
            </div>
        `;
    }
    
    // Learning Outcomes Field Section
    if (data.outcomesActions && data.outcomesActions.length > 0) {
        html += `
            <div class="preview-section">
                <h3>🎯 مجال نواتج التعلم</h3>
                <div class="preview-field"><strong>الإجراءات المنفذة:</strong></div>
                <ul>
                    ${data.outcomesActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
                <div class="preview-field"><strong>عدد الإجراءات:</strong> ${data.outcomesCount || 0}</div>
            </div>
        `;
    }
    
    // Student Guidance Field Section
    if (data.guidanceActions && data.guidanceActions.length > 0) {
        html += `
            <div class="preview-section">
                <h3>🧭 مجال التوجيه الطلابي</h3>
                <div class="preview-field"><strong>الإجراءات المنفذة:</strong></div>
                <ul>
                    ${data.guidanceActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
                <div class="preview-field"><strong>عدد الإجراءات:</strong> ${data.guidanceCount || 0}</div>
            </div>
        `;
    }
    
    // Student Activities Field Section
    if (data.activityActions && data.activityActions.length > 0) {
        html += `
            <div class="preview-section">
                <h3>🎨 مجال النشاط الطلابي</h3>
                <div class="preview-field"><strong>الإجراءات المنفذة:</strong></div>
                <ul>
                    ${data.activityActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
                <div class="preview-field"><strong>عدد الإجراءات:</strong> ${data.activityCount || 0}</div>
            </div>
        `;
    }
    
    // School Empowerment Section
    html += `
        <div class="preview-section">
            <h3>💡 تمكين المدرسة</h3>
            <div class="preview-field"><strong>مساهمة الإجراءات في التمكين:</strong></div>
            <ul>
                ${data.empowerment.map(item => `<li>${item}</li>`).join('')}
            </ul>
            <div class="preview-field"><strong>تفعيل منصة مدرستي:</strong> ${data.elearning}</div>
            ${data.elearningReason ? `<div class="preview-field"><strong>سبب عدم التفعيل:</strong> ${data.elearningReason}</div>` : ''}
            <div class="preview-field"><strong>مدى مشاركة المدرسة:</strong> ${data.participation}</div>
        </div>
    `;
    
    // Additional Information Section
    html += `
        <div class="preview-section">
            <h3>📝 معلومات إضافية</h3>
            ${data.experiences ? `<div class="preview-field"><strong>الخبرات الإشرافية:</strong> ${data.experiences}</div>` : ''}
            ${data.initiatives ? `<div class="preview-field"><strong>المبادرات:</strong> ${data.initiatives}</div>` : ''}
            ${data.challenges ? `<div class="preview-field"><strong>التحديات:</strong> ${data.challenges}</div>` : ''}
            ${data.treatments ? `<div class="preview-field"><strong>المعالجات:</strong> ${data.treatments}</div>` : ''}
            ${data.recommendations ? `<div class="preview-field"><strong>التوصيات:</strong> ${data.recommendations}</div>` : ''}
            ${data.suggestions ? `<div class="preview-field"><strong>المقترحات:</strong> ${data.suggestions}</div>` : ''}
        </div>
    `;
    
    // Footer Section
    html += `
        <div class="preview-footer" style="margin-top: 40px; padding: 20px; text-align: center; background: #f8f9fa; border-radius: 10px; border-top: 3px solid #006341;">
            <p style="margin: 5px 0; color: #2c3e50; font-weight: 600;">تصميم المشرف بندر بن عبداللطيف الجمعان</p>
            <p style="margin: 5px 0; color: #6c757d;">وإشراف الفريق التنفيذي ٢٠٢٦</p>
        </div>
    `;
    
    return html;
}

// ===== Handle Export PDF =====
async function handleExportPDF() {
    if (!validateForm()) {
        return;
    }
    
    try {
        formData = collectFormData();
        const previewHTML = generatePreviewHTML(formData);
        
        // Create temporary container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = previewHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm';
        tempDiv.style.padding = '20mm';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.fontFamily = 'Tajawal, Arial, sans-serif';
        document.body.appendChild(tempDiv);
        
        // Generate PDF using html2canvas and jsPDF
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        const fileName = `استمارة_دعم_التميز_${data.date}_${data.mainSchool}.pdf`;
        pdf.save(fileName);
        
        document.body.removeChild(tempDiv);
        showMessage('تم تصدير PDF بنجاح! ✅', 'success');
        
    } catch (error) {
        console.error('خطأ في تصدير PDF:', error);
        showMessage('حدث خطأ في تصدير PDF! ❌', 'error');
    }
}

// ===== Handle Print =====
function handlePrint() {
    if (!validateForm()) {
        return;
    }
    
    formData = collectFormData();
    const previewHTML = generatePreviewHTML(formData);
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة الاستمارة</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Tajawal', Arial, sans-serif;
                    padding: 20mm;
                    line-height: 1.8;
                }
                .preview-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #006341;
                    background: #ffffff;
                    color: #2c3e50;
                }
                .preview-header img {
                    max-height: 110px;
                    width: auto;
                    margin-bottom: 15px;
                    object-fit: contain;
                }
                .preview-section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                .preview-section h3 {
                    color: #006341;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #ddd;
                }
                .preview-field {
                    margin-bottom: 10px;
                    padding: 8px;
                    background: #f8f9fa;
                    border-radius: 5px;
                }
                .preview-field strong {
                    color: #004d32;
                    display: inline-block;
                    min-width: 150px;
                }
                ul {
                    list-style-position: inside;
                    padding-right: 20px;
                    margin-top: 10px;
                }
                ul li {
                    padding: 5px;
                    margin-bottom: 3px;
                }
                @media print {
                    body { padding: 10mm; }
                    .preview-section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            ${previewHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// ===== Handle Export Excel =====
function handleExportExcel() {
    if (!requireOwnerAccess('تصدير Excel متاح للمالك فقط.')) {
        return;
    }
    if (!validateForm()) {
        return;
    }
    
    try {
        formData = collectFormData();
        
        const workbook = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const excelData = [
            ['استمارة خدمات دعم التميز المدرسي'],
            ['وزارة التعليم - إدارة التعليم بالمنطقة الشرقية'],
            ['العام الدراسي ١٤٤٧هـ - ٢٠٢٦م'],
            [],
            ['المعلومات الأساسية'],
            ['الأسبوع الدراسي', formData.week],
            ['التاريخ', formData.date],
            ['اليوم', formData.day],
            ['المهمة', formData.taskType],
            ['القطاع', formData.sector],
            ['النوع', formData.gender],
            ['المشرف/ة', formData.supervisor],
            ['المرحلة', formData.stage],
            ['نوع المدرسة', formData.schoolType],
            ['اسم المدرسة', formData.mainSchool],
            ['نوع الخدمة', formData.serviceType],
            [],
            ['مجالات الدعم الرئيسة'],
            ...formData.supportAreas.map(area => ['', area]),
            []
        ];
        
        if (formData.teachingActions && formData.teachingActions.length > 0) {
            excelData.push(['مجال التدريس']);
            excelData.push(['عدد الإجراءات', formData.teachingCount || 0]);
            formData.teachingActions.forEach(action => {
                excelData.push(['', action]);
            });
            excelData.push([]);
        }
        
        if (formData.outcomesActions && formData.outcomesActions.length > 0) {
            excelData.push(['مجال نواتج التعلم']);
            excelData.push(['عدد الإجراءات', formData.outcomesCount || 0]);
            formData.outcomesActions.forEach(action => {
                excelData.push(['', action]);
            });
            excelData.push([]);
        }
        
        if (formData.guidanceActions && formData.guidanceActions.length > 0) {
            excelData.push(['مجال التوجيه الطلابي']);
            excelData.push(['عدد الإجراءات', formData.guidanceCount || 0]);
            formData.guidanceActions.forEach(action => {
                excelData.push(['', action]);
            });
            excelData.push([]);
        }
        
        if (formData.activityActions && formData.activityActions.length > 0) {
            excelData.push(['مجال النشاط الطلابي']);
            excelData.push(['عدد الإجراءات', formData.activityCount || 0]);
            formData.activityActions.forEach(action => {
                excelData.push(['', action]);
            });
            excelData.push([]);
        }
        
        excelData.push(['تمكين المدرسة']);
        formData.empowerment.forEach(item => {
            excelData.push(['', item]);
        });
        excelData.push(['تفعيل منصة مدرستي', formData.elearning]);
        excelData.push(['مدى مشاركة المدرسة', formData.participation]);
        excelData.push([]);
        
        if (formData.experiences) excelData.push(['الخبرات الإشرافية', formData.experiences]);
        if (formData.initiatives) excelData.push(['المبادرات', formData.initiatives]);
        if (formData.challenges) excelData.push(['التحديات', formData.challenges]);
        if (formData.treatments) excelData.push(['المعالجات', formData.treatments]);
        if (formData.recommendations) excelData.push(['التوصيات', formData.recommendations]);
        if (formData.suggestions) excelData.push(['المقترحات', formData.suggestions]);
        
        const worksheet = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 30 },
            { wch: 60 }
        ];
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'استمارة دعم التميز');
        
        const fileName = `استمارة_دعم_التميز_${formData.date}_${formData.mainSchool}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showMessage('تم تصدير Excel بنجاح! ✅', 'success');
        
    } catch (error) {
        console.error('خطأ في تصدير Excel:', error);
        showMessage('حدث خطأ في تصدير Excel! ❌', 'error');
    }
}

// ===== Handle Reset =====
function handleReset() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات المدخلة؟')) {
        form.reset();
        
        // Reset date input
        const dateInput = document.getElementById('date');
        const dayInput = document.getElementById('day');
        const dateNote = document.getElementById('dateNote');
        const supervisorSelect = document.getElementById('supervisor');
        
        dateInput.min = '';
        dateInput.max = '';
        dateInput.disabled = true;
        dateInput.value = '';
        dayInput.value = '';
        dateNote.textContent = 'اختر الأسبوع الدراسي أولاً';
        dateNote.style.color = '#6c757d';

        supervisorSelect.innerHTML = '<option value="">اختر القطاع والنوع أولاً</option>';
        supervisorSelect.disabled = true;
        
        // Hide conditional sections
        document.getElementById('teachingSection').style.display = 'none';
        document.getElementById('outcomesSection').style.display = 'none';
        document.getElementById('guidanceSection').style.display = 'none';
        document.getElementById('activitySection').style.display = 'none';
        document.getElementById('additionalSchoolGroup').style.display = 'none';
        document.getElementById('elearningReasonGroup').style.display = 'none';
        
        // Hide other text inputs
        document.querySelectorAll('.other-input').forEach(input => {
            input.style.display = 'none';
            input.value = '';
        });

        updateSupervisorOptions();
        
        showMessage('تم مسح النموذج بنجاح! ✅', 'success');
    }
}

// ===== Handle View Records =====
async function handleViewRecords() {
    if (!requireOwnerAccess('عرض السجلات محفوظ للمالك فقط.')) {
        return;
    }
    try {
        const records = await getAllRecords();
        
        if (records.length === 0) {
            showMessage('لا توجد سجلات محفوظة! ℹ️', 'warning');
            recordsList.style.display = 'none';
            return;
        }
        
        recordsBody.innerHTML = '';
        
        records.reverse().forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.week}</td>
                <td>${record.mainSchool}</td>
                <td>${record.sector}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="viewRecord(${record.id})">👁️ عرض</button>
                    <button class="btn btn-success btn-sm" onclick="exportRecordPDF(${record.id})">📄 PDF</button>
                    <button class="btn btn-warning btn-sm" onclick="exportRecordExcel(${record.id})">📊 Excel</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRecordById(${record.id})">🗑️ حذف</button>
                </td>
            `;
            recordsBody.appendChild(row);
        });
        
        recordsList.style.display = 'block';
        recordsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('خطأ في عرض السجلات:', error);
        showMessage('حدث خطأ في عرض السجلات! ❌', 'error');
    }
}

// ===== View Single Record =====
window.viewRecord = async function(id) {
    if (!requireOwnerAccess('عرض السجلات محفوظ للمالك فقط.')) {
        return;
    }
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);
        
        request.onsuccess = () => {
            const record = request.result;
            if (record) {
                const previewHTML = generatePreviewHTML(record);
                document.getElementById('previewContent').innerHTML = previewHTML;
                previewModal.style.display = 'block';
            }
        };
    } catch (error) {
        console.error('خطأ في عرض السجل:', error);
        showMessage('حدث خطأ في عرض السجل! ❌', 'error');
    }
}

// ===== Export Single Record as PDF =====
window.exportRecordPDF = async function(id) {
    if (!requireOwnerAccess('تصدير السجلات محفوظ للمالك فقط.')) {
        return;
    }
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);
        
        request.onsuccess = async () => {
            const record = request.result;
            if (record) {
                formData = record;
                await handleExportPDF();
            }
        };
    } catch (error) {
        console.error('خطأ في تصدير PDF:', error);
        showMessage('حدث خطأ في تصدير PDF! ❌', 'error');
    }
}

// ===== Export Single Record as Excel =====
window.exportRecordExcel = async function(id) {
    if (!requireOwnerAccess('تصدير السجلات محفوظ للمالك فقط.')) {
        return;
    }
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(id);
        
        request.onsuccess = () => {
            const record = request.result;
            if (record) {
                formData = record;
                handleExportExcel();
            }
        };
    } catch (error) {
        console.error('خطأ في تصدير Excel:', error);
        showMessage('حدث خطأ في تصدير Excel! ❌', 'error');
    }
}

// ===== Delete Record by ID =====
window.deleteRecordById = async function(id) {
    if (!requireOwnerAccess('حذف السجلات محفوظ للمالك فقط.')) {
        return;
    }
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
        try {
            await deleteRecord(id);
            await handleViewRecords();
        } catch (error) {
            console.error('خطأ في حذف السجل:', error);
        }
    }
}

// ===== Handle Export All Excel =====
async function handleExportAllExcel() {
    if (!requireOwnerAccess('تصدير جميع السجلات محفوظ للمالك فقط.')) {
        return;
    }
    try {
        const records = await getAllRecords();
        
        if (records.length === 0) {
            showMessage('لا توجد سجلات لتصديرها! ℹ️', 'warning');
            return;
        }
        
        const workbook = XLSX.utils.book_new();

        const headers = [
            'الأسبوع الدراسي',
            'التاريخ',
            'اليوم',
            'المهمة',
            'القطاع',
            'النوع',
            'المشرف/ة',
            'المرحلة',
            'نوع المدرسة',
            'اسم المدرسة',
            'المدرسة الإضافية',
            'نوع الخدمة',
            'مجالات الدعم الرئيسة',
            'عدد إجراءات التدريس',
            'إجراءات التدريس',
            'عدد إجراءات نواتج التعلم',
            'إجراءات نواتج التعلم',
            'عدد إجراءات التوجيه الطلابي',
            'إجراءات التوجيه الطلابي',
            'عدد إجراءات النشاط الطلابي',
            'إجراءات النشاط الطلابي',
            'تمكين المدرسة',
            'تفعيل منصة مدرستي',
            'سبب عدم التفعيل',
            'مدى مشاركة المدرسة',
            'الخبرات الإشرافية',
            'المبادرات',
            'التحديات',
            'المعالجات',
            'التوصيات',
            'المقترحات'
        
        const headers = [
            'التاريخ',
            'اليوم',
            'الأسبوع',
            'القطاع',
            'النوع',
            'المشرف/ة',
            'المهمة',
            'المرحلة',
            'نوع المدرسة',
            'اسم المدرسة',
            'المدرسة الإضافية',
            'نوع الخدمة',
            'مجالات الدعم الرئيسة',
            'إجراءات التدريس',
            'عدد إجراءات التدريس',
            'إجراءات نواتج التعلم',
            'عدد إجراءات نواتج التعلم',
            'إجراءات التوجيه الطلابي',
            'عدد إجراءات التوجيه الطلابي',
            'إجراءات النشاط الطلابي',
            'عدد إجراءات النشاط الطلابي',
            'تمكين المدرسة',
            'تفعيل منصة مدرستي',
            'سبب عدم التفعيل',
            'مدى مشاركة المدرسة',
            'الخبرات الإشرافية',
            'المبادرات',
            'التحديات',
            'المعالجات',
            'التوصيات',
            'المقترحات',
            'تاريخ الحفظ'
        ];
        
        const rows = records.map(record => [
            record.date || '',
            record.day || '',
            record.week || '',
            record.sector || '',
            record.gender || '',
            record.supervisor || '',
            record.taskType || '',
            record.stage || '',
            record.schoolType || '',
            record.mainSchool || '',
            record.additionalSchool || '',
            record.serviceType || '',
            (record.supportAreas || []).join('، '),
            (record.teachingActions || []).join('، '),
            record.teachingCount || 0,
            (record.outcomesActions || []).join('، '),
            record.outcomesCount || 0,
            (record.guidanceActions || []).join('، '),
            record.guidanceCount || 0,
            (record.activityActions || []).join('، '),
            record.activityCount || 0,
            (record.empowerment || []).join('، '),
            record.elearning || '',
            record.elearningReason || '',
            record.participation || '',
            record.experiences || '',
            record.initiatives || '',
            record.challenges || '',
            record.treatments || '',
            record.recommendations || '',
            record.suggestions || '',
            record.timestamp || ''
        ]);
        
        const sheetData = [headers, ...rows];
        const summarySheet = XLSX.utils.aoa_to_sheet(sheetData);
        summarySheet['!cols'] = headers.map(() => ({ wch: 20 }));
        
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'جميع السجلات');
        
        const fileName = `جميع_سجلات_دعم_التميز_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showMessage('تم تصدير جميع السجلات بنجاح! ✅', 'success');
        
    } catch (error) {
        console.error('خطأ في تصدير جميع السجلات:', error);
        showMessage('حدث خطأ في تصدير السجلات! ❌', 'error');
    }
}

// ===== Show Message =====
function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.form-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.style.transition = 'opacity 0.5s ease';
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            messageDiv.remove();
        }, 500);
    }, 5000);
}

// ===== Additional Utility Functions =====

// Auto-save draft to localStorage
function saveDraft() {
    const data = collectFormData();
    localStorage.setItem('formDraft', JSON.stringify(data));
}

// Load draft from localStorage
function loadDraft() {
    const draft = localStorage.getItem('formDraft');
    if (draft) {
        try {
            const data = JSON.parse(draft);
            // Populate form with draft data
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
            updateSupervisorOptions();
            if (data.supervisor) {
                const supervisorSelect = document.getElementById('supervisor');
                supervisorSelect.value = data.supervisor;
            }
        } catch (error) {
            console.error('خطأ في تحميل المسودة:', error);
        }
    }
}

// Clear draft
function clearDraft() {
    localStorage.removeItem('formDraft');
}

// Add auto-save on form changes
if (form) {
    form.addEventListener('input', () => {
        saveDraft();
    });
}
