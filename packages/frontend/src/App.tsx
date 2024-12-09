import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  Activity,
  Box,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Maximize2,
  Calendar,
  Filter,
  RefreshCw,
  Settings,
  LogOut,
  User,
  LayoutGrid,
  History,
  Zap,
  Menu,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { div } from "framer-motion/client";
import { LucideIcon } from "lucide-react";
import { app } from "./query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createReplayer } from "react-scan";
import { Replay } from "./replay-test";

interface InteractionData {
  id: string;
  name: string;
  type: string;
  time: number;
  timestamp: number;
  route: string | null;
  url: string;
  uniqueInteractionId: string;
  interactionId: string;
  componentPath: string[];
}

interface ComponentData {
  id?: string;
  uniqueInteractionId: string;
  name: string;
  renders: number;
  instances: number;
  totalTime?: number;
  selfTime?: number;
  interactionId: string;
}

interface InteractionStats {
  interactionId: string;
  poor: InteractionData[];
  needsImprovement: InteractionData[];
  great: InteractionData[];
  stats: {
    totalInteractions: number;
    averageTime: number;
    medianTime: number;
  };
}

interface InteractionItemProps {
  item: InteractionData;
}

interface ComponentSidebarProps {
  item: InteractionData;
  isOpen: boolean;
  onClose: () => void;
  onReplayClick: () => void;
}

interface SessionReplayProps {
  onClose: () => void;
  item: InteractionData;
}

interface PerformanceColumnProps {
  title: string;
  timeRange: string;
  items: InteractionData[];
  icon: LucideIcon;
  iconColor: string;
}

interface Component {
  id?: string;
  uniqueInteractionId: string;
  name: string;
  renders: number;
  instances: number;
  totalTime?: number;
  selfTime?: number;
  interactionId: string;
}

interface TimeFrameOption {
  label: string;
  value: string;
}

interface NavProject {
  id: string;
  name: string;
  type: string;
}

interface InteractionsResponse {
  poor: InteractionData[];
  needsImprovement: InteractionData[];
  great: InteractionData[];
  stats: {
    totalInteractions: number;
    averageTime: number;
    medianTime: number;
  };
}

interface eventWithTime {
  timestamp: number;
  type: string;
  data: any;
}

interface ReplayRecord {
  id: string;
  events: eventWithTime[];
}

