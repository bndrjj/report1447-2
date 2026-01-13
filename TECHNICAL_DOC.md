# التوثيق التقني للنظام 🔧

## البنية التقنية

### نظرة عامة

النظام عبارة عن تطبيق ويب من صفحة واحدة (Single Page Application) مبني بتقنيات الويب القياسية:

- **HTML5**: هيكل الصفحة والعناصر
- **CSS3**: التنسيق والتصميم المرئي
- **JavaScript (ES6+)**: المنطق والتفاعل
- **IndexedDB**: قاعدة البيانات المحلية

---

## هيكل الملفات 📁

```
school-support-form/
│
├── index.html          # الصفحة الرئيسية والهيكل
├── styles.css          # التنسيق والتصميم
├── script.js           # المنطق والوظائف
├── README.md           # دليل المستخدم
├── QUICK_START.md      # دليل البدء السريع
├── TECHNICAL_DOC.md    # التوثيق التقني (هذا الملف)
├── package.json        # معلومات المشروع
├── netlify.toml        # إعدادات Netlify
├── vercel.json         # إعدادات Vercel
└── .gitignore          # ملفات يتم تجاهلها في Git
```

---

## ملف index.html 📄

### الأقسام الرئيسية:

1. **Head Section**:
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>استمارة دعم التميز المدرسي</title>
    <link rel="stylesheet" href="styles.css">
    <link href="fonts-url" rel="stylesheet">
</head>
```

2. **Header Section**:
- شعار النظام
- عنوان الاستمارة
- معلومات الجهة

3. **Form Sections**:
- المعلومات الأساسية
- مجالات الدعم
- مجال التدريس
- مجال نواتج التعلم
- مجال التوجيه الطلابي
- مجال النشاط الطلابي
- تمكين المدرسة
- معلومات إضافية

4. **Action Buttons**:
- حفظ البيانات
- معاينة التقرير
- تصدير PDF
- طباعة
- تصدير Excel
- مسح النموذج

5. **Data Management**:
- عرض السجلات المحفوظة
- إدارة السجلات

6. **Modal للمعاينة**

7. **Footer**

### العناصر التفاعلية:

#### القوائم المنسدلة (Select):
```html
<select id="week" name="week" required>
    <option value="">اختر الأسبوع</option>
    <option value="الأسبوع الأول...">الأسبوع الأول...</option>
    <!-- المزيد من الخيارات -->
</select>
```

#### حقول الإدخال النصية:
```html
<input type="text" id="mainSchool" name="mainSchool" placeholder="أدخل اسم المدرسة">
```

#### حقول التاريخ:
```html
<input type="date" id="date" name="date" required>
```

#### مربعات الاختيار المتعددة:
```html
<label class="checkbox-item">
    <input type="checkbox" name="supportAreas" value="التدريس">
    <span>التدريس</span>
</label>
```

#### مناطق النص:
```html
<textarea id="experiences" name="experiences" rows="4" placeholder="اذكر الخبرات..."></textarea>
```

---

## ملف styles.css 🎨

### نظام الألوان (CSS Variables):

```css
:root {
    --primary-color: #006341;      /* الأخضر التعليمي */
    --primary-dark: #004d32;       /* أخضر داكن */
    --primary-light: #008855;      /* أخضر فاتح */
    --secondary-color: #d4af37;    /* ذهبي */
    --success-color: #28a745;      /* أخضر للنجاح */
    --danger-color: #dc3545;       /* أحمر للخطر */
    --warning-color: #ffc107;      /* أصفر للتحذير */
    --info-color: #17a2b8;         /* أزرق للمعلومات */
}
```

### التخطيط (Layout):

#### Grid System:
```css
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
}
```

#### Flexbox:
```css
.form-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
}
```

### الرسوم المتحركة (Animations):

#### تدوير الخلفية:
```css
@keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

#### نبض الشعار:
```css
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}
```

#### ظهور تدريجي:
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

### التصميم المتجاوب:

```css
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
    
    .form-header h1 {
        font-size: 1.8rem;
    }
}

@media (max-width: 480px) {
    .form-header h1 {
        font-size: 1.5rem;
    }
}
```

### إعدادات الطباعة:

```css
@media print {
    .form-header,
    .form-actions,
    .data-management {
        display: none;
    }
    
    .form-section {
        page-break-inside: avoid;
    }
}
```

---

## ملف script.js 💻

### المتغيرات العامة:

```javascript
let formData = {};              // بيانات النموذج الحالية
let savedRecords = [];          // السجلات المحفوظة
const DB_NAME = 'SchoolSupportDB';    // اسم قاعدة البيانات
const DB_VERSION = 1;                  // إصدار قاعدة البيانات
const STORE_NAME = 'records';          // اسم مخزن البيانات
let db;                               // مثيل قاعدة البيانات
```

