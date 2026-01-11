const analyzeBtn = document.getElementById("analyzeBtn");
const canvas = document.getElementById("chartCanvas");
const ctx = canvas.getContext("2d");
const summary = document.getElementById("summary");

analyzeBtn.addEventListener("click", () => {
  const fileInput = document.getElementById("chartUpload");
  const minPrice = parseFloat(document.getElementById("minPrice").value);
  const maxPrice = parseFloat(document.getElementById("maxPrice").value);

  if (!fileInput.files[0] || isNaN(minPrice) || isNaN(maxPrice)) {
    return alert("Upload a chart and enter min & max prices!");
  }

  const img = new Image();
  img.src = URL.createObjectURL(fileInput.files[0]);
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // OpenCV processing
    let src = cv.imread(img);
    let gray = new cv.Mat();
    let edges = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150);

    // Detect all high and low points
    const highs = [];
    const lows = [];
    for (let x = 0; x < edges.cols; x++) {
      for (let y = 0; y < edges.rows; y++) {
        if (edges.ucharPtr(y, x)[0] > 0) {
          if (!highs[x] || y < highs[x]) highs[x] = y;
          if (!lows[x] || y > lows[x]) lows[x] = y;
        }
      }
    }

    // Convert pixel position to price
    const getPrice = y => maxPrice - (y / canvas.height) * (maxPrice - minPrice);

    // Highlight trades > 300 pips
    let tradeCount = 0;
    ctx.lineWidth = 2;
    for (let x = 0; x < edges.cols; x += 5) { // sample every 5px
      if (highs[x] && lows[x]) {
        const pipDiff = Math.abs(getPrice(highs[x]) - getPrice(lows[x])) * 10000; // assume 4 decimal pairs
        if (pipDiff >= 300) {
          ctx.strokeStyle = "red";
          ctx.beginPath();
          ctx.moveTo(x, highs[x]);
          ctx.lineTo(x, lows[x]);
          ctx.stroke();
          tradeCount++;
        }
      }
    }

    summary.textContent = `Detected ${tradeCount} potential trades ≥ 300 pips`;

    src.delete(); gray.delete(); edges.delete();
  };
});
