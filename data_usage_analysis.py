#!/usr/bin/env python3
"""
HISモバイル API通信量分析スクリプト
"""


def analyze_api_data_usage():
    print("📊 HISモバイルAPI 通信量分析")
    print("=" * 40)

    # 実測データから算出
    response_body = 44  # bytes - 実測値

    # HTTPリクエストヘッダー（推定）
    request_headers = """GET /?password=secure_api_key_2025 HTTP/2
Host: iphone-data-quantity-lau8.vercel.app
User-Agent: curl/8.7.1
Accept: */*
"""
    request_header_size = len(request_headers.encode("utf-8"))

    # HTTPレスポンスヘッダー（実測から推定）
    response_headers = """HTTP/2 200
access-control-allow-headers: Content-Type, Authorization
access-control-allow-methods: GET
access-control-allow-origin: *
age: 0
cache-control: public, max-age=0, must-revalidate
content-type: application/json
date: Tue, 22 Jul 2025 09:48:22 GMT
server: Vercel
strict-transport-security: max-age=63072000; includeSubDomains; preload
x-vercel-cache: MISS
x-vercel-id: hnd1::iad1::pl4nf-1753177695633-f05b12e7dbd1
content-length: 44
"""
    response_header_size = len(response_headers.encode("utf-8"))

    # TLS/SSL オーバーヘッド（初回接続時）
    tls_handshake = {
        "client_hello": 341,
        "server_hello": 122,
        "certificate": 2593,
        "other_tls": 400,  # 推定
    }
    tls_total = sum(tls_handshake.values())

    # 計算
    http_total = request_header_size + response_header_size + response_body
    first_request_total = http_total + tls_total  # 初回（TLS含む）
    subsequent_request_total = http_total  # 2回目以降（TLS再利用）

    print(f"📡 HTTPリクエストヘッダー: {request_header_size:,} bytes")
    print(f"📨 HTTPレスポンスヘッダー: {response_header_size:,} bytes")
    print(f"📄 レスポンスボディ: {response_body:,} bytes")
    print(f"🔒 TLSハンドシェイク: {tls_total:,} bytes (初回のみ)")
    print("-" * 40)
    print(
        f"🚀 初回リクエスト: {first_request_total:,} bytes ({first_request_total/1024:.2f} KB)"
    )
    print(
        f"⚡ 2回目以降: {subsequent_request_total:,} bytes ({subsequent_request_total/1024:.2f} KB)"
    )

    # 使用頻度別の月間データ使用量計算
    print("\n📈 使用頻度別の月間データ使用量")
    print("-" * 40)

    scenarios = [
        ("手動確認", 10, "月10回程度"),
        ("1日1回", 30, "毎日1回確認"),
        ("1日3回", 90, "朝昼晩の3回"),
        ("1時間毎", 720, "1時間に1回（24h×30日）"),
        ("15分毎", 2880, "15分に1回（高頻度）"),
    ]

    for name, monthly_calls, description in scenarios:
        # 初回1回 + 残りは2回目以降として計算
        if monthly_calls > 0:
            monthly_bytes = (
                first_request_total + (monthly_calls - 1) * subsequent_request_total
            )
        else:
            monthly_bytes = 0

        monthly_kb = monthly_bytes / 1024
        monthly_mb = monthly_kb / 1024

        print(
            f"{name:>8}: {monthly_calls:>4}回 = {monthly_bytes:>7,} bytes ({monthly_kb:>6.1f} KB / {monthly_mb:>4.2f} MB)"
        )
        print(f"           {description}")

    # HISモバイルのデータ残量と比較
    print(f"\n💡 現在のデータ残量: 999MB")
    print(
        f"📊 比較: 1日3回チェック = {(90 * subsequent_request_total / 1024 / 1024):.3f}MB (残量の{(90 * subsequent_request_total / 1024 / 1024 / 999 * 100):.4f}%)"
    )

    # おすすめ設定
    print(f"\n✅ おすすめ設定")
    print(f"- 📱 iPhoneウィジェット: 1時間に1回自動更新")
    print(
        f"- 💾 月間データ使用量: 約{(720 * subsequent_request_total / 1024 / 1024):.2f}MB"
    )
    print(
        f"- 📈 データ残量への影響: 無視できるレベル ({(720 * subsequent_request_total / 1024 / 1024 / 999 * 100):.4f}%)"
    )


if __name__ == "__main__":
    analyze_api_data_usage()