const timeFrameOptions: TimeFrameOption[] = [
  { label: "Last 12 hours", value: "12h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
];

// const chartData = Array.from({ length: 24 }, (_, i) => {
//   const hour = i.toString().padStart(2, "0");
//   const baseGreat = 15 + Math.sin(i / 3) * 5;
//   const baseNeeds = 8 + Math.cos(i / 4) * 3;
//   const basePoor = 4 + Math.sin(i / 2) * 2;

//   return {
//     time: `${hour}:00`,
//     poor: Math.max(0, Math.round(basePoor + Math.random() * 2)),
//     needsImprovement: Math.max(0, Math.round(baseNeeds + Math.random() * 3)),
//     great: Math.max(0, Math.round(baseGreat + Math.random() * 4)),
//   };
// });

// const generateMockComponents = (baseName: string, count: number) => {
//   const componentTypes = [
//     "List",
//     "Grid",
//     "Card",
//     "Button",
//     "Input",
//     "Form",
//     "Modal",
//     "Dropdown",
//     "Table",
//     "Row",
//     "Cell",
//     "Header",
//     "Footer",
//     "Nav",
//     "Menu",
//     "Item",
//     "Container",
//     "Wrapper",
//     "Panel",
//     "Section",
//     "View",
//     "Layout",
//     "Sidebar",
//     "Content",
//     "Widget",
//     "Chart",
//     "Graph",
//     "Tooltip",
//     "Popover",
//     "Dialog",
//     "Alert",
//     "Toast",
//     "Notification",
//     "Badge",
//     "Avatar",
//     "Icon",
//     "Image",
//     "Text",
//     "Label",
//     "Link",
//     "Heading",
//     "Paragraph",
//     "Divider",
//     "Spacer",
//   ];

//   return Array.from({ length: count }, (_, i) => {
//     const randomType =
//       componentTypes[Math.floor(Math.random() * componentTypes.length)];
//     const componentName = `${baseName}${randomType}${Math.floor(
//       Math.random() * 1000
//     )}`;
//     // More realistic render counts: most components render 1-5 times, some render more
//     const rerenders =
//       Math.random() < 0.8
//         ? Math.max(1, Math.floor(Math.random() * 5)) // 80% chance of 1-5 rerenders
//         : Math.max(5, Math.floor(Math.random() * 15)); // 20% chance of 5-15 rerenders
//     return {
//       name: componentName,
//       rerenders,
//     };
//   });
// };

// const generatePath = (componentName: string): string[] => {
//   const paths = [
//     ["App", "MainLayout", "Dashboard", "Widgets", componentName],
//     ["App", "MainLayout", "Analytics", "Charts", componentName],
//     ["App", "MainLayout", "DataView", "Grid", componentName],
//     ["App", "MainLayout", "Settings", "Forms", componentName],
//     ["App", "MainLayout", "UserProfile", "Details", componentName],
//   ];
//   return paths[Math.floor(Math.random() * paths.length)];
// };

// const devices = [
//   "iPhone 14 Pro",
//   "iPhone 14",
//   "iPhone 13 Pro",
//   "iPhone 13",
//   "Pixel 7 Pro",
//   "Pixel 7",
//   "Pixel 6",
//   "Samsung S23 Ultra",
//   "Samsung S23+",
//   "Samsung S23",
//   "iPad Pro",
//   "iPad Air",
//   "Macbook Pro",
//   "Macbook Air",
// ];

// const componentPrefixes = [
//   "Table",
//   "Chart",
//   "Form",
//   "List",
//   "Grid",
//   "Modal",
//   "Drawer",
//   "Card",
//   "Button",
//   "Input",
//   "Select",
//   "Menu",
//   "Tab",
//   "Panel",
//   "Dialog",
// ];

// const generateInteractionItem = (
//   prefix: string,
//   durationRange: [number, number]
// ): InteractionData => {
//   const [min, max] = durationRange;
//   const duration = Math.floor(min + Math.random() * (max - min));
//   const name = `${prefix}${Math.random().toString(36).substring(2, 6)}`;
//   const id = crypto.randomUUID();

//   return {
//     id,
//     name,
//     type: "pointer",
//     time: duration,
//     timestamp: Date.now(),
//     route: "/some/route",
//     url: "http://localhost:3000/some/route",
//     uniqueInteractionId: crypto.randomUUID(),
//     interactionId: id,
//     componentPath: generatePath(name),
//   };
// };

// const generateMockData = () => {
//   const data: {
//     poor: InteractionData[];
//     needsImprovement: InteractionData[];
//     great: InteractionData[];
//   } = {
//     poor: [],
//     needsImprovement: [],
//     great: [],
//   };

//   // Generate 25 items for each category for plenty of scrolling
//   componentPrefixes.forEach((prefix) => {
//     for (let i = 0; i < 5; i++) {
//       data.poor.push(generateInteractionItem(prefix, [501, 1500]));
//       data.needsImprovement.push(generateInteractionItem(prefix, [201, 500]));
//       data.great.push(generateInteractionItem(prefix, [50, 200]));
//     }
//   });

//   return data;
// };

// const mockData = generateMockData();

// const exampleEdenTreaty = () => {
//   app.components({ interactionId: "..." }).get();
//   app.interactions.get();
//   app.replay({ interactionId: "..." }).get();
// };

const SessionReplay: React.FC<SessionReplayProps> = ({ onClose, item }) => {
  const replayContainerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof createReplayer> | null>(null);

  const { data: replayRecord } = useSuspenseQuery({
    queryKey: ["replay", item.interactionId],
    queryFn: () =>
      app
        .replay({ interactionId: item.interactionId })
        .get()
        .then((res) => res.data as ReplayRecord | null),
  });

  // useEffect(() => {
  //   if (replayContainerRef.current && replayRecord?.events) {
  //     replayContainerRef.current.innerHTML = "";
  //     const player = createReplayer(
  //       replayRecord.events as any[],
  //       replayContainerRef.current
  //     );
  //     playerRef.current = player;

  //     setTimeout(() => {
  //       const playButton = replayContainerRef.current?.querySelector(
  //         ".rr-controller button"
  //       ) as HTMLButtonElement;
  //       playButton?.click();
  //     }, 100);
  //   }
  // }, [replayRecord]);

  // const handleRestart = () => {
  //   if (replayContainerRef.current && replayRecord?.events) {
  //     replayContainerRef.current.innerHTML = "";
  //     const player = createReplayer(
  //       replayRecord.events as any[],
  //       replayContainerRef.current
  //     );
  //     playerRef.current = player;

  //     setTimeout(() => {
  //       const playButton = replayContainerRef.current?.querySelector(
  //         ".rr-controller button"
  //       ) as HTMLButtonElement;
  //       playButton?.click();
  //     }, 100);
  //   }
  // };

  if (!replayRecord?.events) {
    return null;
  }

  // if (Math.random() > 0) {
  //   return <Replay/>
  // }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-8"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg w-full h-full flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <div className="flex items-center gap-4">
              <h2 className="text-zinc-100 font-medium">Session Replay</h2>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400">{item.name}</span>
            </div>
            <motion.button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Main content */}
          <div className="flex flex-1 min-h-0">
            {/* Video player section */}
            <Replay replay={replayRecord.events} />
            {/* <div className="flex-1 border-r border-zinc-800 p-6 flex flex-col">
              <div className="relative h-full w-full">
                <div ref={replayContainerRef} className="h-full w-full" />
                <button
                  onClick={handleRestart}
                  className="absolute bottom-4 right-4 px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-md text-sm hover:bg-zinc-700"
                >
                  Restart Replay
                </button>
              </div>
            </div> */}

            {/* Log section */}
            <div className="w-[500px] flex flex-col">
              {/* Stats */}
              <div className="p-6 border-b border-zinc-800 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-zinc-500">Duration</div>
                  <div className="text-zinc-200 text-lg">
                    {item.time.toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Components</div>
                  <div className="text-zinc-200 text-lg">
                    {item.componentPath.length}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">Total Renders</div>
                  <div className="text-zinc-200 text-lg">
                    {item.componentPath.reduce(
                      (acc: number, comp: string) =>
                        acc + comp.split(":").length - 1,
                      0
                    )}
                  </div>
                </div>
              </div>

              {/* Log list */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {item.componentPath.map((comp: string, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between py-3 px-4 rounded bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-zinc-300 text-sm">{comp}</span>
                      <span className="text-zinc-500 text-xs">
                        {idx * 50}ms
                      </span>
                    </div>
                    <span className="text-zinc-400 text-sm">
                      {comp.split(":").length - 1} renders
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ComponentSidebar: React.FC<ComponentSidebarProps> = ({
  item,
  isOpen,
  onClose,
  onReplayClick,
}) => {
  const totalRerenders = item.componentPath.length;
  const avgRerenders = (totalRerenders / item.componentPath.length).toFixed(1);
  const [isPathOpen, setIsPathOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"time" | "rerenders" | "name">("time");
  const [searchQuery, setSearchQuery] = useState("");

  const sortedAndFilteredComponents = useMemo(() => {
    let filtered = item.componentPath.filter((comp) =>
      comp.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "time":
          return item.componentPath.indexOf(a) - item.componentPath.indexOf(b);
        case "rerenders":
          return b.split(":").length - 1 - a.split(":").length;
        case "name":
          return a.localeCompare(b);
        default:
          return 0;
      }
    });
  }, [item.componentPath, sortBy, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[300px] bg-[#111111] border-l border-zinc-800/50 z-40"
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <div className="flex-1">
                <h2 className="text-zinc-200 text-[8px] font-medium">
                  {item.name}
                </h2>
                <div className="text-zinc-500 text-[7px]">
                  {item.componentPath[0]}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-300"
              >
                <PanelRightClose size={14} />
              </button>
            </div>

            {/* Action Bar */}
            <div className="px-3 py-2 border-b border-zinc-800/50 flex items-center gap-2">
              <button
                onClick={onReplayClick}
                className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 rounded text-[7px] text-zinc-300 hover:bg-zinc-800/80"
              >
                <Play size={10} />
                Replay Interaction
              </button>
              <div
                className={`text-[7px] ${
                  item.time > 500
                    ? "text-red-400"
                    : item.time > 200
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {item.time.toFixed(2)}ms
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/20">
              <div>
                <div className="text-zinc-500 text-[7px]">Components</div>
                <div className="text-zinc-200 text-[8px] font-medium mt-0.5">
                  {item.componentPath.length}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-[7px]">Total Rerenders</div>
                <div className="text-zinc-200 text-[8px] font-medium mt-0.5">
                  {totalRerenders}
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-[7px]">Avg. Rerenders</div>
                <div className="text-zinc-200 text-[8px] font-medium mt-0.5">
                  {avgRerenders}
                </div>
              </div>
            </div>

            {/* Component Path */}
            <div className="border-b border-zinc-800/50">
              <button
                onClick={() => setIsPathOpen(!isPathOpen)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-zinc-900/30"
              >
                <span className="text-zinc-400 text-[7px] font-medium tracking-wider uppercase">
                  Component Path
                </span>
                <ChevronDown
                  size={12}
                  className={`text-zinc-500 transition-transform ${
                    isPathOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isPathOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-zinc-900/20"
                  >
                    <div className="px-3 py-1.5 space-y-0.5">
                      {item.componentPath.map((component, idx, arr) => (
                        <motion.div
                          key={idx}
                          className="flex items-center text-xs"
                          style={{ paddingLeft: `${idx * 12}px` }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <div className="flex items-center py-1">
                            <div className="flex items-center space-x-1.5">
                              {idx > 0 && (
                                <motion.div
                                  className="h-[1px] w-2 bg-zinc-700"
                                  initial={{ width: 0 }}
                                  animate={{ width: 8 }}
                                  transition={{
                                    duration: 0.1,
                                    delay: idx * 0.03,
                                  }}
                                />
                              )}
                              <span
                                className={`${
                                  idx === arr.length - 1
                                    ? "text-zinc-300"
                                    : "text-zinc-500"
                                }`}
                              >
                                {component}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Controls */}
            <div className="px-3 py-1.5 border-b border-zinc-800/50 bg-zinc-900/20">
              <div className="flex gap-1">
                <button
                  onClick={() => setSortBy("time")}
                  className={`px-2 py-1 text-[7px] rounded ${
                    sortBy === "time"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  Time
                </button>
                <button
                  onClick={() => setSortBy("rerenders")}
                  className={`px-2 py-1 text-[7px] rounded ${
                    sortBy === "rerenders"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  Rerenders
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`px-2 py-1 text-[7px] rounded ${
                    sortBy === "name"
                      ? "bg-zinc-800 text-zinc-200"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  Name
                </button>
              </div>
              <div className="mt-1.5">
                <div className="relative">
                  <Search
                    size={10}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter components..."
                    className="w-full bg-zinc-900 rounded pl-6 pr-2 py-1 text-[7px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Component List */}
            <div className="flex-1 overflow-auto">
              <div className="px-3 py-2">
                <div className="text-zinc-400 text-[7px] font-medium tracking-wider uppercase">
                  Rerendered Components
                </div>
              </div>
              <div className="px-3 space-y-[1px]">
                {sortedAndFilteredComponents.map((comp, idx) => (
                  <motion.div
                    key={comp}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.01 }}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-zinc-900/40 hover:bg-zinc-900/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-zinc-300 text-[7px] truncate pr-3">
                          {comp}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[7px] whitespace-nowrap">
                            {item.componentPath.indexOf(comp) * 50}ms
                          </span>
                          <span
                            className={`text-[7px] px-1 py-0.5 rounded ${
                              comp.split(":").length - 1 > 10
                                ? "bg-red-500/10 text-red-400"
                                : comp.split(":").length - 1 > 5
                                ? "bg-yellow-500/10 text-yellow-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {comp.split(":").length - 1}×
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const InteractionItem: React.FC<InteractionItemProps> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("rerenders");
  const [showReplay, setShowReplay] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="border border-zinc-800 bg-zinc-900">
      {/* Main row */}
      <div
        className="flex items-center h-8 cursor-pointer hover:bg-zinc-800/50 px-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-zinc-500 text-[10px] w-24">pointer</div>
        <div className="flex-1 text-zinc-300 text-[10px]">{item.name}</div>
        <div className="flex items-center space-x-3">
          <span className="text-zinc-500 text-[10px]">
            {item.componentPath[0]}
          </span>
          <span
            className={`text-[10px] ${
              item.time > 500
                ? "text-red-400"
                : item.time > 200
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {item.time.toFixed(2)}ms
          </span>
          <ChevronRight
            size={14}
            className={`text-zinc-600 transform transition-transform ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="overflow-hidden border-t border-zinc-800/50"
          >
            {/* Tab buttons */}
            <motion.div
              className="flex gap-2 p-4"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              <div className="flex gap-2 flex-1">
                <motion.button
                  onClick={() => setActiveTab("rerenders")}
                  className={`px-2 py-1 rounded-md text-[9px] flex items-center gap-1.5 transition-colors ${
                    activeTab === "rerenders"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw size={12} />
                  Re-renders
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab("path")}
                  className={`px-2 py-1 rounded-md text-[9px] flex items-center gap-1.5 transition-colors ${
                    activeTab === "path"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-400 hover:text-zinc-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Box size={12} />
                  Parents
                </motion.button>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSidebar(true);
                  }}
                  className="text-[9px] text-zinc-400 hover:text-zinc-300 flex items-center gap-1.5 px-2 py-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <PanelRight size={12} />
                  Expand
                </motion.button>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReplay(true);
                  }}
                  className="text-[9px] text-zinc-400 hover:text-zinc-300 flex items-center gap-1.5 px-2 py-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play size={12} />
                  Replay
                </motion.button>
              </div>
            </motion.div>

            {/* Tab content */}
            <motion.div
              className="px-4 pb-4"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.1 }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "rerenders" && (
                  <motion.div
                    key="rerenders"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2"
                  >
                    {item.componentPath
                      .sort(
                        (a, b) => b.split(":").length - 1 - a.split(":").length
                      )
                      .map((comp, idx) => (
                        <motion.div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-none border border-zinc-800"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <span className="text-zinc-300 text-[10px]">
                            {comp}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 ${
                              comp.split(":").length - 1 > 10
                                ? "text-red-500"
                                : comp.split(":").length - 1 > 5
                                ? "text-yellow-500"
                                : "text-zinc-700"
                            }`}
                          >
                            x{comp.split(":").length - 1}
                          </span>
                        </motion.div>
                      ))}
                  </motion.div>
                )}

                {activeTab === "path" && (
                  <motion.div
                    key="path"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-1 bg-zinc-800/30 rounded p-3"
                  >
                    {item.componentPath.map((component, idx, arr) => (
                      <motion.div
                        key={idx}
                        className="flex items-center text-xs"
                        style={{ paddingLeft: `${idx * 12}px` }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <div className="flex items-center py-1">
                          <div className="flex items-center space-x-1.5">
                            {idx > 0 && (
                              <motion.div
                                className="h-[1px] w-2 bg-zinc-700"
                                initial={{ width: 0 }}
                                animate={{ width: 8 }}
                                transition={{
                                  duration: 0.1,
                                  delay: idx * 0.03,
                                }}
                              />
                            )}
                            <span
                              className={`${
                                idx === arr.length - 1
                                  ? "text-zinc-300"
                                  : "text-zinc-500"
                              }`}
                            >
                              {component}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Replay Modal */}
      {showReplay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-zinc-900 rounded-lg shadow-xl max-w-[800px] w-full mx-4"
          >
            <SessionReplay item={item} onClose={() => setShowReplay(false)} />
          </motion.div>
        </motion.div>
      )}

      {/* Component List Sidebar */}
      <ComponentSidebar
        item={item}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onReplayClick={() => setShowReplay(true)}
      />
    </div>
  );
};
const keep = ["bg-zinc-700"];

const Navigation = () => {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const projects: NavProject[] = [
    { id: "1", name: "Rob Pruzan's projects", type: "personal" },
    { id: "2", name: "Team Projects", type: "team" },
    { id: "3", name: "Archived Projects", type: "archived" },
  ];

  return (
    <div className="border-b border-zinc-800">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-2">
          <div className="font-mono text-sm font-semibold">React Scan</div>
          <ChevronRight size={16} className="text-zinc-600 mx-2" />
          {/* <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Box className="text-white" size={20} />
          </div> */}

          {/* Breadcrumb */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-zinc-800"
              >
                <User size={16} className="text-zinc-400" />
                <span className="text-zinc-100 text-xs">
                  Rob Pruzan's projects
                </span>
                <ChevronDown size={16} className="text-zinc-400" />
              </button>

              {/* Project Menu */}
              <AnimatePresence>
                {showProjectMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg py-1"
                  >
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-800 text-zinc-300"
                      >
                        {project.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ChevronRight size={16} className="text-zinc-600 mx-2" />

            <div className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-zinc-800">
              <span className="text-zinc-400">FS</span>
              <span className="text-zinc-100">fsa</span>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <button className="text-zinc-400 hover:text-zinc-300">
            Feedback
          </button>

          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700"
            >
              RP
            </button>

            {/* Profile Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg py-1"
                >
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 text-zinc-300 flex items-center bg-inherit">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-800 text-zinc-300 flex items-center bg-inherit">
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// const Sidebar = () => {
//   const navItems = [
//     { icon: Zap, label: "Interactions", href: "/interactions" },
//     { icon: LayoutGrid, label: "Components", href: "/components" },
//     { icon: History, label: "Replays", href: "/replays" },
//   ];

//   const bottomItems = [
//     { icon: Settings, label: "Settings", href: "/settings" },
//     { icon: User, label: "Account", href: "/account" },
//   ];

//   return (
//     <div className="fixed left-0 top-0 h-full w-[240px] border-r border-zinc-800 flex flex-col">
//       {/* Logo section */}
//       <div className="h-14 px-4 flex items-center border-b justify-center gap-x-6 font-mono border-zinc-800 w-full">
//         <div className="font-bold text-xl">React Scan</div>
//         {/* <div className="w-8 h-8 bg-indigo-500 rounded-lg  flex items-center justify-evenly"> */}
//         <Box className="text-white" size={20} />
//         {/* </div> */}
//       </div>

//       {/* Main navigation */}

//       {/* Bottom section */}
//       <div className="p-2 border-t border-zinc-800">
//         {bottomItems.map((item) => (
//           <button
//             key={item.label}
//             className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-300 transition-colors bg-inherit"
//           >
//             <item.icon size={16} className="text-zinc-500" />
//             <span>{item.label}</span>
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

const PerformanceColumn: React.FC<PerformanceColumnProps> = ({
  title,
  timeRange,
  items,
  icon: Icon,
  iconColor,
}) => (
  <div className="bg-zinc-900 border border-zinc-800 flex flex-col">
    <div className="flex items-center justify-between p-4 border-b border-zinc-800">
      <div className="flex items-center space-x-2">
        <Icon className={iconColor} size={16} />
        <span className="text-zinc-200">{title}</span>
      </div>
      <span className="text-zinc-500 text-sm">{timeRange}</span>
    </div>

    <div className="flex-1 overflow-hidden">
      <div className="h-[calc(100vh-480px)] overflow-y-auto space-y-2 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
            <Box className="mb-2" size={24} />
            <span>No data</span>
          </div>
        ) : (
          items
            .sort((a, b) => b.time - a.time)
            .map((item, index) => <InteractionItem key={index} item={item} />)
        )}
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-[220px] bg-zinc-800/50 rounded animate-pulse" />
);

const ColumnSkeleton = () => (
  <div className="bg-zinc-900 border border-zinc-800 flex flex-col h-[calc(100vh-480px)]">
    <div className="p-4 border-b border-zinc-800 animate-pulse">
      <div className="h-6 bg-zinc-800/50 rounded w-32" />
    </div>
    <div className="flex-1 p-4 space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 bg-zinc-800/50 rounded animate-pulse" />
      ))}
    </div>
  </div>
);

const PerformanceDashboard = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("12h");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const getTimeRange = (timeFrame: string) => {
    const now = Date.now();
    switch (timeFrame) {
      case "12h":
        return { from: now - 12 * 60 * 60 * 1000, to: now };
      case "24h":
        return { from: now - 24 * 60 * 60 * 1000, to: now };
      case "7d":
        return { from: now - 7 * 24 * 60 * 60 * 1000, to: now };
      case "30d":
        return { from: now - 30 * 24 * 60 * 60 * 1000, to: now };
      default:
        return { from: now - 12 * 60 * 60 * 1000, to: now };
    }
  };

  const timelineStatsQuery = useSuspenseQuery({
    queryKey: ["timeline-stats", selectedTimeFrame],
    queryFn: () => {
      const range = getTimeRange(selectedTimeFrame);
      return app["stats-timeline"]
        .get({ query: range })
        .then((res) => res.data);
    },
    staleTime: 1000,
  });

  const interactionsQuery = useSuspenseQuery({
    queryKey: ["interactions"],
    queryFn: async () => {
      const response =
        (await app.interactions.get().then((res) => res.data)) ?? [];
      return {
        poor: response.flatMap((stat) => stat.poor),
        needsImprovement: response.flatMap((stat) => stat.needsImprovement),
        great: response.flatMap((stat) => stat.great),
        stats: response.reduce(
          (acc, curr) => ({
            totalInteractions:
              acc.totalInteractions + curr.stats.totalInteractions,
            averageTime: (acc.averageTime + curr.stats.averageTime) / 2,
            medianTime: (acc.medianTime + curr.stats.medianTime) / 2,
          }),
          {
            totalInteractions: 0,
            averageTime: 0,
            medianTime: 0,
          }
        ),
      };
    },
    staleTime: 1000,
  });

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        {/* <Sidebar /> */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-4">
            {/* Chart Section */}
            <div className="bg-zinc-900 border border-zinc-800 p-4">
              {/* Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-md p-1">
                    {timeFrameOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedTimeFrame(option.value)}
                        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                          selectedTimeFrame === option.value
                            ? "bg-zinc-700 text-zinc-100"
                            : "text-zinc-400 hover:text-zinc-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs ${
                      isAutoRefresh
                        ? "text-green-400 bg-green-400/10"
                        : "text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <RefreshCw
                      size={14}
                      className={isAutoRefresh ? "animate-spin" : ""}
                    />
                    Auto-refresh
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-[7px] flex items-center gap-2 px-2 py-1">
                    <Filter size={14} />
                    Filters
                  </button>
                  <button className="text-[7px] flex items-center gap-2 px-2 py-1">
                    <Calendar size={14} />
                    Custom Range
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timelineStatsQuery.data ?? []}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="poor" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#ef4444"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ef4444"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="needsImprovement"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#eab308"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#eab308"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="great" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis
                      dataKey="time"
                      stroke="#71717a"
                      fontSize={8}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "6px",
                        fontSize: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="poor"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#poor)"
                    />
                    <Area
                      type="monotone"
                      dataKey="needsImprovement"
                      stroke="#eab308"
                      strokeWidth={2}
                      fill="url(#needsImprovement)"
                    />
                    <Area
                      type="monotone"
                      dataKey="great"
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#great)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-zinc-400 text-[7px]">
                    {"  Poor (>500ms) "}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-zinc-400 text-[7px]">
                    {" Needs Improvement (200-500ms)"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-zinc-400 text-[7px]">
                    {" Great(< 200ms) "}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Columns */}
            <div className="grid grid-cols-3 gap-4">
              <PerformanceColumn
                title="Poor"
                timeRange="> 500ms"
                items={interactionsQuery.data?.poor ?? []}
                icon={AlertCircle}
                iconColor="text-red-400"
              />
              <PerformanceColumn
                title="Needs Improvement"
                timeRange="200ms - 500ms"
                items={interactionsQuery.data?.needsImprovement ?? []}
                icon={AlertTriangle}
                iconColor="text-yellow-400"
              />
              <PerformanceColumn
                title="Great"
                timeRange="< 200ms"
                items={interactionsQuery.data?.great ?? []}
                icon={CheckCircle2}
                iconColor="text-green-400"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
