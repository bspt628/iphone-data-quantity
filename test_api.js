// ScriptableウィジェットのAPI取得部分をテスト
// Node.js環境で実行

const https = require("https");

// 設定
const API_URL = "https://iphone-data-quantity-lau8.vercel.app/";
const TOTAL_DATA_MB = 7000; // 7GB

// APIからデータを取得（Node.js版）
async function fetchDataBalance() {
	return new Promise((resolve, reject) => {
		console.log("🔄 APIを呼び出し中...");
		console.log(`📡 URL: ${API_URL}`);

		https
			.get(API_URL, (res) => {
				let data = "";

				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					try {
						console.log(`📊 レスポンス: ${data}`);
						const response = JSON.parse(data);

						if (response.error) {
							throw new Error(response.error);
						}

						const result = {
							balance: parseInt(response.balance), // MB単位
							time: response.time,
						};

						console.log("✅ データ取得成功:");
						console.log(`   残量: ${result.balance}MB`);
						console.log(`   時刻: ${result.time}`);

						resolve(result);
					} catch (error) {
						console.error("❌ JSONパースエラー:", error);
						reject(error);
					}
				});
			})
			.on("error", (error) => {
				console.error("❌ API呼び出しエラー:", error);
				reject(error);
			});
	});
}

// 使用量計算をテスト
function testUsageCalculation(balance) {
	console.log("\n📈 使用量計算テスト:");

	const remainingMB = balance;
	const usedMB = TOTAL_DATA_MB - remainingMB;
	const usageProgress = Math.max(0, Math.min(1, usedMB / TOTAL_DATA_MB));
	const percentage = Math.round(usageProgress * 100);

	console.log(`   プラン容量: ${TOTAL_DATA_MB}MB (${TOTAL_DATA_MB / 1000}GB)`);
	console.log(`   残量: ${remainingMB}MB`);
	console.log(`   使用量: ${usedMB}MB`);
	console.log(`   使用率: ${percentage}%`);

	// 色分け判定
	let colorStatus;
	if (usageProgress < 0.5) {
		colorStatus = "🟢 緑 (余裕あり)";
	} else if (usageProgress < 0.8) {
		colorStatus = "🟠 オレンジ (注意)";
	} else {
		colorStatus = "🔴 赤 (警告)";
	}
	console.log(`   表示色: ${colorStatus}`);

	return {
		remainingMB,
		usedMB,
		percentage,
		colorStatus,
	};
}

// メイン処理
async function main() {
	console.log("🧪 ScriptableウィジェットAPI取得テスト");
	console.log("=====================================");

	try {
		// 1. API取得テスト
		const data = await fetchDataBalance();

		// 2. 使用量計算テスト
		const calculation = testUsageCalculation(data.balance);

		// 3. ウィジェット表示データのシミュレーション
		console.log("\n📱 ウィジェット表示データ:");
		console.log("┌─────────────────────┐");
		console.log("│   📱 HISモバイル      │");
		console.log("│                     │");
		console.log(`│      ⭕ ${calculation.percentage}%       │`);
		console.log("│     (円グラフ)       │");
		console.log("│                     │");
		console.log(`│  残量: ${calculation.remainingMB}MB      │`);
		console.log(`│使用: ${calculation.usedMB}MB/${TOTAL_DATA_MB}MB│`);
		console.log("│                     │");
		console.log(`│ 🕒 ${data.time}│`);
		console.log("└─────────────────────┘");

		console.log("\n✅ 全テスト完了！ウィジェットは正常に動作するはずです。");
	} catch (error) {
		console.error("\n❌ テスト失敗:", error.message);
		console.log("\n🔧 対処法:");
		console.log("1. Vercel APIが正常にデプロイされているか確認");
		console.log(
			"2. 環境変数 (HIS_USERNAME, HIS_PASSWORD) が設定されているか確認"
		);
		console.log("3. HISモバイルのログイン情報が正しいか確認");
	}
}

// 実行
main();
