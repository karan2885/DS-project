import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Building, 
  Layers, 
  Home, 
  MapPin, 
  Route, 
  Compass, 
  Play, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getBuildingGraph, 
  getBuildingBfs, 
  getBuildingDfs, 
  findBuildingPath, 
  getConnectedNodes 
} from '../services/api';

export default function BuildingStructurePage({ showToast }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  // Traversal States
  const [startNode, setStartNode] = useState('FAC-GATE');
  const [bfsResult, setBfsResult] = useState(null);
  const [dfsResult, setDfsResult] = useState(null);
  const [activeTraversalType, setActiveTraversalType] = useState('BFS'); // 'BFS', 'DFS'
  const [traversalStep, setTraversalStep] = useState(0);

  // Path Finder States
  const [pathFrom, setPathFrom] = useState('FAC-GATE');
  const [pathTo, setPathTo] = useState('A-201');
  const [pathResult, setPathResult] = useState(null);

  // Selected Node Details
  const [selectedNode, setSelectedNode] = useState(null);
  const [connectedNeighbors, setConnectedNeighbors] = useState([]);

  useEffect(() => {
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await getBuildingGraph();
      setGraphData(res.data || { nodes: [], links: [] });
      // Run initial BFS from Gate
      handleRunBfs('FAC-GATE');
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load building graph data' });
    } finally {
      setLoading(false);
    }
  };

  const handleRunBfs = async (nodeId = startNode) => {
    try {
      const res = await getBuildingBfs(nodeId);
      setBfsResult(res.data);
      setActiveTraversalType('BFS');
      setTraversalStep((res.data?.visitedOrder || []).length);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to execute BFS traversal' });
    }
  };

  const handleRunDfs = async (nodeId = startNode) => {
    try {
      const res = await getBuildingDfs(nodeId);
      setDfsResult(res.data);
      setActiveTraversalType('DFS');
      setTraversalStep((res.data?.visitedOrder || []).length);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to execute DFS traversal' });
    }
  };

  const handleFindPath = async () => {
    try {
      const res = await findBuildingPath(pathFrom, pathTo);
      setPathResult(res.data || []);
      if (res.data && res.data.length > 0) {
        showToast({ 
          type: 'success', 
          title: 'Shortest Path Discovered', 
          message: `${res.data.length - 1} hops from ${pathFrom} to ${pathTo}.` 
        });
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to compute shortest path' });
    }
  };

  const handleNodeClick = async (node) => {
    setSelectedNode(node);
    try {
      const res = await getConnectedNodes(node.id);
      setConnectedNeighbors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getNodeColor = (type) => {
    switch (type) {
      case 'BUILDING': return 'bg-slate-900 text-white border-slate-700';
      case 'FLOOR': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'FLAT': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'FACILITY': return 'bg-amber-50 text-amber-900 border-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'BUILDING': return <Building className="w-4 h-4 text-emerald-400" />;
      case 'FLOOR': return <Layers className="w-3.5 h-3.5 text-indigo-600" />;
      case 'FLAT': return <Home className="w-3.5 h-3.5 text-emerald-600" />;
      case 'FACILITY': return <MapPin className="w-3.5 h-3.5 text-amber-600" />;
      default: return <MapPin className="w-3.5 h-3.5" />;
    }
  };

  // Group nodes by type for visual hierarchy
  const buildings = (graphData.nodes || []).filter(n => n.type === 'BUILDING');
  const facilities = (graphData.nodes || []).filter(n => n.type === 'FACILITY');
  const floors = (graphData.nodes || []).filter(n => n.type === 'FLOOR');
  const flats = (graphData.nodes || []).filter(n => n.type === 'FLAT');

  const visitedList = activeTraversalType === 'BFS' 
    ? (bfsResult?.visitedOrder || []) 
    : (dfsResult?.visitedOrder || []);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-semibold text-slate-900">
              Building Topology &amp; Adjacency Graph Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Graph modelled in Java with Adjacency Lists: <strong>{graphData.nodes?.length || 26} Vertices</strong> and <strong>{graphData.links?.length || 27} Spatial Edges</strong>
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-medium">Building</span>
          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">Facility</span>
          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">Floor</span>
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">Flat</span>
        </div>
      </div>

      {/* Traversal Controls & Shortest Path Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traversal Tool */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>Graph Traversal Engine (BFS / DFS)</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => handleRunBfs()}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTraversalType === 'BFS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                BFS (Level-Order)
              </button>
              <button
                onClick={() => handleRunDfs()}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  activeTraversalType === 'DFS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                DFS (Deep-Branch)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-slate-500 text-[11px] mb-1">Select Origin Node</label>
              <select
                value={startNode}
                onChange={(e) => {
                  setStartNode(e.target.value);
                  if (activeTraversalType === 'BFS') handleRunBfs(e.target.value);
                  else handleRunDfs(e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
              >
                {graphData.nodes?.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} - {n.label} ({n.type})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => activeTraversalType === 'BFS' ? handleRunBfs() : handleRunDfs()}
              className="mt-4 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs flex items-center gap-1 shrink-0"
            >
              <Play className="w-3.5 h-3.5" /> Run {activeTraversalType}
            </button>
          </div>

          {/* Visited Sequence Trail */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 block mb-1">
              {activeTraversalType} Visited Sequence ({visitedList.length} vertices traversed):
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px]">
              {visitedList.map((nodeId, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    const found = graphData.nodes?.find(n => n.id === nodeId);
                    if (found) handleNodeClick(found);
                  }}
                  className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 cursor-pointer"
                >
                  <span className="text-slate-400 mr-0.5">{idx + 1}.</span>{nodeId}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Shortest Path Finder Tool */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-2">
              <Route className="w-4 h-4 text-indigo-600" />
              <span>Breadth-First Shortest Path Finder</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Source Node (From)</label>
                <select
                  value={pathFrom}
                  onChange={(e) => setPathFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                >
                  {graphData.nodes?.map((n) => (
                    <option key={n.id} value={n.id}>{n.id} ({n.label})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1">Destination Node (To)</label>
                <select
                  value={pathTo}
                  onChange={(e) => setPathTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                >
                  {graphData.nodes?.map((n) => (
                    <option key={n.id} value={n.id}>{n.id} ({n.label})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleFindPath}
              className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-xs flex items-center justify-center gap-1.5"
            >
              Calculate Physical Shortest Path
            </button>
          </div>

          {/* Path Output */}
          {pathResult && (
            <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-[11px]">
              <span className="font-semibold text-indigo-900 block mb-1">
                Optimal Route ({pathResult.length - 1} Navigation Hops):
              </span>
              <div className="flex items-center flex-wrap gap-1 font-mono text-indigo-950 font-semibold">
                {pathResult.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-1.5 py-0.5 bg-white rounded border border-indigo-200 shadow-xs">
                      {step}
                    </span>
                    {idx < pathResult.length - 1 && <ArrowRight className="w-3 h-3 text-indigo-400" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Topological Building Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Structured Hierarchy Nodes */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Societal Topological Hierarchy</h3>
            <span className="text-xs text-slate-400">Click any node to inspect adjacent edges</span>
          </div>

          {/* Facilities Row */}
          <div>
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block mb-2">
              Common Facilities &amp; Access Points
            </span>
            <div className="flex flex-wrap gap-2.5">
              {facilities.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleNodeClick(f)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-2.5 ${getNodeColor(f.type)} ${
                    selectedNode?.id === f.id ? 'ring-2 ring-emerald-500 shadow-sm' : ''
                  }`}
                >
                  {getNodeIcon(f.type)}
                  <div>
                    <span className="font-bold text-xs block">{f.label}</span>
                    <span className="font-mono text-[10px] opacity-75">{f.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Residential Wings Hierarchy (A Wing, B Wing, C Wing) */}
          <div className="space-y-4">
            {buildings.map((bldg) => {
              const bldgFloors = floors.filter(fl => fl.parentId === bldg.id);
              return (
                <div key={bldg.id} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleNodeClick(bldg)}
                      className="flex items-center gap-2 cursor-pointer hover:text-emerald-700"
                    >
                      <Building className="w-4 h-4 text-slate-800" />
                      <h4 className="text-xs font-bold text-slate-900">{bldg.label || bldg.id}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{bldg.id}</span>
                  </div>

                  {/* Floors in Wing */}
                  <div className="space-y-2">
                    {bldgFloors.map((flr) => {
                      const flatsOnFloor = flats.filter(fl => fl.parentId === flr.id);
                      return (
                        <div key={flr.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                          <div 
                            onClick={() => handleNodeClick(flr)}
                            className="cursor-pointer hover:text-indigo-600 flex items-center gap-2 shrink-0"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-semibold text-slate-800">{flr.label || flr.id}</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {flatsOnFloor.map((flat) => (
                              <button
                                key={flat.id}
                                onClick={() => handleNodeClick(flat)}
                                className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                                  selectedNode?.id === flat.id 
                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {flat.id}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Selected Node Inspector & Adjacency List Details */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              <span>Vertex &amp; Adjacency Inspector</span>
            </h3>

            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vertex ID:</span>
                    <strong className="font-mono text-slate-900">{selectedNode.id}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Label:</span>
                    <span className="font-semibold text-slate-800">{selectedNode.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vertex Type:</span>
                    <span className="font-mono text-emerald-700 font-semibold">{selectedNode.type}</span>
                  </div>
                  {selectedNode.description && (
                    <div className="pt-1 text-slate-500">
                      {selectedNode.description}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Adjacent Connected Vertices ({connectedNeighbors.length})
                  </span>
                  <div className="space-y-1.5">
                    {connectedNeighbors.map((adj) => (
                      <div 
                        key={adj.id}
                        onClick={() => handleNodeClick(adj)}
                        className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {getNodeIcon(adj.type)}
                          <span className="font-medium text-slate-800">{adj.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{adj.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Click any building, floor, or flat vertex on the left to inspect its live adjacency list relationships.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
            <strong>Graph Invariant:</strong> Edges are bidirectionally traversed without arbitrary connections, modeling true architectural walkability.
          </div>
        </div>
      </div>
    </div>
  );
}
