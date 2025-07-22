#!/bin/bash

echo "🔐 API認証テストスクリプト"
echo "=========================="

API_URL="https://iphone-data-quantity-lau8.vercel.app"
API_PASSWORD="secure_api_key_2025"

echo ""
echo "1️⃣ 認証なしテスト（エラーを期待）"
echo "---------------------------------"
curl -X GET "${API_URL}/" -H "Accept: application/json"

echo ""
echo ""
echo "2️⃣ 間違ったパスワードテスト（エラーを期待）"
echo "-------------------------------------------"
curl -X GET "${API_URL}/?password=wrong_password" -H "Accept: application/json"

echo ""
echo ""
echo "3️⃣ 正しいパスワードテスト（成功を期待）"
echo "---------------------------------------"
curl -X GET "${API_URL}/?password=${API_PASSWORD}" -H "Accept: application/json"

echo ""
echo ""
echo "4️⃣ Authorizationヘッダーテスト（成功を期待）"
echo "--------------------------------------------"
curl -X GET "${API_URL}/" -H "Accept: application/json" -H "Authorization: Bearer ${API_PASSWORD}"

echo ""
echo ""
echo "✅ テスト完了" 