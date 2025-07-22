import os
import requests
from bs4 import BeautifulSoup
import datetime
from flask import Flask, jsonify
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
                return {
                    "balance": data_element.get_text(strip=True),
                    "time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                }
            else:
                return {
                    "error": "データ要素が見つかりませんでした。サイトの構造が変わった可能性があります。"
                }
    except Exception as e:
        return {"error": f"スクレイピング中にエラーが発生しました: {str(e)}"}


# --- Flaskアプリの定義 ---
app = Flask(__name__)


@app.route("/")
def handler():
    data = get_data_balance()
    response = jsonify(data)

    # CORS設定（iPhoneのScriptableからアクセス可能にする）
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    return response


# --- ローカル開発用 ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)
