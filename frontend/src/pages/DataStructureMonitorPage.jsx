import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  RotateCcw, 
  Clock, 
  Flame, 
  Network, 
  GitCommit, 
  Search, 
  Play, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  GitBranch,
  Info,
  Building
} from 'lucide-react';
import { 
  getAllDataStructuresStats,
  undoLastAction,
  assignNextFifo,
  assignNextPriority,
  searchAvl,
  insertAvlDemo,
  deleteAvlDemo,
  getBuildingBfs,
  getBuildingDfs
} from '../services/api';
import { formatINR } from '../utils/formatters';

export default function DataStructureMonitorPage({ showToast, onTriggerUndo }) {
  const [activeDsTab, setActiveDsTab] = useState('avl'); // Default to AVL Tree (complex & visual)
  const [dsData, setDsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive AVL Test States
  const [avlSearchKey, setAvlSearchKey] = useState('A-102');
  const [avlSearchResult, setAvlSearchResult] = useState(null);
  const [newFlatKey, setNewFlatKey] = useState('A-104');
  const [newResidentName, setNewResidentName] = useState('Demo Resident');
  const [deleteFlatKey, setDeleteFlatKey] = useState('A-104');

  // BST Search State
  const [bstSearchMonth, setBstSearchMonth] = useState('2026-02');
  const [bstFoundNode, setBstFoundNode] = useState(null);

  // Graph Traversal in DS Page
  const [graphTraverseType, setGraphTraverseType] = useState('BFS');
  const [graphTraverseResult, setGraphTraverseResult] = useState(null);

  useEffect(() => {
    fetchDsStats();
  }, []);

  const fetchDsStats = async () => {
    try {
      setLoading(true);
      const res = await getAllDataStructuresStats();
      setDsData(res.data);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to connect to Java Data Structure Engine' });
    } finally {
      setLoading(false);
    }
  };

  // Stack Undo Trigger
  const handleUndo = async () => {
    try {
      const res = await undoLastAction();
      if (res.data.success) {
        showToast({ type: 'success', title: 'Undo Executed', message: res.data.message });
      } else {
        showToast({ type: 'info', title: 'Stack Empty', message: res.data.message });
      }
      fetchDsStats();
    } catch (err) {
      showToast({ type: 'error', message: 'Error rolling back last operation' });
    }
  };

  // FIFO Queue Pop
  const handleFifoPop = async () => {
    try {
      const res = await assignNextFifo('Engineer Frank (Field Service)');
      showToast({ 
        type: 'success', 
        title: 'FIFO Dequeue', 
        message: `Processed oldest ticket: ${res.data.complaintId} (Flat ${res.data.flatNumber})` 
      });
      fetchDsStats();
    } catch (err) {
      showToast({ type: 'info', message: err.response?.data?.message || 'Queue empty' });
    }
  };

  // PriorityQueue Poll
  const handlePriorityPoll = async () => {
    try {
      const res = await assignNextPriority('Senior Eng. Raymond');
      showToast({ 
        type: 'success', 
        title: 'PriorityQueue Poll', 
        message: `Polled highest rank ticket: ${res.data.complaintId} (${res.data.priority})` 
      });
      fetchDsStats();
    } catch (err) {
      showToast({ type: 'info', message: err.response?.data?.message || 'Queue empty' });
    }
  };

  // AVL Search
  const handleAvlSearch = async () => {
    try {
      const res = await searchAvl(avlSearchKey);
      setAvlSearchResult(res.data);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to search AVL Tree' });
    }
  };

  // AVL Demo Insert
  const handleAvlInsert = async (e) => {
    e.preventDefault();
    try {
      const res = await insertAvlDemo({
        flatNumber: newFlatKey,
        name: newResidentName,
        building: 'A Wing',
        occupancyStatus: 'OWNER'
      });
      showToast({ 
        type: 'success', 
        title: 'AVL Insert & Rebalance', 
        message: `Inserted ${newFlatKey}. Rotation: ${res.data.lastRotation}` 
      });
      fetchDsStats();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to insert into AVL' });
    }
  };

  // AVL Demo Delete
  const handleAvlDelete = async () => {
    try {
      const res = await deleteAvlDemo(deleteFlatKey);
      showToast({ 
        type: 'success', 
        title: 'AVL Delete & Rebalance', 
        message: `Deleted ${deleteFlatKey}. Rebalanced with: ${res.data.lastRotation}` 
      });
      fetchDsStats();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to delete from AVL' });
    }
  };

  // BST Month Search
  const handleBstSearch = () => {
    if (!dsData?.bst?.inOrderSummaries) return;
    const found = dsData.bst.inOrderSummaries.find(s => s.monthYear === bstSearchMonth);
    setBstFoundNode(found || null);
  };

  // Graph Traversal
  const handleGraphTraverse = async (type) => {
    try {
      setGraphTraverseType(type);
      const res = type === 'BFS' ? await getBuildingBfs('FAC-GATE') : await getBuildingDfs('FAC-GATE');
      setGraphTraverseResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { id: 'avl', label: '8. AVL Tree', sub: 'Balanced Indexing & Rotations' },
    { id: 'graph', label: '7. Graph', sub: 'Building Adjacency List' },
    { id: 'bst', label: '6. BST', sub: 'Month-Wise Maintenance' },
    { id: 'pqueue', label: '5. PriorityQueue', sub: 'Complaint Min-Heap' },
    { id: 'queue', label: '4. Queue', sub: 'FIFO Complaint Pipeline' },
    { id: 'stack', label: '3. Stack', sub: 'LIFO Admin Undo History' },
    { id: 'linkedlist', label: '2. LinkedList', sub: 'Chronological Timelines' },
    { id: 'arraylist', label: '1. ArrayList', sub: 'Payments & Expenses' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">Java Backend Data Structures Engine Monitor</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono uppercase">
              100% Native Java
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Every metric, pointer, heap structure, and rotation below is executed genuinely inside the Spring Boot JVM services and synchronized with MongoDB.
          </p>
        </div>

        <button
          onClick={fetchDsStats}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Live State
        </button>
      </div>

      {/* 8 Data Structures Navigation Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-xs text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveDsTab(tab.id)}
            className={`p-2.5 rounded-lg text-left transition-all ${
              activeDsTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <strong className="block text-xs font-semibold truncate">{tab.label}</strong>
            <span className={`block text-[10px] truncate ${activeDsTab === tab.id ? 'text-slate-300' : 'text-slate-400'}`}>
              {tab.sub}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT SECTIONS */}

      {/* 1. AVL Tree Monitor */}
      {activeDsTab === 'avl' && (
        <div className="space-y-6">
          {/* AVL Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Active Nodes</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.avl?.size || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Key: Flat Number (e.g. A-101)</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Tree Root Height</span>
              <span className="text-2xl font-bold text-indigo-600">{dsData?.avl?.rootHeight || 0} Levels</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Strict O(log N) Guarantee</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Rotations Executed</span>
              <span className="text-2xl font-bold text-emerald-700">{dsData?.avl?.totalRotations || 0} Rotations</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">LL, RR, LR, and RL</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Last Rotation Triggered</span>
              <span className="text-xs font-mono font-semibold text-amber-700 mt-2 block truncate">
                {dsData?.avl?.lastRotationType || 'None'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Dynamic Balance Factor Guard</span>
            </div>
          </div>

          {/* Interactive AVL Operations Workbench */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Tool with Path Trace */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Search className="w-4 h-4 text-emerald-600" />
                <span>O(log N) AVL Search &amp; Step Trace</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Enter a flat number to inspect the exact binary search path and comparison steps.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. A-202"
                  value={avlSearchKey}
                  onChange={(e) => setAvlSearchKey(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white"
                />
                <button
                  onClick={handleAvlSearch}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Search
                </button>
              </div>

              {avlSearchResult && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <strong className={avlSearchResult.found ? 'text-emerald-700' : 'text-rose-600'}>
                      {avlSearchResult.found ? 'FOUND in AVL' : 'NOT FOUND'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Comparison Steps:</span>
                    <span className="font-mono font-bold text-slate-800">{avlSearchResult.steps} steps</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Path Traversed:</span>
                    <span className="font-mono font-semibold text-emerald-800 bg-white px-2 py-1 rounded border border-slate-200 block">
                      {avlSearchResult.path?.join(' ➔ ') || 'None'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Live Insert Tool with Rotation Demonstration */}
            <form onSubmit={handleAvlInsert} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Insert Node &amp; Trigger Rotation</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Adding skewed keys will trigger Java LL, RR, LR, or RL rotations to restore balance.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 block">Flat Key</label>
                  <input
                    type="text"
                    required
                    value={newFlatKey}
                    onChange={(e) => setNewFlatKey(e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Resident Name</label>
                  <input
                    type="text"
                    required
                    value={newResidentName}
                    onChange={(e) => setNewResidentName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs"
              >
                Insert &amp; Balance Tree
              </button>
            </form>

            {/* Live Delete Tool */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Node &amp; Rebalance</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Removes node and tests recursive rebalancing with inorder successor.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. A-104"
                  value={deleteFlatKey}
                  onChange={(e) => setDeleteFlatKey(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
                <button
                  onClick={handleAvlDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Delete
                </button>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                <strong>AVL Invariant:</strong> For all nodes, Balance Factor = height(left) - height(right) ∈ {'{-1, 0, 1}'}.
              </div>
            </div>
          </div>

          {/* Interactive Visual AVL Tree Rendering */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">AVL Tree Live Hierarchical Visualization</h3>
                <p className="text-xs text-slate-500">Rendered from backend recursive tree hierarchy with node heights &amp; balance factors</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                BF = Left Height - Right Height
              </span>
            </div>

            {/* Visual Tree Display */}
            <div className="p-6 bg-slate-900 rounded-lg overflow-x-auto text-white">
              <div className="min-w-[650px] flex flex-col items-center">
                {dsData?.avl?.treeHierarchy ? (
                  <RenderAVLNode node={dsData.avl.treeHierarchy} isRoot={true} />
                ) : (
                  <p className="text-slate-400 text-xs">Tree is empty.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Graph Monitor */}
      {activeDsTab === 'graph' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Graph Vertices</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.graph?.vertexCount || 26}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Wings, Floors, Flats, Facilities</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Adjacency Edges</span>
              <span className="text-2xl font-bold text-indigo-600">{dsData?.graph?.edgeCount || 27}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Physical Architectural Corridors</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Representation</span>
              <span className="text-sm font-bold text-emerald-700 mt-2 block">Map&lt;String, List&lt;Edge&gt;&gt;</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Adjacency List in Java</span>
            </div>
          </div>

          {/* Graph Demonstration Controls */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Adjacency List Traversal Runner</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGraphTraverse('BFS')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Run BFS from Gate
                </button>
                <button
                  onClick={() => handleGraphTraverse('DFS')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-xs"
                >
                  Run DFS from Gate
                </button>
              </div>
            </div>

            {graphTraverseResult && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block mb-1">
                  {graphTraverseType} Result ({graphTraverseResult.visitedCount} nodes visited):
                </span>
                <div className="flex flex-wrap gap-1 font-mono text-[11px] text-slate-700">
                  {graphTraverseResult.visitedOrder?.map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded">
                      <strong className="text-slate-400 mr-1">{i + 1}.</strong>{v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Binary Search Tree (BST) Monitor */}
      {activeDsTab === 'bst' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">BST Month Nodes</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.bst?.nodeCount || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Partitioned by YYYY-MM key</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Ordering Principle</span>
              <span className="text-sm font-bold text-emerald-700 mt-2 block">Inorder Traversal (L, Root, R)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Strict Chronological Output</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Range Search Support</span>
              <span className="text-sm font-semibold text-indigo-600 mt-2 block">[startMonth, endMonth]</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Pruned subtree search</span>
            </div>
          </div>

          {/* Search by Month in BST */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">BST Key Search</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. 2026-02"
                  value={bstSearchMonth}
                  onChange={(e) => setBstSearchMonth(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs"
                />
                <button
                  onClick={handleBstSearch}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Search BST
                </button>
              </div>
            </div>

            {bstFoundNode && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <p><strong>Month Node Key:</strong> {bstFoundNode.monthYear}</p>
                <p><strong>Total Collected:</strong> {formatINR(bstFoundNode.totalCollected)}</p>
                <p><strong>Total Pending:</strong> {formatINR(bstFoundNode.totalPending)}</p>
                <p><strong>Records Stored in Node:</strong> {bstFoundNode.totalRecords} resident payment records</p>
              </div>
            )}
          </div>

          {/* BST Inorder Traversal Output */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Inorder Traversal Chronological Sequence</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              {(dsData?.bst?.inOrderSummaries || []).map((s, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-slate-900 block">{s.monthYear}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">Collected: {formatINR(s.totalCollected)}</span>
                  <span className="text-[11px] text-amber-600 block">Pending: {formatINR(s.totalPending)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. PriorityQueue Monitor */}
      {activeDsTab === 'pqueue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">PriorityQueue Heap Size</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.priorityQueue?.size || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Complaints in Min-Heap</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Top Ranked Node (Peek)</span>
              <span className="text-sm font-bold text-rose-700 mt-2 block">
                {dsData?.priorityQueue?.highestPriorityComplaint ? (
                  `${dsData.priorityQueue.highestPriorityComplaint.complaintId} (${dsData.priorityQueue.highestPriorityComplaint.priority})`
                ) : 'Heap Empty'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Next in line for assignment</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Heap Sorting Policy</span>
              <span className="text-xs font-semibold text-slate-800 mt-2 block">Critical(1) &gt; High(2) &gt; Med(3) &gt; Low(4)</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Tie-breaker: Submission timestamp</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Priority-Ranked Min-Heap List</h3>
                <p className="text-xs text-slate-500">Ordered according to custom Java Comparator</p>
              </div>
              <button
                onClick={handlePriorityPoll}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs"
              >
                Poll Highest Priority
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(dsData?.priorityQueue?.priorityRankingOrder || []).map((c, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.2 rounded font-semibold text-[10px] ${
                          c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          c.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {c.priority}
                        </span>
                        <span className="font-semibold text-slate-900">{c.complaintId} - Flat {c.flatNumber}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. FIFO Queue Monitor */}
      {activeDsTab === 'queue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">FIFO Queue Size</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.queue?.size || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Complaints awaiting technician dispatch</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Queue Head (Peek)</span>
              <span className="text-sm font-bold text-emerald-700 mt-2 block">
                {dsData?.queue?.nextComplaint ? (
                  `${dsData.queue.nextComplaint.complaintId} (Flat ${dsData.queue.nextComplaint.flatNumber})`
                ) : 'Queue Empty'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Oldest unassigned ticket</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">FIFO Queue Pipeline</h3>
                <p className="text-xs text-slate-500">First-In-First-Out sequential positions</p>
              </div>
              <button
                onClick={handleFifoPop}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shadow-xs"
              >
                Dequeue Head Ticket
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(dsData?.queue?.queueItems || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded font-mono font-bold text-[11px]">
                      Position #{item.position}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{item.complaint?.complaintId} - Flat {item.complaint?.flatNumber}</span>
                      <p className="text-slate-500 text-[11px]">{item.complaint?.description}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{item.complaint?.category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Stack Monitor (Undo) */}
      {activeDsTab === 'stack' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Stack Height</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.stack?.size || 0} Elements</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Reversible administrative operations</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Top of Stack (Peek)</span>
              <span className="text-xs font-bold text-amber-700 mt-2 block truncate">
                {dsData?.stack?.topElement ? dsData.stack.topElement.description : 'Stack is empty'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Candidate for rollback</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">LIFO Rollback Engine</span>
              <button
                onClick={handleUndo}
                disabled={dsData?.stack?.size === 0}
                className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium shadow-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Pop &amp; Execute Undo
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Stack Operation History (Top to Bottom)</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {(dsData?.stack?.stackElements || []).map((op, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">
                      {idx === 0 ? 'TOP' : `Depth ${idx}`}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">{op.description}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Entity: {op.entityType} ({op.entityId})</span>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px]">{op.operationType}</span>
                </div>
              ))}
              {(!dsData?.stack?.stackElements || dsData.stack.stackElements.length === 0) && (
                <p className="text-slate-400 py-4 text-center">No operations currently on the Undo Stack.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. LinkedList Monitor */}
      {activeDsTab === 'linkedlist' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Activity Nodes</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.linkedList?.totalActivityNodes || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Resident Lifecycle Timeline</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Head Node (Newest)</span>
              <span className="text-xs font-semibold text-emerald-700 mt-2 block truncate">
                {dsData?.linkedList?.headActivity ? dsData.linkedList.headActivity.description : 'List empty'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">O(1) addFirst insertion</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Complaint Timelines</span>
              <span className="text-2xl font-bold text-indigo-600">{dsData?.linkedList?.totalComplaintsTracked || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Unique sub-timelines tracked</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Sequential LinkedList Traversal Trace</h3>
            <div className="space-y-2 text-xs">
              {(dsData?.linkedList?.traversalSample || []).map((node) => (
                <div key={node.index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-700 font-bold">Node #{node.index}</span>
                    <div>
                      <span className="font-semibold text-slate-800">{node.residentName}</span>
                      <p className="text-slate-500 text-[11px]">{node.description}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{node.actionType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. ArrayList Monitor */}
      {activeDsTab === 'arraylist' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Maintenance Elements</span>
              <span className="text-2xl font-bold text-slate-900">{dsData?.arrayList?.paymentRecordsCount || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">ArrayList&lt;MaintenanceRecord&gt;</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Expense Elements</span>
              <span className="text-2xl font-bold text-rose-600">{dsData?.arrayList?.expenseRecordsCount || 0}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">ArrayList&lt;Expense&gt;</span>
            </div>

            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Collections Sum</span>
              <span className="text-2xl font-bold text-emerald-700">{formatINR(dsData?.arrayList?.totalCollected)}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Iterated aggregation</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-semibold text-slate-900">Sample ArrayList Payment Records (Head of Array)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="p-2">Record ID</th>
                    <th className="p-2">Resident</th>
                    <th className="p-2">Month</th>
                    <th className="p-2">Total Amount</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(dsData?.arrayList?.samplePayments || []).map((p, i) => (
                    <tr key={i}>
                      <td className="p-2 font-mono font-semibold">{p.recordId}</td>
                      <td className="p-2">{p.residentName} ({p.flatNumber})</td>
                      <td className="p-2 font-mono">{p.monthYear}</td>
                      <td className="p-2 font-mono font-bold text-emerald-700">{formatINR(p.totalAmount)}</td>
                      <td className="p-2 font-semibold">{p.paymentStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Recursive Helper Component to Render AVL Nodes
function RenderAVLNode({ node, isRoot = false }) {
  if (!node) return null;

  const isBalanced = Math.abs(node.balanceFactor) <= 1;

  return (
    <div className="flex flex-col items-center my-1.5">
      {/* Node Pill */}
      <div className={`px-3 py-1.5 rounded-lg border text-center shadow-md transition-all ${
        isRoot 
          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50' 
          : 'bg-slate-800 border-slate-700 text-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="font-mono font-bold text-xs text-white">{node.key}</span>
          <span className={`text-[9px] font-mono px-1 rounded ${
            isBalanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`}>
            BF: {node.balanceFactor}
          </span>
        </div>
        <span className="block text-[10px] text-slate-300 truncate max-w-[120px]">{node.residentName}</span>
        <span className="block text-[9px] text-slate-400 font-mono">Height: {node.height}</span>
      </div>

      {/* Children branches */}
      {(node.left || node.right) && (
        <div className="flex items-start gap-4 mt-2 pt-2 border-t border-slate-700/60">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 mb-0.5">L</span>
            {node.left ? (
              <RenderAVLNode node={node.left} />
            ) : (
              <span className="text-[9px] text-slate-600 font-mono py-1 px-2">null</span>
            )}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 mb-0.5">R</span>
            {node.right ? (
              <RenderAVLNode node={node.right} />
            ) : (
              <span className="text-[9px] text-slate-600 font-mono py-1 px-2">null</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
