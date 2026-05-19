/**
 * RESOLUTE — Google Apps Script
 * Принимает POST-запросы с формы и записывает в Google Sheets
 *
 * КАК УСТАНОВИТЬ:
 * 1. Откройте Google Sheets → Расширения → Apps Script
 * 2. Вставьте весь этот код
 * 3. Нажмите Развернуть → Новое развёртывание → Тип: "Веб-приложение"
 * 4. Доступ: "Все" (анонимно)
 * 5. Скопируйте URL и вставьте в public/js/form.js → CONFIG.SHEETS_WEBHOOK_URL
 */

const SHEET_NAME = 'Заявки';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    appendRow(data);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// CORS preflight (GET используется для проверки соединения)
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', service: 'RESOLUTE Forms' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendRow(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(SHEET_NAME);

  // Создаём лист и шапку если не существует
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Дата / Время',
      'Имя ребёнка',
      'Возраст',
      'Имя родителя',
      'Телефон',
      'Удобное время',
      'Комментарий',
      'Статус',         // Для администратора: "Новая", "Позвонили", "Записаны"
    ]);
    // Форматируем шапку
    sheet.getRange(1, 1, 1, 8).setBackground('#C41C1C').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(4, 180);
    sheet.setColumnWidth(5, 150);
    sheet.setColumnWidth(6, 200);
    sheet.setColumnWidth(7, 250);
    sheet.setColumnWidth(8, 120);
  }

  sheet.appendRow([
    data.timestamp  || new Date().toLocaleString('ru-RU'),
    data.childName  || '',
    data.childAge   || '',
    data.parentName || '',
    data.phone      || '',
    data.timeSlot   || '',
    data.comment    || '',
    'Новая',          // Начальный статус
  ]);

  // Подсвечиваем новую строку
  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 8).setBackground('#FFE4B5'); // Жёлтый = новая заявка
}
