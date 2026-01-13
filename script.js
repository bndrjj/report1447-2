// ===== Global Variables =====
let formData = {};
let savedRecords = [];
const DB_NAME = 'SchoolSupportDB';
const DB_VERSION = 1;
const STORE_NAME = 'records';

// ===== IndexedDB Setup =====
let db;

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
const exportExcelBtn = document.getElementById('exportExcelBtn');
const resetBtn = document.getElementById('resetBtn');
const viewRecordsBtn = document.getElementById('viewRecordsBtn');
const exportAllExcelBtn = document.getElementById('exportAllExcelBtn');
const previewModal = document.getElementById('previewModal');
const closeModal = document.querySelector('.close');
const recordsList = document.getElementById('recordsList');
const recordsBody = document.getElementById('recordsBody');

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        setupEventListeners();
        setupConditionalFields();
    } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
        showMessage('حدث خطأ في تحميل التطبيق! ❌', 'error');
    }
});

// ===== Setup Event Listeners =====
function setupEventListeners() {
    // Form submission prevention
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
    
    // Button event listeners
    saveBtn.addEventListener('click', handleSave);
    previewBtn.addEventListener('click', handlePreview);
    exportPdfBtn.addEventListener('click', handleExportPDF);
    printBtn.addEventListener('click', handlePrint);
    exportExcelBtn.addEventListener('click', handleExportExcel);
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
    
    // Support areas checkboxes
    const supportAreasCheckboxes = document.querySelectorAll('input[name="supportAreas"]');
    supportAreasCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleSupportAreasChange);
    });
    
    // Other checkboxes with "other" option
    setupOtherCheckboxes('supportAreas', 'supportAreasOther', 'supportAreasOtherText');
    setupOtherCheckboxes('teachingActions', 'teachingActionsOther', 'teachingActionsOtherText');
    setupOtherCheckboxes('outcomesActions', 'outcomesActionsOther', 'outcomesActionsOtherText');
    setupOtherCheckboxes('guidanceActions', 'guidanceActionsOther', 'guidanceActionsOtherText');
    setupOtherCheckboxes('activityActions', 'activityActionsOther', 'activityActionsOtherText');
    setupOtherCheckboxes('empowerment', 'empowermentOther', 'empowermentOtherText');
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
    const basicFields = ['week', 'date', 'day', 'taskType', 'sector', 'gender', 'stage', 
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
        
        showMessage('تم مسح النموذج بنجاح! ✅', 'success');
    }
}

// ===== Handle View Records =====
async function handleViewRecords() {
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
    try {
        const records = await getAllRecords();
        
        if (records.length === 0) {
            showMessage('لا توجد سجلات لتصديرها! ℹ️', 'warning');
            return;
        }
        
        const workbook = XLSX.utils.book_new();
        
        // Summary sheet
        const summaryData = [
            ['ملخص جميع السجلات'],
            ['وزارة التعليم - إدارة التعليم بالمنطقة الشرقية'],
            [],
            ['التاريخ', 'الأسبوع', 'المدرسة', 'القطاع', 'المرحلة', 'النوع', 'نوع الخدمة']
        ];
        
        records.forEach(record => {
            summaryData.push([
                record.date,
                record.week,
                record.mainSchool,
                record.sector,
                record.stage,
                record.gender,
                record.serviceType
            ]);
        });
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [
            { wch: 15 },
            { wch: 40 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 10 },
            { wch: 15 }
        ];
        
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص السجلات');
        
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
form.addEventListener('input', () => {
    saveDraft();
});
