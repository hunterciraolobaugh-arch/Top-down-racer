// Draw subtle grid lines
ctx.strokeStyle = "#444";
ctx.lineWidth = 1;
for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
}
for (let j = 0; j < canvas.height; j += 50) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
}
