# Flask 백엔드 뼈대
import io
from flask import Flask, render_template
from flask import send_from_directory
from fpdf import FPDF
from flask import request, jsonify, send_file, abort
from gtts import gTTS
import json
import os
import datetime


app = Flask(__name__)

app_py_path = "/mnt/data/oreno_nihongo/app.py"

# with open(app_py_path, "r", encoding="utf-8") as f:
#     current_app_py = f.read()

VALID_CODES = {"ALPHA123", "SUPPORT1000", "BREEZE3000"}

@app.route('/api/auth', methods=['POST'])
def auth_supporter():
    # try:
    #     with open('data/supporter_code.json', encoding='utf-8') as f:
    #         data = json.load(f)
    #     valid_keys = data.get("valid_keys", [])
    # except Exception as e:
    #     return jsonify({"result": "error", "message": str(e)}), 500

    # req = request.get_json()
    # key = req.get("key")

    return jsonify({"result": "ok"})
    # if key in valid_keys:
    #     return jsonify({"result": "ok"})
    # else:
    #     return jsonify({"result": "unauthorized"}), 401

@app.route('/auth')
def authenticate():
    code = request.args.get('code')
    if code in VALID_CODES:
        return jsonify({"token": "ALPHA-TOKEN-2025"})
    return jsonify({"error": "인증 실패"}), 401

@app.route('/tts')
def tts():
    text = request.args.get("text", "")
    if not text:
        return "Missing text", 400

    try:
        tts = gTTS(text, lang='ja')
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return send_file(mp3_fp, mimetype="audio/mpeg")
    except Exception as e:
        print("🔥 TTS 처리 중 에러:", str(e))
        return f"TTS Error: {str(e)}", 500

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/data/<path:filename>')
def data_files(filename):
    return send_from_directory('data', filename)

@app.route("/pdf")
def generate_pdf():
    filename = request.args.get("filename")
    if not filename:
        return abort(400, "Missing filename")

    filepath = f"./data/{filename}"
    if not os.path.exists(filepath):
        return abort(404, "File not found")

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        title = data.get("title", "제목 없음")
        words = data.get("today_expression", {}).get("words", [])

        pdf = FPDF()
        pdf.add_page()
        pdf.add_font("NanumGothic", '', "./fonts/NanumGothic.ttf", uni=True)
        pdf.set_font("NanumGothic", size=14)

        pdf.cell(0, 10, txt=f"🎵 {title} - 단어장", ln=True, align='C')
        pdf.cell(0, 10, txt=f"📅 학습일: {datetime.date.today()}", ln=True, align='C')
        pdf.ln(10)

        for w in words:
            pdf.cell(90, 10, txt=w.get("ja", ""), border=1)
            pdf.cell(90, 10, txt=w.get("ko", ""), border=1)
            pdf.ln()

        output_path = f"./temp/{filename.replace('.json', '.pdf')}"
        os.makedirs("./temp", exist_ok=True)
        pdf.output(output_path)

        return send_file(output_path, as_attachment=True)

    except Exception as e:
        return abort(500, f"PDF 생성 실패: {str(e)}")

@app.route('/shutdown_status')
def shutdown_status():
    with open('data/shutdown.json', encoding='utf-8') as f:
        status = json.load(f)
    return {"shutdown": status.get("shutdown", False)}

if __name__ == '__main__':
    app.run(debug=True)