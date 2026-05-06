'use client';

import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  Tooltip, 
  ResponsiveContainer, 
  LabelList, 
  ReferenceLine,
  Cell
} from 'recharts';
import { getTeamColor } from '@/lib/team-colors';
import styles from './PredictionVisualizer.module.css';

interface Prediction {
  driver: string;
  team: string;
  predicted_pos: number;
  confidence: number;
  base_pace: number;
  deg_coef?: number;
  consistency: number;
  performance_index: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <span className={styles.tooltipLabel}>{data.name}</span>
        <span className={styles.tooltipItem}>Pace: <span className={styles.tooltipValue}>{data.pace}s</span></span>
        <span className={styles.tooltipItem}>Cons: <span className={styles.tooltipValue}>±{data.consistency}s</span></span>
        <span className={styles.tooltipItem}>Rank: <span className={styles.tooltipValue}>P{data.pos}</span></span>
      </div>
    );
  }
  return null;
};

const PredictionVisualizer = ({ data }: { data: Prediction[] }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map(p => ({
    name: p.driver,
    pace: p.base_pace,
    consistency: p.consistency,
    pos: p.predicted_pos,
    team: p.team
  }));

  // Calculate midpoints for the quadrant lines
  const avgPace = chartData.reduce((acc, curr) => acc + curr.pace, 0) / chartData.length;
  const avgCons = chartData.reduce((acc, curr) => acc + curr.consistency, 0) / chartData.length;

  // Domain padding
  const paces = chartData.map(d => d.pace);
  const minPace = Math.min(...paces) - 0.2;
  const maxPace = Math.max(...paces) + 0.2;

  const cons = chartData.map(d => d.consistency);
  const maxCons = Math.max(...cons) + 0.1;

  return (
    <div className={styles.visualizerCard}>
      <h3 className={styles.title}>
        Performance Analysis: Pace vs Consistency
      </h3>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
            <XAxis 
              type="number" 
              dataKey="pace" 
              name="Base Pace" 
              unit="s" 
              domain={[minPace, maxPace]} 
              reversed // Lower pace is faster
              stroke="#475569"
              fontSize={10}
              tick={{ fill: '#64748b' }}
              label={{ value: 'FASTER 🏎️', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
            />
            <YAxis 
              type="number" 
              dataKey="consistency" 
              name="Consistency" 
              domain={[0, maxCons]} 
              reversed // Lower SD is more consistent
              stroke="#475569"
              fontSize={10}
              tick={{ fill: '#64748b' }}
              label={{ value: 'MORE STABLE 📈', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }}
            />
            <ZAxis type="number" dataKey="pos" range={[100, 100]} />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Quadrant Lines */}
            <ReferenceLine x={avgPace} stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
            <ReferenceLine y={avgCons} stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />

            {/* Quadrant Labels */}
            <text x="10%" y="10%" className={styles.quadrantLabel}>ELITE OPS</text>
            <text x="85%" y="10%" className={styles.quadrantLabel}>FAST BUT ERRATIC</text>
            <text x="10%" y="90%" className={styles.quadrantLabel}>STABLE BUT SLOW</text>
            <text x="85%" y="90%" className={styles.quadrantLabel}>BACKMARKER</text>

            <Scatter name="Drivers" data={chartData}>
              {chartData.map((entry, index) => {
                const teamColor = getTeamColor(entry.team);
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={teamColor} 
                    stroke={entry.pos <= 3 ? '#fff' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={entry.pos <= 3 ? 2 : 1}
                    fillOpacity={0.8}
                  />
                );
              })}
              <LabelList dataKey="name" position="top" offset={10} style={{ fill: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PredictionVisualizer;
