const analyzeBtn = document.getElementById("analyzeBtn");
const canvas = document.getElementById("chartCanvas");
const ctx = canvas.getContext("2d");
const summary = document.getElementById("summary");

analyzeBtn.addEventListener("click", () => {
  const fileInput = document.getElementById("chartUpload");
  const file = fileInput.files[0];
  if (!file) return alert("Please upload a chart screenshot!");

  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    // Resize canvas
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Basic edge detection with OpenCV.js
    let src = cv.imread(img);
    let gray = new cv.Mat();
    let edges = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150);

    // Find high and low points
    let highY = canvas.height, lowY = 0;
    for (let y = 0; y < edges.rows; y++) {
      for (let x = 0; x < edges.cols; x++) {
        if (edges.ucharPtr(y, x)[0] > 0) {
          if (y < highY) highY = y;
          if (y > lowY) lowY = y;
        }
      }
    }

    // Draw markers
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(canvas.width/2, highY, 6, 0, 2*Math.PI);
    ctx.fill();

    ctx.fillStyle = "green";
    ctx.beginPath();
    ctx.arc(canvas.width/2, lowY, 6, 0, 2*Math.PI);
    ctx.fill();

    // Estimate pip range
    let pipRange = Math.round((lowY - highY) / canvas.height * 1000); // rough estimate
    summary.textContent = `High marked in 🔴 Red, Low in 🟢 Green, Estimated pip range: ${pipRange} pips`;

    // Cleanup
    src.delete(); gray.delete(); edges.delete();
  };
});
