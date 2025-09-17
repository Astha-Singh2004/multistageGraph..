import React, { useState } from "react";
import ReactFlow, { Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
function useSmallScreen(breakpoint = 640) {
  const [isSmall, setIsSmall] = React.useState(window.innerWidth < breakpoint);

  React.useEffect(() => {
    function onResize() {
      setIsSmall(window.innerWidth < breakpoint);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isSmall;
}

const graph = [
  [],
  [[2, 9], [3, 7], [4, 5]],
  [[5, 3], [6, 5]],
  [[5, 4], [6, 6], [7, 5]],
  [[6, 6], [7, 2], [8, 7]],
  [[9, 5], [10, 6]],
  [[9, 7], [10, 4], [11, 2]],
  [[10, 5], [11, 3]],
  [[11, 7]],
  [[12, 6]],
  [[12, 4]],
  [[12, 2]],
  []
];

const shortestPathDP = (graph, src, dest) => {
  const n = graph.length - 1;
  let cost = Array(n + 1).fill(Infinity);
  let path = Array(n + 1).fill(-1);

  cost[dest] = 0;

  for (let i = n - 1; i >= 1; i--) {
    for (let [v, w] of graph[i]) {
      if (cost[v] !== Infinity && w + cost[v] < cost[i]) {
        cost[i] = w + cost[v];
        path[i] = v;
      }
    }
  }

  let resultPath = [];
  let u = src;
  while (u !== -1) {
    resultPath.push(u);
    if (u === dest) break;
    u = path[u];
  }
  return { cost: cost[src], path: resultPath };
};

const nodePositionsLarge = {
  1: { x: 0, y: 150 },
  2: { x: 200, y: 50 },
  3: { x: 200, y: 150 },
  4: { x: 200, y: 250 },
  5: { x: 400, y: 30 },
  6: { x: 400, y: 130 },
  7: { x: 400, y: 230 },
  8: { x: 400, y: 330 },
  9: { x: 600, y: 60 },
  10: { x: 600, y: 160 },
  11: { x: 600, y: 260 },
  12: { x: 800, y: 160 }
};

const nodePositionsSmall = {
  1: { x: 0, y: 70 },
  2: { x: 80, y: 10 },
  3: { x: 80, y: 70 },
  4: { x: 80, y: 130 },
  5: { x: 160, y: 5 },
  6: { x: 160, y: 55 },
  7: { x: 160, y: 115 },
  8: { x: 160, y: 175 },
  9: { x: 240, y: 20 },
  10: { x: 240, y: 70 },
  11: { x: 240, y: 120 },
  12: { x: 300, y: 70 }
};

const GraphVisualizer = () => {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [result, setResult] = useState(null);

  const isSmallScreen = useSmallScreen(640);
  const nodePositions = isSmallScreen ? nodePositionsSmall : nodePositionsLarge;
  const height = isSmallScreen ? 250 : 500;

  const handleSolve = () => {
    const src = Number(source);
    const dest = Number(destination);
    if (
      isNaN(src) ||
      isNaN(dest) ||
      src < 1 ||
      src > 12 ||
      dest < 1 ||
      dest > 12
    ) {
      setResult({ cost: "Invalid input", path: [] });
      setHighlightedEdges([]);
      return;
    }
    const res = shortestPathDP(graph, src, dest);
    setResult(res);
    let edgesOnPath = [];
    for (let i = 0; i < res.path.length - 1; i++) {
      edgesOnPath.push([res.path[i], res.path[i + 1]]);
    }
    setHighlightedEdges(edgesOnPath);
  };

  const nodes = Object.entries(nodePositions).map(([id, pos]) => ({
    id,
    data: { label: id },
    position: pos,
    style: {
      background:
        id === source
          ? "#34d399"
          : id === destination
            ? "#6b7280"
            : "#fca5a5",
      color: "#fff",
      fontWeight: "bold",
      borderRadius: "50%",
      width: isSmallScreen ? 24 : 40,
      height: isSmallScreen ? 24 : 40,
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }
  }));

  const edges = [];
  for (let u = 1; u <= 12; u++) {
    graph[u].forEach(([v, w]) => {
      const id = `${u}-${v}`;
      edges.push({
        id,
        source: String(u),
        target: String(v),
        label: String(w),
        animated: highlightedEdges.some(([a, b]) => a === u && b === v),
        style: {
          stroke: highlightedEdges.some(([a, b]) => a === u && b === v)
            ? "red"
            : "black"
        },
        labelStyle: { fill: "blue", fontWeight: "bold" }
      });
    });
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 w-full min-h-screen">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center sm:text-left">
        MULTISTAGE GRAPH
      </h1>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-8">
        <input
          className="border border-gray-300 p-8 sm:p-3 rounded-md w-full sm:w-auto flex-1 sm:flex-none"
          type="number"
          min="1"
          max="12"
          placeholder="Source (1-12)"
          value={source}
          onChange={e => setSource(e.target.value)}
        />
        <input
          className="border border-gray-300 p-4 px-8 sm:p-3 rounded-md w-full sm:w-auto flex-1 sm:flex-none"
          type="number"
          min="1"
          max="12"
          placeholder="Destination (1-12)"
          value={destination}
          onChange={e => setDestination(e.target.value)}
        />
        <button
          onClick={handleSolve}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-3 rounded-md font-medium transition-colors w-full sm:w-auto"
        >
          Find Path
        </button>
      </div>
      {result && (
        <div className="mb-4 p-3 sm:p-4 md:p-8 bg-gray-100 rounded-lg shadow-sm border">
          {typeof result.cost === "number" && (
            <p className="font-bold text-sm sm:text-base mb-1">
              Minimum Cost: <span className="text-blue-600">{result.cost}</span>
            </p>
          )}
          <p className="font-bold text-sm sm:text-base">
            Path:{" "}
            <span className="text-green-600">
              {result.path && result.path.length > 0
                ? result.path.join(" → ")
                : "No path"}
            </span>
          </p>
        </div>
      )}
      <div
        className="w-full border border-gray-300 md:p-10 md:pl-12 rounded-lg overflow-hidden bg-white shadow-sm"
        style={{
          height: height,
          maxWidth: isSmallScreen ? 450 : 2000,
          minWidth: 200
        }}
      >
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Controls className="!bottom-2 !left-2" />
          <Background />
        </ReactFlow>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded border">
          <div className="w-4 h-4 bg-green-400 rounded-full"></div>
          <span>Source Node</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span>Destination Node</span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded border">
          <div className="w-4 h-4 bg-red-300 rounded-full"></div>
          <span>Regular Node</span>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualizer;
