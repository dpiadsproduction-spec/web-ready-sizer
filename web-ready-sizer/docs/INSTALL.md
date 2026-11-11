# دليل التثبيت - Web-Ready Sizer

## المتطلبات

| البند | القيمة |
|---|---|
| Illustrator | 2020 (24.x) حتى 2023 (27.x) |
| نظام التشغيل | Windows 10/11 أو macOS 10.14+ |
| PlayerDebugMode | مطلوب = 1 (السكربتات تضبطه) |
| مساحة القرص | أقل من 1 ميجابايت |

لا تحتاج Node.js أو أي اعتماديات لتشغيل الإضافة — فقط لتشغيل الاختبارات.

---

## Windows

### الطريقة 1: سكربت الدفعة (الأسهل)

1. أغلق Adobe Illustrator بالكامل (تحقق من وجود أيقونته في شريط النظام).
2. افتح `install` وانقر نقراً مزدوجاً على `install-windows.bat`.
3. اتبع التعليمات على الشاشة.
4. أعد تشغيل Illustrator.

### الطريقة 2: PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File install\install-windows.ps1
```

خيارات متقدمة:

```powershell
# إعادة التثبيت بلا سؤال
powershell -ExecutionPolicy Bypass -File install\install-windows.ps1 -Force

# التثبيت بدون تفعيل PlayerDebugMode (إذا كان مفعّلاً مسبقاً)
powershell -ExecutionPolicy Bypass -File install\install-windows.ps1 -NoDebugMode
```

### التثبيت اليدوي على Windows

1. أغلق Illustrator.
2. أنشئ المجلد:
   `%APPDATA%\Adobe\CEP\extensions\com.webready.sizer`
3. انسخ إليه: `CSXS`, `client`, `jsx`, `locale`, `resources`, وملف `.debug`.
4. افتح `regedit` واذهب إلى:
   `HKEY_CURRENT_USER\Software\Adobe\CSXS.11`
5. أنشئ قيمة نصية باسم `PlayerDebugMode` وقيمتها `1`.
6. كرّر الخطوة 4-5 للمفاتيح `CSXS.10` و `CSXS.9` (لإصدارات 2020-2021).
7. أعد تشغيل Illustrator.

---

## macOS

### الطريقة 1: سكربت Shell

```bash
bash install/install-mac.sh
```

### التثبيت اليدوي على macOS

1. أغلق Illustrator.
2. أنشئ المجلد:
   `~/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer`
3. انسخ إليه محتويات المشروع (`CSXS`, `client`, `jsx`, `locale`, `resources`, `.debug`).
4. نفّذ الأوامر التالية لتفعيل وضع التصحيح:

```bash
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
```

5. أزل حجر الحجر الصحي (quarantine) إن وُجد:

```bash
xattr -dr com.apple.quarantine "$HOME/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer"
```

6. أعد تشغيل Illustrator.

> على macOS Catalina وما بعده، قد يطلب النظام منح Illustrator صلاحية الوصول إلى مجلد التطبيقات — اقبل.

---

## التحميل لأول مرة

بعد إعادة التشغيل:

- Illustrator 2021-2023: `Window > Extensions > Web-Ready Sizer`
- Illustrator 2020: `Window > Extensions (Legacy) > Web-Ready Sizer`

إن لم تظهر، افتح `Window > Extensions` ونفّذ تحديثاً للقائمة (قد تحتاج إغلاق جميع المستندات).

---

## التحقق من التثبيت

1. افتح أي مستند في Illustrator.
2. افتح اللوحة.
3. يجب أن يظهر شريط الحالة السفلي: نقطة **خضراء** ونص يشير إلى الاتصال بـ Illustrator.
   - إن ظهرت نقطة **صفراء** مع كلمة `preview`، فهذا يعني أن الجسر لم يُحمّل: راجع PlayerDebugMode.

---

## إلغاء التثبيت

Windows:

```bat
install\uninstall-windows.bat
```

macOS:

```bash
bash install/uninstall-mac.sh
```

أو احذف المجلد يدوياً. PlayerDebugMode يبقى مفعّلاً (آمن لإضافات أخرى).

---

## ملاحظات توافق

| Illustrator | إصدار CEP | PlayerDebugMode |
|---|---|---|
| 2020 (v24) | CSXS 9 | `com.adobe.CSXS.9` |
| 2021 (v25) | CSXS 10 | `com.adobe.CSXS.10` |
| 2022 (v26) | CSXS 11 | `com.adobe.CSXS.11` |
| 2023 (v27) | CSXS 11 | `com.adobe.CSXS.11` |

الملف `CSXS/manifest.xml` يحدد النطاق `[24.0,27.9]`، أي أن الإضافة لا تُحمّل على 2024+ لتجنّب سلوك غير مختبر. لتوسيع النطاق عدّل سطر `Host Name="ILST" Version=...` ثم أعد التثبيت.
