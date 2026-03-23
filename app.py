"""
Oto Market — Flask API + SQLite kullanıcı kaydı / giriş / şifre sıfırlama
Çalıştırma: py -m pip install -r requirements.txt
            py app.py
"""

from __future__ import annotations

import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "users.db"

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "gelistirme-icin-degistirin")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
# Üretimde HTTPS ile: SESSION_COOKIE_SECURE = True

# Demo: e-posta ile sıfırlama token'ını JSON'da döndür (gerçekte e-posta gider)
DEMO_SHOW_RESET_TOKEN = os.environ.get("DEMO_SHOW_RESET_TOKEN", "1") == "1"

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            created_at TEXT NOT NULL,
            reset_token TEXT,
            reset_expires TEXT
        )
        """
    )
    conn.commit()
    try:
        conn.execute("ALTER TABLE users ADD COLUMN phone TEXT")
        conn.commit()
    except sqlite3.OperationalError:
        pass
    conn.close()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def json_error(msg: str, code: int = 400):
    return jsonify({"ok": False, "error": msg}), code


# --- API ---


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    first = (data.get("first_name") or "").strip()
    last = (data.get("last_name") or "").strip()
    email = normalize_email(data.get("email") or "")
    password = data.get("password") or ""
    phone = (data.get("phone") or "").strip() or None

    if len(first) < 2 or len(last) < 2:
        return json_error("Ad ve soyad en az 2 karakter olmalıdır.")
    if not EMAIL_RE.match(email):
        return json_error("Geçerli bir e-posta adresi girin.")
    if len(password) < 8:
        return json_error("Şifre en az 8 karakter olmalıdır.")

    ph = generate_password_hash(password)
    now = datetime.now(timezone.utc).isoformat()

    conn = db()
    try:
        conn.execute(
            """
            INSERT INTO users (email, password_hash, first_name, last_name, phone, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (email, ph, first, last, phone, now),
        )
        conn.commit()
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    except sqlite3.IntegrityError:
        return json_error("Bu e-posta ile zaten kayıt var.", 409)
    finally:
        conn.close()

    uid = row["id"]
    session["user_id"] = uid
    return jsonify(
        {
            "ok": True,
            "user": {
                "id": uid,
                "email": email,
                "first_name": first,
                "last_name": last,
                "phone": phone,
            },
        }
    )


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email") or "")
    password = data.get("password") or ""

    if not email or not password:
        return json_error("E-posta ve şifre gerekli.")

    conn = db()
    row = conn.execute(
        "SELECT id, email, password_hash, first_name, last_name, phone FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return json_error("E-posta veya şifre hatalı.", 401)

    session["user_id"] = row["id"]
    return jsonify(
        {
            "ok": True,
            "user": {
                "id": row["id"],
                "email": row["email"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "phone": row["phone"],
            },
        }
    )


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/me", methods=["GET"])
def me():
    uid = session.get("user_id")
    if not uid:
        return jsonify({"user": None})

    conn = db()
    row = conn.execute(
        "SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?",
        (uid,),
    ).fetchone()
    conn.close()

    if not row:
        session.clear()
        return jsonify({"user": None})

    return jsonify(
        {
            "user": {
                "id": row["id"],
                "email": row["email"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "phone": row["phone"],
                "created_at": row["created_at"],
            }
        }
    )


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = normalize_email(data.get("email") or "")
    if not EMAIL_RE.match(email):
        return json_error("Geçerli bir e-posta girin.")

    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    exp_iso = expires.isoformat()

    conn = db()
    cur = conn.execute(
        "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
        (token, exp_iso, email),
    )
    conn.commit()
    found = cur.rowcount > 0
    conn.close()

    # Güvenlik: kayıtlı olmasa da aynı mesaj
    msg = "E-posta adresiniz kayıtlıysa, sıfırlama talimatları gönderildi."
    out = {"ok": True, "message": msg}
    if found and DEMO_SHOW_RESET_TOKEN:
        out["reset_token_shown"] = token
        out["reset_note_shown"] = (
            "Geliştirme modu: e-posta yerine bu token ile şifre sıfırlayabilirsiniz."
        )
    return jsonify(out)


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    token = (data.get("token") or "").strip()
    new_pw = data.get("new_password") or ""

    if len(token) < 10:
        return json_error("Geçersiz veya eksik sıfırlama bağlantısı.")
    if len(new_pw) < 8:
        return json_error("Yeni şifre en az 8 karakter olmalıdır.")

    now = datetime.now(timezone.utc)
    conn = db()
    row = conn.execute(
        "SELECT id, reset_expires FROM users WHERE reset_token = ?",
        (token,),
    ).fetchone()

    if not row:
        conn.close()
        return json_error("Sıfırlama bağlantısı geçersiz veya süresi dolmuş.", 400)

    try:
        exp = datetime.fromisoformat(row["reset_expires"].replace("Z", "+00:00"))
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            conn.close()
            return json_error("Sıfırlama süresi dolmuş. Yeni talep oluşturun.", 400)
    except (TypeError, ValueError):
        conn.close()
        return json_error("Sıfırlama verisi bozuk.", 400)

    uid = row["id"]
    ph = generate_password_hash(new_pw)
    conn.execute(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
        (ph, uid),
    )
    conn.commit()
    conn.close()

    session["user_id"] = uid
    return jsonify({"ok": True, "message": "Şifreniz güncellendi. Giriş yapıldı."})


# --- Statik dosyalar ---


@app.route("/")
def index_page():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:path>")
def static_or_404(path: str):
    if path.startswith("api"):
        return jsonify({"error": "Not found"}), 404
    target = BASE_DIR / path
    try:
        target.resolve().relative_to(BASE_DIR)
    except ValueError:
        return jsonify({"error": "Forbidden"}), 403
    if target.suffix.lower() in {".py", ".db", ".pyc", ".env"}:
        return jsonify({"error": "Not found"}), 404
    if target.name in {".env", "server.js", "users.db"}:
        return jsonify({"error": "Not found"}), 404
    if target.is_file():
        return send_from_directory(BASE_DIR, path)
    return jsonify({"error": "Not found"}), 404


init_db()

if __name__ == "__main__":
    print("Sunucu: http://127.0.0.1:5000")
    print("Durdurmak için Ctrl+C")
    app.run(host="127.0.0.1", port=5000, debug=True)
