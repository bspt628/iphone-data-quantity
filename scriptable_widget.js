// HISモバイル データ残量ウィジェット (プログレスバー付き)
// VercelにデプロイしたAPIエンドポイントのURLに変更してください
const API_URL = "https://iphone-data-quantity-lau8.vercel.app/"; // ★ここを実際のVercelURLに変更

// API認証パスワード (★重要: 実際のパスワードに変更してください)
const API_PASSWORD = "secure_api_key_2025"; // ★Vercelで設定したAPI_PASSWORDと同じ値

// データプラン容量設定 (MB単位)
const TOTAL_DATA_MB = 7000; // 7GB = 7000MB (お客様のプランに合わせて変更)

// APIからデータを取得（認証付き）
async function fetchDataBalance() {
	try {
		// パスワード認証付きのURL構築
		const authenticatedURL = `${API_URL}?password=${encodeURIComponent(
			API_PASSWORD
		)}`;

		const request = new Request(authenticatedURL);
		const response = await request.loadJSON();

		if (response.error) {
			throw new Error(response.error);
		}

		return {
			balance: parseInt(response.balance), // MB単位
			time: response.time,
		};
	} catch (error) {
		console.error("API呼び出しエラー:", error);
		return {
			balance: 0,
			time: "エラー",
			error: error.message,
		};
	}
}

// プログレスバーを描画（Scriptable対応・確実に動作）
function drawProgressBar(drawContext, rect, progress, color) {
	const textWidth = 40; // パーセンテージ表示用の幅を確保
	const barWidth = rect.width - textWidth - 15; // プログレスバーの幅を調整
	const barHeight = 12;
	const barX = 5;
	const barY = rect.height / 2 - barHeight / 2;

	// 背景バー（薄いグレー）
	drawContext.setFillColor(new Color("#E5E5EA"));
	drawContext.fillRect(new Rect(barX, barY, barWidth, barHeight));

	// プログレスバー（色付き）
	if (progress > 0 && progress <= 1) {
		drawContext.setFillColor(color);
		const progressWidth = barWidth * progress;
		drawContext.fillRect(new Rect(barX, barY, progressWidth, barHeight));
	}

	// パーセンテージをプログレスバーの右側に表示
	drawContext.setTextAlignedLeft();
	drawContext.setTextColor(new Color("#000000"));
	drawContext.setFont(Font.boldSystemFont(14));

	const percentText = `${Math.round(progress * 100)}%`;
	const textX = barX + barWidth + 8; // プログレスバーの右側に配置
	const textY = barY - 2; // バーと同じ高さに配置

	drawContext.drawTextInRect(
		percentText,
		new Rect(textX, textY, textWidth, barHeight + 4)
	);
}

// メイン処理
async function createWidget() {
	const data = await fetchDataBalance();
	const widget = new ListWidget();

	// 背景色を設定
	widget.backgroundColor = new Color("#FFFFFF");

	if (data.error) {
		// エラー表示
		const errorText = widget.addText("❌ 接続エラー");
		errorText.font = Font.boldSystemFont(14);
		errorText.textColor = Color.red();

		const detailText = widget.addText(data.error);
		detailText.font = Font.systemFont(12);
		detailText.textColor = Color.gray();

		return widget;
	}

	// ヘッダー
	const header = widget.addText("📱 HISモバイル");
	header.font = Font.boldSystemFont(16);
	header.textColor = new Color("#007AFF");
	header.centerAlignText();

	widget.addSpacer(8);

	// プログレスバー描画エリア
	const progressRect = new Rect(0, 0, 120, 40);
	const drawContext = new DrawContext();
	drawContext.size = new Size(120, 40);
	drawContext.respectScreenScale = true;

	// 使用量を計算 (残量から使用量を逆算)
	const remainingMB = data.balance;
	const usedMB = TOTAL_DATA_MB - remainingMB;
	const usageProgress = Math.max(0, Math.min(1, usedMB / TOTAL_DATA_MB));

	// 使用量に応じて色を変更
	let progressColor;
	if (usageProgress < 0.5) {
		progressColor = new Color("#34C759"); // 緑 (余裕あり)
	} else if (usageProgress < 0.8) {
		progressColor = new Color("#FF9500"); // オレンジ (注意)
	} else {
		progressColor = new Color("#FF3B30"); // 赤 (警告)
	}

	drawProgressBar(drawContext, progressRect, usageProgress, progressColor);

	const progressImage = drawContext.getImage();
	const imageWidget = widget.addImage(progressImage);
	imageWidget.centerAlignImage();

	widget.addSpacer(8);

	// データ残量表示
	const balanceText = widget.addText(`残量: ${remainingMB}MB`);
	balanceText.font = Font.boldSystemFont(14);
	balanceText.centerAlignText();

	// 使用量表示
	const usageText = widget.addText(`使用: ${usedMB}MB / ${TOTAL_DATA_MB}MB`);
	usageText.font = Font.systemFont(12);
	usageText.textColor = Color.gray();
	usageText.centerAlignText();

	widget.addSpacer(4);

	// 更新時刻
	const timeText = widget.addText(`🕒 ${data.time}`);
	timeText.font = Font.systemFont(10);
	timeText.textColor = Color.gray();
	timeText.centerAlignText();

	return widget;
}

// 実行
const widget = await createWidget();

if (config.runsInWidget) {
	// ホーム画面ウィジェット
	Script.setWidget(widget);
} else {
	// アプリ内でのプレビュー
	widget.presentSmall();
}

Script.complete();
