export enum Device {
  DESKTOP = 0,
  TABLET = 1,
  MOBILE = 2,
}
export interface Session {
  id: string;
  device: Device;
  agent: string;
  wifi: string;
  cpu: number;
  gpu: string | null;
  mem: number;
  // performance: Awaited<ReturnType<typeof getDevicePerformance>>;
}

export interface Interaction {
  id: string; // a hashed unique id for interaction (groupable across sessions)
  name: string; // name of interaction (i.e nav#top-menu.sc-601d0142-19.gHiJkL) or something useful
  type: string; // type of interaction i.e pointer
  time: number; // time of interaction in ms
  timestamp: number;
  route: string | null; // the computed route that handles dynamic params
  url: string;
  // clickhouse + ingest specific types
  projectId?: string;
  sessionId?: string;
  uniqueInteractionId: string;
}

export interface Component {
  interactionId: string; // grouping components by interaction
  name: string;
  renders: number; // how many times it re-rendered / instances (normalized)
  instances: number; // instances which will be used to get number of total renders by * by renders
  totalTime?: number;
  selfTime?: number;
}

export interface IngestRequest {
  interactions: Array<Interaction>;
  components: Array<Component>;
  session: Session;
}