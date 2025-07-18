import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
// eslint-disable-next-line react/display-name
const RetailMap = forwardRef((props, ref) => {
  const { shelves = [], onShelfClick, isPinMode, pins = [], onMapClick } = props;
  const [detectedShelves, setDetectedShelves] = useState([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageURL, setImageURL] = useState(null);
  const [isCvReady, setCvReady] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const checkReady = setInterval(() => {
      if (window.cv && window.cv.imread) {
        setCvReady(true);
        clearInterval(checkReady);
        console.log("✅ OpenCV.js ready.");
      }
    }, 50);
  }, []);

  const handleImageUpload = (file) => {
    if (!file) return;
    const imgURL = URL.createObjectURL(file);
    setImageURL(imgURL);

    const img = new Image();
    img.src = imgURL;

    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      setImageSize({ width: img.width, height: img.height });
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
    };
  };

  const processImage = () => {
    if (!isCvReady || !canvasRef.current) {
      console.error("OpenCV or canvas not ready.");
      return;
    }
    const canvas = canvasRef.current;
    if (canvas.width === 0 || canvas.height === 0) {
      console.error("Canvas is empty or image not loaded.");
      return;
    }

    const srcMat = window.cv.imread(canvas);
    const gray = new window.cv.Mat();
    const blurred = new window.cv.Mat();
    const edges = new window.cv.Mat();

    window.cv.cvtColor(srcMat, gray, window.cv.COLOR_RGBA2GRAY);
    window.cv.GaussianBlur(gray, blurred, new window.cv.Size(5, 5), 0);
    window.cv.Canny(blurred, edges, 50, 150);

    gray.delete();
    blurred.delete();

    const contours = new window.cv.MatVector();
    const hierarchy = new window.cv.Mat();
    window.cv.findContours(edges, contours, hierarchy, window.cv.RETR_TREE, window.cv.CHAIN_APPROX_SIMPLE);
    edges.delete();

    const shapes = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = window.cv.contourArea(contour);
      if (area < 100) continue;

      const approx = new window.cv.Mat();
      window.cv.approxPolyDP(contour, approx, 0.01 * window.cv.arcLength(contour, true), true);

      const points = [];
      for (let j = 0; j < approx.rows; j++) {
        const pt = approx.intPtr(j);
        points.push({ x: pt[0], y: pt[1] });
      }

      const box = {
        x: Math.min(...points.map((p) => p.x)),
        y: Math.min(...points.map((p) => p.y)),
        width: Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)),
        height: Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
      };

      shapes.push({
        id: shapes.length,
        points,
        area,
        boundingBox: box,
        isConvex: window.cv.isContourConvex(approx),
      });

      approx.delete();
    }

    contours.delete();
    hierarchy.delete();

    const uniqueShapes = [];

    function computeIoU(boxA, boxB) {
      const xA = Math.max(boxA.x, boxB.x);
      const yA = Math.max(boxA.y, boxB.y);
      const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
      const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);
      const interW = xB - xA;
      const interH = yB - yA;
      if (interW <= 0 || interH <= 0) return 0;
      const interArea = interW * interH;
      const areaA = boxA.width * boxA.height;
      const areaB = boxB.width * boxB.height;
      return interArea / (areaA + areaB - interArea);
    }

    for (let i = 0; i < shapes.length; i++) {
      const current = shapes[i];
      let isDuplicate = false;
      for (let j = 0; j < uniqueShapes.length; j++) {
        if (computeIoU(current.boundingBox, uniqueShapes[j].boundingBox) > 0.9) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) uniqueShapes.push(current);
    }

    function isContained(inner, outer) {
      return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.width <= outer.x + outer.width &&
        inner.y + inner.height <= outer.y + outer.height
      );
    }

    const finalShelves = uniqueShapes
      .filter((shape) => {
        const hasInner = uniqueShapes.some(
          (other) =>
            other.id !== shape.id &&
            isContained(other.boundingBox, shape.boundingBox)
        );
        return !hasInner;
      })
      .map((shelf, index) => {
        const nid = `n${index + 1}`;
        const matchingShelf = shelves.find((s) => s.nid === nid);
        return {
          ...shelf,
          nid,
          ShelfName: matchingShelf ? matchingShelf.name : ``,
        };
      });

    setDetectedShelves(finalShelves);
    srcMat.delete();
  };


  useImperativeHandle(ref, () => ({
  handleImageUpload,
  processImage,
  getImageSize: () => imageSize,  // <- here
  }));

  const colors = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4",
    "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff",
  ];

  return (
    <div>
      <canvas id="canvasOutput" ref={canvasRef} style={{ position: "absolute", left: "-9999px" }}></canvas>

      {imageURL && (
        <svg
          width={imageSize.width}
          height={imageSize.height}
          style={{ border: "1px solid #ccc" }}
          onClick={(e) => {
            if (isPinMode) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              onMapClick && onMapClick(x, y);
            }
          }}
        >
          <image
            href={imageURL}
            x="0"
            y="0"
            width={imageSize.width}
            height={imageSize.height}
            style={{ pointerEvents: "none" }}
          />

          {detectedShelves.map((shelf, index) => {
            if (!shelf.points || shelf.points.length < 3) {
              console.warn(`Skipping invalid shelf nid=${shelf.nid}`);
              return null;
            }
            return (
              <g key={index}>
                <polygon
                  points={shelf.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill={colors[index % colors.length] + "33"}
                  stroke={colors[index % colors.length]}
                  strokeWidth="2"
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShelfClick && onShelfClick(shelf.nid);
                  }}
                />
                <text
                  x={shelf.boundingBox.x + shelf.boundingBox.width / 2}
                  y={shelf.boundingBox.y + shelf.boundingBox.height / 2}
                  fontSize="14"
                  fill="#000"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  style={{ pointerEvents: "none" }}
                >
                  {`${shelf.ShelfName}`}
                </text>
              </g>
            );
          })}

          {/* Pins */}
          {pins.map((pin, i) => (
            <circle
              key={i}
              cx={pin.x}
              cy={pin.y}
              r="8"
              fill="red"
              stroke="black"
              strokeWidth="2"
            />
          ))}
        </svg>
      )}
    </div>
  );
});

export default RetailMap;
