# Web-Ready Sizer

إضافة Adobe Illustrator تحوّل التصميم إلى مقاسات ويب حقيقية: `rem`، كلاسات Tailwind، ونقاط توقف (breakpoints) — كل ذلك من لوحة واحدة داخل Illustrator.

**التوافق:** Illustrator 2020 حتى 2023 (CEP 9/10/11، الإصدارات 24.x – 27.x)

---

## المحتويات

- [المزايا](#المزايا)
- [التثبيت السريع](#التثبيت-السريع)
- [الاستخدام](#الاستخدام)
- [البنية](#البنية)
- [التطوير والاختبار](#التطوير-والاختبار)
- [استكشاف الأخطاء](#استكشاف-الأخطاء)
- [الترخيص](#الترخيص)

---

## المزايا

| التبويب | الوظيفة |
|---|---|
| **التحجيم** | اكتب `5rem` أو `w-20` أو `80` مباشرةً وطبّقها على العنصر المحدد. يظهر التحويل الفوري إلى px/rem وأقرب كلاس Tailwind. |
| **المفتش** | يقرأ خصائص العنصر ويولّد كلاسات Tailwind + HTML + CSS جاهزة للنسخ. مطابقة الألوان بخوارزمية CIEDE2000 مع مؤشر ثقة. |
| **اللوحات** | إنشاء artboards بمقاسات نقاط توقف Tailwind الرسمية (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536)، مع نقاط توقف مخصصة. |

إضافات مدمجة:

- **Snap to Tailwind** — تقريب أي قيمة إلى أقرب قيمة صالحة في سلسلة Tailwind.
- **Color → Tailwind** — مطابقة دقيقة (ΔE) لأقرب لون Tailwind.
- **التصدير** — Tailwind HTML، CSS، Tailwind config، Design Tokens JSON.
- **دعم RTL والعربية** — واجهة كاملة من اليمين لليسار وكلاسات منطقية (`ms-*`, `me-*`, `text-start`).
- **Design Tokens presets** — السلاسل الافتراضية + النسبة الذهبية + فيبوناتشي + Modular Scale + حيلة 62.5%.

---

## التثبيت السريع

الإضافة تُثبّت يدوياً داخل مجلد CEP لأنها غير موقّعة تجارياً. أغلق Illustrator أولاً.

### Windows

```bat
install\install-windows.bat
```

أو عبر PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File install\install-windows.ps1
```

### macOS

```bash
bash install/install-mac.sh
```

يقوم السكربت بالآتي:

1. نسخ الإضافة إلى مجلد CEP للمستخدم:
   - Windows: `%APPDATA%\Adobe\CEP\extensions\com.webready.sizer`
   - macOS: `~/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer`
2. تفعيل `PlayerDebugMode = 1` في `CSXS.9`, `CSXS.10`, `CSXS.11` — وهذا شرط تحميل أي إضافة غير موقّعة.

بعد التثبيت: أعد تشغيل Illustrator ثم افتح
`Window > Extensions > Web-Ready Sizer`
(في Illustrator 2020 قد تجدها تحت `Window > Extensions (Legacy)`).

التفاصيل الكاملة في `docs/INSTALL.md`.

---

## الاستخدام

### تبويب التحجيم

1. حدد عنصراً (شكل أو نص) في Illustrator.
2. اختر الوحدة: `rem` أو `Tailwind`.
3. اكتب القيمة في حقل العرض أو الطول.
   - في وضع rem: `5rem` أو `5` (كلاهما 80px عند أساس 16px).
   - في وضع Tailwind: `w-20` أو `20`.
4. فعّل الخيارات المطلوبة:
   - **تقريب لأقرب قيمة Tailwind** — يفرض قيماً صالحة دائماً.
   - **الحفاظ على النسبة** — يقفل نسبة العرض إلى الطول.
   - **تطبيق على كل المحدد** — يعالج كل عناصر التحديد المتعدد.
   - **تثبيت الزاوية العلوية اليسرى** — يحافظ على الموضع أثناء التغيير.
5. اضغط **تطبيق** (أو `Enter`).

للنصوص يظهر حقل **حجم الخط** إضافياً، ويُحوَّل بين pt و px تلقائياً (`1pt = 1.333px`).

### تبويب المفتش

- يعرض الأبعاد والموضع والألوان والطباعة والتأثيرات.
- بجانب كل لون يظهر أقرب كلاس Tailwind مع مؤشر الثقة (`exact` / `close` / `approximate` / `distant`) وقيمة ΔE.
- قسم **المخرجات المولدة** يعطيك أربعة تنسيقات: Tailwind / HTML / CSS / الكل، مع أزرار نسخ وحفظ.
- زر **تصدير التحديد** يفتح نافذة التصدير الموسّعة (نطاق: التحديد/اللوحة/المستند).

### تبويب اللوحات

- زر **إنشاء** بجانب أي نقطة توقف ينشئ Artboard بالمقاس الرسمي.
- **إنشاء كل نقاط التوقف** ينشئ الخمسة دفعة واحدة بترتيب أفقي أو عمودي.
- **اللوحة النشطة** يعرض أقرب نقطة توقف لعرضها الحالي، مع زر تغيير الحجم إليها.
- **نقاط مخصصة** تُضاف وتُحفظ محلياً وتظهر في قائمة الإنشاء.

### الإعدادات

من أيقونة الترس في الشكل العلوي:

- اللغة (العربية / الإنجليزية) والاتجاه (RTL / LTR).
- السمة (داكن / فاتح) والكثافة (مريح / مضغوط).
- حجم الخط الأساسي: 16px (الافتراضي) أو 10px (حيلة 62.5%) أو قيمة مخصصة.
- معدل تحديث التحديد (ms).
- تصدير/استيراد الإعدادات كملف JSON.

---

## البنية

```
web-ready-sizer/
├── CSXS/manifest.xml        تعريف CEP (Host [24.0,27.9] = 2020-2023)
├── .debug                   منفذ التصحيح (8088)
├── client/                  واجهة اللوحة (HTML/CSS/JS، بلا build)
│   ├── index.html
│   ├── css/                 main, theme-light, rtl
│   └── js/
│       ├── vendor/          CSInterface (نسخة خفيفة)
│       ├── lib/
│       │   ├── engine/      conversion, snap, color (CIEDE2000), css-generator
│       │   ├── data/        tailwind-data, tailwind-colors
│       │   ├── event-bus.js, storage.js, i18n.js, host-bridge.js
│       └── ui/              tab-sizer, tab-inspector, tab-artboard, modals
├── jsx/                     ExtendScript (ES3 فقط)
│   ├── host.jsx             نقطة الدخول: wrsDispatch(action, json)
│   ├── json2.jsx, polyfills.jsx
│   └── lib/                 selection, shapes, text, artboards, colors, files, export
├── locale/                  ar.json / en.json
├── resources/presets/       سلاسل تصميم جاهزة
├── tests/unit/              اختبارات Node
├── tools/                   check-syntax, smoke-test, preview-server
├── install/                 سكربتات التثبيت والإزالة
└── docs/                    INSTALL.md, USER-GUIDE.md, ARCHITECTURE.md
```

**فصل الطبقات:** الواجهة (`client`) لا تعرف Illustrator مباشرة — كل نداء يمر عبر `host-bridge.js` إلى `wrsDispatch` في ExtendScript. هذا يجعل المحركات قابلة للاختبار في Node، ويجعل الانتقال إلى UXP لاحقاً ممكناً دون إعادة كتابة المنطق.

---

## التطوير والاختبار

لا حاجة إلى `npm install` — المشروع بلا اعتماديات وقت التشغيل.

```bash
# اختبارات الوحدة (محركات التحويل/التقريب/الألوان/توليد CSS)
npm test

# فحص الصياغة لكل ملفات JS + التحقق من قيود ES3 في ExtendScript
npm run check

# معاينة الواجهة في المتصفح (وضع mock بلا Illustrator)
npm run serve
```

اختبار الواجهة عبر jsdom (اختياري، يتطلب jsdom عالمياً):

```bash
npm install -g jsdom
NODE_PATH=$(npm root -g) node tools/smoke-test.js
```

للتطوير داخل Illustrator:

1. ثبّت الإضافة (السكربت ينسخ الملفات ويضبط PlayerDebugMode).
2. للتصحيح: `chrome://inspect` في Chrome مع `.debug` الموجود (منفذ 8088).
3. أي تعديل على `jsx/` يحتاج إعادة تحميل اللوحة من قائمة Extensions.

عند تعديل ملفات المصدر داخل المستودع، أعد نسخها إلى مجلد CEP أو استخدم رابطاً رمزياً:

```bash
ln -s "$(pwd)" "$HOME/Library/Application Support/Adobe/CEP/extensions/com.webready.sizer"
```

---

## استكشاف الأخطاء

| العرض | السبب المرجّح | الحل |
|---|---|---|
| اللوحة لا تظهر في القائمة | PlayerDebugMode غير مفعّل | أعد تشغيل سكربت التثبيت وأغلق Illustrator أولاً |
| اللوحة بيضاء/فارغة | مسار MainPath خاطئ أو ملفات ناقصة | أعد التثبيت وتأكد من وجود `client/index.html` داخل مجلد الإضافة |
| "تعذر التطبيق" | العنصر مقفل أو غير قابل للتغيير | افتح قفل الطبقة/العنصر من لوحة Layers |
| شريط الحالة يظهر "preview" | لم يُحمّل جسر CEP (تشغيل خارج Illustrator) | هذا طبيعي في المعاينة فقط؛ داخل Illustrator يجب أن يظهر "متصل" |
| تعطّل عند تحديد compound path | معالجة الهندسة | حدد الـ TextFrame/الشكل الداخلي مباشرة |

---

## الترخيص

MIT. راجع `LICENSE` إن أُضيف.

الخطوط: لا تُضمّن أي ملفات خطوط في الحزمة — الواجهة تستخدم خطوط النظام مع fallback عربي آمن.
