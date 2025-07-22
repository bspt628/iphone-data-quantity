// HISモバイル データ残量ウィジェット (円グラフ付き)
// VercelにデプロイしたAPIエンドポイントのURLに変更してください
const API_URL = "https://your-project-name.vercel.app/"; // ★ここを実際のVercelURLに変更

// データプラン容量設定 (MB単位)
const TOTAL_DATA_MB = 7000; // 7GB = 7000MB (お客様のプランに合わせて変更)

// APIからデータを取得
async function fetchDataBalance() {
	try {
		const request = new Request(API_URL);
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

// 円グラフを描画
function drawCircularProgress(drawContext, rect, progress, color) {
	const centerX = rect.width / 2;
	const centerY = rect.height / 2;
	const radius = Math.min(centerX, centerY) - 10;
	const lineWidth = 8;

	// 背景円
	drawContext.setStrokeColor(new Color("#E5E5EA", 0.3));
	drawContext.setLineWidth(lineWidth);
	drawContext.strokeEllipse(
		new Rect(centerX - radius, centerY - radius, radius * 2, radius * 2)
	);

	// プログレス円（使用量）
	if (progress > 0) {
		drawContext.setStrokeColor(color);
		drawContext.setLineWidth(lineWidth);

		const path = new Path();
		const startAngle = -Math.PI / 2; // 12時方向から開始
		const endAngle = startAngle + 2 * Math.PI * progress;

		path.addArc(centerX, centerY, radius, startAngle, endAngle, false);
		drawContext.addPath(path);
		drawContext.strokePath();
	}

	// 中央にパーセンテージ表示
	drawContext.setTextAlignedCenter();
	drawContext.setTextColor(new Color("#000000"));
	drawContext.setFont(Font.boldSystemFont(18));

	const percentText = Math.round(progress * 100) + "%";
	drawContext.drawTextInRect(
		percentText,
		new Rect(centerX - 30, centerY - 10, 60, 20)
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

	// 円グラフ描画エリア
	const progressRect = new Rect(0, 0, 120, 120);
	const drawContext = new DrawContext();
	drawContext.size = new Size(120, 120);
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

	drawCircularProgress(drawContext, progressRect, usageProgress, progressColor);

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
