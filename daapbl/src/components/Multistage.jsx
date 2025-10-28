import React, { useState } from "react";
import ReactFlow, { 
  Controls, 
  Background, 
  MarkerType,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge
} from "reactflow";
import "reactflow/dist/style.css";

function useSmallScreen(breakpoint = 440) {
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
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: data.fontSize || 14,
            fontWeight: 'bold',
            pointerEvents: 'all',
            backgroundColor: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            color: data.isHighlighted ? '#dc2626' : '#1e40af',
            zIndex: 1000,
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = {
  custom: CustomEdge,
};

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

const GraphVisualizer = () => {
  const [numNodes, setNumNodes] = useState("");
  const [edgesInput, setEdgesInput] = useState("");
  const [stagesInput, setStagesInput] = useState("");
  const [graph, setGraph] = useState([]);
  const [stages, setStages] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [result, setResult] = useState(null);

  const isSmallScreen = useSmallScreen(640);
  const height = isSmallScreen ? 400 : 600;

  const handleBuildGraph = () => {
    const n = Number(numNodes);
    if (isNaN(n) || n < 2) {
      alert("Please enter a valid number of nodes (>= 2)");
      return;
    }

    const edges = edgesInput
      .trim()
      .split("\n")
      .map((line) => line.trim().split(" ").map(Number));

    const tempGraph = Array(n + 1)
      .fill(0)
      .map(() => []);

    for (let [u, v, w] of edges) {
      if (!u || !v || w === undefined) continue;
      if (u <= n && v <= n) tempGraph[u].push([v, w]);
    }

    const stagesList = stagesInput
      .trim()
      .split("\n")
      .map((line) => line.trim().split(" ").map(Number).filter(x => x > 0));

    setGraph(tempGraph);
    setStages(stagesList);
  };

  const handleSolve = () => {
    const src = Number(source);
    const dest = Number(destination);
    if (
      !graph.length ||
      isNaN(src) ||
      isNaN(dest) ||
      src < 0 ||
      src >= graph.length ||
      dest < 0 ||
      dest >= graph.length
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

  const nodePositions = {};
  const stageWidth = isSmallScreen ? 120 : 200;
  const nodeSpacing = isSmallScreen ? 80 : 100;

  stages.forEach((stageNodes, stageIndex) => {
    stageNodes.forEach((nodeId, indexInStage) => {
      const x = stageIndex * stageWidth;
      const y = indexInStage * nodeSpacing;
      nodePositions[nodeId] = { x, y };
    });
  });

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
      width: isSmallScreen ? 32 : 50,
      height: isSmallScreen ? 32 : 50,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
      border: "3px solid #333",
    }
  }));

  const edges = [];
  for (let u = 0; u < graph.length; u++) {
    graph[u]?.forEach(([v, w]) => {
      const isHighlighted = highlightedEdges.some(([a, b]) => a === u && b === v);
      edges.push({
        id: `${u}-${v}`,
        source: String(u),
        target: String(v),
        type: 'custom',
        animated: isHighlighted,
        style: {
          stroke: isHighlighted ? "#ef4444" : "#374151",
          strokeWidth: isHighlighted ? 4 : 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? "#ef4444" : "#374151",
        },
        data: {
          label: String(w),
          isHighlighted: isHighlighted,
          fontSize: isSmallScreen ? 13 : 16,
        },
      });
    });
  }

  return (
    <div className="p-3 sm:p-4 md:p-8 w-full min-h-screen bg-gray-50">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center sm:text-left">
        MULTISTAGE GRAPH
      </h1>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <input
          className="border border-gray-300 p-2 sm:p-3 rounded-md w-full sm:w-auto flex-1 sm:flex-none"
          type="number"
          placeholder="Enter number of nodes"
          value={numNodes}
          onChange={(e) => setNumNodes(e.target.value)}
        />
        <button
          onClick={handleBuildGraph}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:py-3 rounded-md font-medium transition-colors w-full sm:w-auto"
        >
          Build Graph
        </button>
      </div>

      <textarea
        className="border border-gray-300 p-3 rounded-md w-full mb-4"
        rows="5"
        placeholder={`Enter edges in format: u v w (one per line)\nExample:\n0 1 1\n0 2 2\n1 4 11`}
        value={edgesInput}
        onChange={(e) => setEdgesInput(e.target.value)}
      ></textarea>

      <textarea
        className="border border-gray-300 p-3 rounded-md w-full mb-4"
        rows="4"
        placeholder={`Enter stages (nodes in each column, one stage per line):\nExample:\n0\n1 2\n4 5 3\n6 7`}
        value={stagesInput}
        onChange={(e) => setStagesInput(e.target.value)}
      ></textarea>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6">
        <input
          className="border border-gray-300 p-3 rounded-md w-full sm:w-auto flex-1 sm:flex-none"
          type="number"
          placeholder="Source Node"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <input
          className="border border-gray-300 p-3 rounded-md w-full sm:w-auto flex-1 sm:flex-none"
          type="number"
          placeholder="Destination Node"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button
          onClick={handleSolve}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:py-3 rounded-md font-medium transition-colors w-full sm:w-auto"
        >
          Find Path
        </button>
      </div>

      {result && (
        <div className="mb-4 p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
          {typeof result.cost === "number" && (
            <p className="font-bold text-base mb-2">
              Minimum Cost: <span className="text-blue-600 text-xl">{result.cost}</span>
            </p>
          )}
          <p className="font-bold text-base">
            Shortest Path:{" "}
            <span className="text-green-600 text-lg">
              {result.path && result.path.length > 0
                ? result.path.join(" → ")
                : "No path"}
            </span>
          </p>
        </div>
      )}
      <div
        className="w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg"
        style={{
          height: height,
        }}
      >
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.5}
          maxZoom={2}
        >
          <Controls className="!bottom-2 !left-2" />
          <Background color="#ccc" gap={16} />
        </ReactFlow>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border-2 border-green-300">
          <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-green-600"></div>
          <span className="font-medium">Source Node</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-2 border-gray-400">
          <div className="w-6 h-6 bg-gray-500 rounded-full border-2 border-gray-700"></div>
          <span className="font-medium">Destination Node</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-2 border-red-300">
          <div className="w-6 h-6 bg-red-300 rounded-full border-2 border-red-500"></div>
          <span className="font-medium">Regular Node</span>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-bold text-lg mb-2 text-blue-800">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-900">
          <li>Enter the total number of nodes</li>
          <li>Enter edges in format: source destination weight (one per line)</li>
          <li>Enter stages: list nodes in each column (one stage per line)</li>
          <li>Click "Build Graph" to create the visualization</li>
          <li>Enter source and destination nodes, then click "Find Path"</li>
        </ol>
      </div>
    </div>
  );
};

export default GraphVisualizer;
