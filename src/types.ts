export interface MapTarget {
  key: string;
  name: string;
  chineseName: string;
  sourceUrl: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  description: string;
  parent?: string;
  layerType: 'world' | 'country' | 'province' | 'city' | 'county_hd';
  estimatedSize: string;
  compileTimeSec: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
