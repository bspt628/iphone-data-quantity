import os
import requests
from bs4 import BeautifulSoup
import datetime
import pytz
from flask import Flask, jsonify, request
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()


# --- データ取得ロジック ---
def get_data_balance():
    LOGIN_PAGE_URL = "https://his.mvno.ne.jp/hisso/signon/login.do"
    DATA_URL = "https://his.mvno.ne.jp/checkout/status"

    username = os.environ.get("HIS_USERNAME")
    password = os.environ.get("HIS_PASSWORD")

    if not username or not password:
        return {"error": "環境変数が設定されていません。"}

    try:
        with requests.Session() as s:
            # まずログインページのHTMLを取得してフォーム構造を確認
            login_page = s.get(LOGIN_PAGE_URL)
            login_soup = BeautifulSoup(login_page.text, "html.parser")

            # ログインフォーム取得
            login_form = login_soup.find("form")
            if not login_form:
                return {"error": "ログインフォームが見つかりませんでした。"}

            # フォームのaction URLを取得（相対パスの場合は絶対パスに変換）
            form_action = login_form.get("action")
            if form_action.startswith("/"):
                login_url = f"https://his.mvno.ne.jp{form_action}"
            else:
                login_url = form_action

            # 隠しフィールドを含む全てのパラメータを準備
            payload = {}
            inputs = login_form.find_all("input")
            for input_elem in inputs:
                name = input_elem.get("name")
                input_type = input_elem.get("type", "")
                value = input_elem.get("value", "")

                if name:
                    if input_type == "hidden":
                        payload[name] = value
                    elif name == "josso_username":
                        payload[name] = username
                    elif name == "josso_password":
                        payload[name] = password

            # ログイン処理
            login_response = s.post(login_url, data=payload)

            # データページにアクセス
            res = s.get(DATA_URL)
            res.raise_for_status()
            soup = BeautifulSoup(res.text, "html.parser")

            # データ残量が表示されている要素を取得
            data_element = soup.select_one(
                "body > span > div:nth-child(1) > div > div.article.col.span_7 > dl:nth-child(4) > dd > span:nth-child(1) > span"
            )

            if data_element:
                # 日本時間（JST）で現在時刻を取得
                jst = pytz.timezone("Asia/Tokyo")
                now_jst = datetime.datetime.now(jst)

                return {
                    "balance": data_element.get_text(strip=True),
                    "time": now_jst.strftime("%Y-%m-%d %H:%M"),
                }
            else:
                return {
                    "error": "データ要素が見つかりませんでした。サイトの構造が変わった可能性があります。"
                }
    except Exception as e:
        return {"error": f"スクレイピング中にエラーが発生しました: {str(e)}"}


# --- Flaskアプリの定義 ---
app = Flask(__name__)


def check_auth():
    """API認証チェック"""
    # 環境変数からAPIパスワードを取得
    api_password = os.environ.get("API_PASSWORD")

    if not api_password:
        return False, "APIパスワードが設定されていません"

    # クエリパラメータからパスワードを取得
    provided_password = request.args.get("password")

    # ヘッダーからの認証も対応
    if not provided_password:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            provided_password = auth_header.replace("Bearer ", "")

    if not provided_password:
        return (
            False,
            "パスワードが必要です。?password=YOUR_PASSWORD または Authorization: Bearer YOUR_PASSWORD を指定してください",
        )

    if provided_password != api_password:
        return False, "パスワードが正しくありません"

    return True, None


@app.route("/")
def index():
    """データ残量を取得するメインエンドポイント（パスワード認証付き）"""
    try:
        # 認証チェック
        is_authenticated, auth_error = check_auth()

        if not is_authenticated:
            error_response = jsonify({"error": auth_error})
            error_response.headers["Access-Control-Allow-Origin"] = "*"
            return error_response, 401  # 認証エラー

        # 認証成功時のみデータ取得を実行
        data = get_data_balance()
        response = jsonify(data)

        # CORS設定（iPhoneのScriptableからアクセス可能にする）
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        return response
    except Exception as e:
        error_response = jsonify({"error": f"サーバーエラー: {str(e)}"})
        error_response.headers["Access-Control-Allow-Origin"] = "*"
        return error_response, 500


# --- ローカル開発用 ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)