### بنية قاعدة البيانات (IndexedDB):

#### Schema:
```javascript
{
    keyPath: 'id',           // المفتاح الرئيسي (تلقائي)
    autoIncrement: true,     // زيادة تلقائية
    indexes: {
        date: false,         // فهرس للتاريخ
        week: false,         // فهرس للأسبوع
        school: false,       // فهرس للمدرسة
        sector: false,       // فهرس للقطاع
        timestamp: false     // فهرس للطابع الزمني
    }
}
```

#### مثال على سجل محفوظ:
```javascript
{
    id: 1,
    timestamp: "2026-01-13T10:30:00.000Z",
    week: "الأسبوع الأول - ٢٠٢٦/٠١/١٨ إلى ٢٠٢٦/٠١/٢٢",
    date: "2026-01-20",
    day: "الاثنين",
    taskType: "تقديم خدمات دعم تميز مدرسي",
    sector: "الدمام",
    gender: "بنين",
    stage: "ابتدائي",
    schoolType: "المدرسة الأساسية المكلف بها",
    mainSchool: "مدرسة الأمل الابتدائية",
    serviceType: "حضوري",
    supportAreas: ["التدريس", "نواتج التعلم"],
    teachingActions: ["زيارة صفية", "تقديم تغذية راجعة"],
    teachingCount: 2,
    // ... المزيد من الحقول
}
```

### الوظائف الرئيسية:

#### 1. تهيئة قاعدة البيانات:
```javascript
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            const objectStore = db.createObjectStore(STORE_NAME, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            // إنشاء الفهارس
        };
    });
}
```

#### 2. حفظ سجل:
```javascript
function saveRecord(record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        record.timestamp = new Date().toISOString();
        const request = objectStore.add(record);
        
        request.onsuccess = () => {
            showMessage('تم حفظ البيانات بنجاح! ✅', 'success');
            resolve(request.result);
        };
    });
}
```

#### 3. جمع بيانات النموذج:
```javascript
function collectFormData() {
    const data = {};
    
    // الحقول الأساسية
    const basicFields = ['week', 'date', 'day', ...];
    basicFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            data[field] = element.value;
        }
    });
    
    // حقول الاختيار المتعدد
    data.supportAreas = getCheckedValues('supportAreas');
    
    return data;
}
```

#### 4. التحقق من صحة النموذج:
```javascript
function validateForm() {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.style.borderColor = 'var(--danger-color)';
        }
    });
    
    return isValid;
}
```

#### 5. إنشاء HTML للمعاينة:
```javascript
function generatePreviewHTML(data) {
    let html = `
        <div class="preview-header">
            <h1>استمارة خدمات دعم التميز المدرسي</h1>
        </div>
    `;
    
    // إضافة الأقسام
    html += generateSectionHTML('المعلومات الأساسية', data);
    
    return html;
}
```

#### 6. تصدير PDF:
```javascript
async function handleExportPDF() {
    const previewHTML = generatePreviewHTML(formData);
    
    // إنشاء عنصر مؤقت
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = previewHTML;
    document.body.appendChild(tempDiv);
    
    // تحويل إلى صورة
    const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true
    });
    
    // إنشاء PDF
    const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    
    pdf.save('استمارة.pdf');
    
    document.body.removeChild(tempDiv);
}
```

#### 7. تصدير Excel:
```javascript
function handleExportExcel() {
    const workbook = XLSX.utils.book_new();
    
    // إعداد البيانات
    const excelData = [
        ['استمارة خدمات دعم التميز المدرسي'],
        ['الأسبوع الدراسي', formData.week],
        ['التاريخ', formData.date],
        // ... المزيد من البيانات
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الاستمارة');
    XLSX.writeFile(workbook, 'استمارة.xlsx');
}
```

### إدارة الأحداث (Event Handling):

```javascript
function setupEventListeners() {
    // منع الإرسال الافتراضي
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
    
    // أزرار الإجراءات
    saveBtn.addEventListener('click', handleSave);
    previewBtn.addEventListener('click', handlePreview);
    exportPdfBtn.addEventListener('click', handleExportPDF);
    
    // الحقول الشرطية
    schoolTypeSelect.addEventListener('change', () => {
        if (schoolTypeSelect.value === 'المدرسة الإضافية...') {
            additionalSchoolGroup.style.display = 'flex';
        }
    });
    
    // مجالات الدعم
    supportAreasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleSupportAreasChange);
    });
}
```

### الوظائف المساعدة:

