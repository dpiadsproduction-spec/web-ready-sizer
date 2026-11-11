/*
 * files.jsx - save text output (CSS / JSON) to disk with a save dialog.
 */

function wrsSaveTextFile(defaultName, content) {
    var file = File.saveDialog("Save file", "*.css;*.json;*.html;*.txt");
    if (!file) return { ok: false, error: "CANCELLED" };

    try {
        file.encoding = "UTF-8";
        if (!file.open("w")) {
            return { ok: false, error: "OPEN_FAILED" };
        }
        file.write(content);
        file.close();
        return { ok: true, path: file.fsName };
    } catch (e) {
        try { file.close(); } catch (eC) { }
        return { ok: false, error: "WRITE_FAILED", detail: String(e) };
    }
}

function wrsSaveTextFileToPath(fullPath, content) {
    try {
        var file = new File(fullPath);
        file.encoding = "UTF-8";
        if (!file.open("w")) return { ok: false, error: "OPEN_FAILED" };
        file.write(content);
        file.close();
        return { ok: true, path: file.fsName };
    } catch (e) {
        return { ok: false, error: "WRITE_FAILED", detail: String(e) };
    }
}

function wrsSelectColorDialog(initialHex, promptText) {
    try {
        var color = new RGBColor();
        if (initialHex) {
            var rgb = wrsHexToRgb(initialHex);
            color.red = rgb.r;
            color.green = rgb.g;
            color.blue = rgb.b;
        } else {
            color.red = 0;
            color.green = 0;
            color.blue = 0;
        }

        var picked = null;
        try {
            picked = app.showColorPicker(color, undefined, false);
        } catch (ePicker) {
            picked = color;
        }

        if (!picked) return { ok: false, error: "CANCELLED" };
        return {
            ok: true,
            hex: wrsRgbToHex(picked.red, picked.green, picked.blue),
            rgb: { r: picked.red, g: picked.green, b: picked.blue }
        };
    } catch (e) {
        return { ok: false, error: "PICKER_FAILED", detail: String(e) };
    }
}