#### عرض الرسائل:
```javascript
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.form-container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
```

#### الحفظ التلقائي:
```javascript
form.addEventListener('input', () => {
    saveDraft();
});

function saveDraft() {
    const data = collectFormData();
    localStorage.setItem('formDraft', JSON.stringify(data));
}
```

---

## المكتبات الخارجية 📚

### 1. jsPDF:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
```
**الاستخدام**: تحويل HTML إلى PDF

### 2. html2canvas:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
```
**الاستخدام**: التقاط صورة من HTML

### 3. SheetJS (xlsx):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
```
**الاستخدام**: تصدير البيانات إلى Excel

### 4. Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
```
**الاستخدام**: خطوط عربية احترافية

---

## الأمان والأداء 🔒

### الأمان:

1. **لا توجد اتصالات خارجية** (ما عدا المكتبات من CDN)
2. **البيانات محلية بالكامل** (IndexedDB)
3. **لا يوجد تتبع أو analytics**
4. **الكود مفتوح المصدر** (يمكن مراجعته)

### الأداء:

1. **تحميل سريع**: ملفات صغيرة الحجم
2. **عدم الحاجة للإنترنت**: بعد التحميل الأول
3. **استجابة فورية**: جميع العمليات محلية
4. **تخزين فعال**: IndexedDB أسرع من localStorage

---

## التوافق مع المتصفحات 🌐

### المتصفحات المدعومة:

✅ Chrome 80+
✅ Edge 80+
✅ Firefox 75+
✅ Safari 13.1+
✅ Opera 67+

### المتصفحات غير المدعومة:

❌ Internet Explorer (جميع الإصدارات)
❌ المتصفحات القديمة (قبل 2020)

---

## اختبار النظام 🧪

### اختبارات يدوية:

1. **اختبار الإدخال**:
   - ملء جميع الحقول
   - ترك حقول مطلوبة فارغة
   - إدخال بيانات غير صحيحة

2. **اختبار الحفظ**:
   - حفظ استمارة كاملة
   - حفظ عدة استمارات
   - عرض السجلات المحفوظة

3. **اختبار التصدير**:
   - تصدير PDF
   - تصدير Excel
   - طباعة

4. **اختبار المتصفحات**:
   - Chrome
   - Firefox
   - Safari
   - Edge

5. **اختبار الأجهزة**:
   - Desktop
   - Tablet
   - Mobile

---

## التطوير المستقبلي 🚀

### ميزات مقترحة:

1. **Backend Integration**:
   - ربط مع قاعدة بيانات خارجية (Firebase, Supabase)
   - مزامنة بين الأجهزة
   - نسخ احتياطي سحابي

2. **Analytics**:
   - إحصائيات الاستخدام
   - تقارير تحليلية
   - رسوم بيانية

3. **Collaboration**:
   - مشاركة الاستمارات
   - تعليقات ومراجعات
   - صلاحيات المستخدمين

4. **Mobile App**:
   - تطبيق Android
   - تطبيق iOS
   - Progressive Web App (PWA)

5. **AI Features**:
   - ملء تلقائي ذكي
   - اقتراحات بناءً على البيانات السابقة
   - تحليل النصوص

---

## استكشاف الأخطاء 🔍

### أخطاء شائعة:

#### 1. IndexedDB Error:
```javascript
Error: Failed to open database
```
**السبب**: المتصفح لا يدعم IndexedDB أو تم تعطيله

**الحل**:
```javascript
if (!window.indexedDB) {
    alert('متصفحك لا يدعم IndexedDB. الرجاء استخدام متصفح حديث.');
}
```

#### 2. CORS Error:
```javascript
Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```
**السبب**: محاولة الوصول لملفات خارجية

**الحل**: استخدام CDN أو تشغيل local server

#### 3. PDF Generation Error:
```javascript
Failed to generate PDF
```
**السبب**: مشكلة في المكتبات أو الاتصال بالإنترنت

**الحل**: التحقق من اتصال الإنترنت وإعادة تحميل الصفحة

---

## معلومات الترخيص 📜

### MIT License

```
Copyright (c) 2026 Claude AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## المساهمة في المشروع 🤝

### كيفية المساهمة:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

### معايير الكود:

- استخدام ES6+ JavaScript
- تعليقات واضحة بالعربية
- اتباع نمط الكود الموجود
- اختبار التغييرات قبل الـ commit

---

## معلومات الاتصال 📧

للأسئلة والاستفسارات:
- GitHub Issues: [رابط المشروع]
- Email: [بريدك الإلكتروني]
- Documentation: [رابط التوثيق]

---

**آخر تحديث: يناير 2026**
