'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// Helper function to format indices - show raw API values without decimals
const formatIndexValue = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  
  // Handle comma-separated numbers from API
  let num: number;
  if (typeof value === 'string') {
    // Remove commas and parse as float
    const cleanValue = value.replace(/,/g, '');
    num = parseFloat(cleanValue);
  } else {
    num = value;
  }
  
  if (isNaN(num)) return 'N/A';
  
  const result = Math.floor(num).toString();
  
  // Show raw API value but remove decimals
  return result;
};

// Helper function to format ETF prices with rupee symbol
const formatETFPrice = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'N/A';
  return `₹${num.toFixed(2)}`;
};

// Helper function to format percentages with 2 decimals
const formatPercentage = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? 'N/A' : num.toFixed(2);
};

// Helper function to get color class for percentage values
const getColorClass = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === '') return 'text-gray-400';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'text-gray-400';
  return num >= 0 ? 'text-green-600' : 'text-red-600';
};

// Data interfaces - Adjust to match your page.tsx types
interface Index {
  name: string;
  current_price: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}
interface ETF {
  name: string;
  current_price: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}
interface Sector {
  name: string;
  current_price?: string | number;
  daily_change_pct: string | number;
  returns: { '1m'?: string | number; '6m'?: string | number; '1y'?: string | number; '2y'?: string | number };
}

// Table Components - REPLACE THESE WITH YOUR FULL CODE FROM page.tsx (keep all columns/colors/tooltips)
const IndicesPerformanceCard: React.FC<{ indices: Index[] }> = ({ indices }) => {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Indices Performance</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 px-2 font-medium text-gray-600">Index</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600">Value</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
              <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
            </tr>
          </thead>
          <tbody>
            {indices.map((index) => (
              <tr key={index.name} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">{index.name}</td>
                <td className="py-2 px-2 text-right text-gray-900">{formatIndexValue(index.current_price)}</td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.daily_change_pct)}`}>
                    {formatPercentage(index.daily_change_pct)}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['1m'])}`}>
                    {formatPercentage(index.returns['1m'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['6m'])}`}>
                    {formatPercentage(index.returns['6m'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['1y'])}`}>
                    {formatPercentage(index.returns['1y'])}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  <span className={`font-medium ${getColorClass(index.returns['2y'])}`}>
                    {formatPercentage(index.returns['2y'])}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ETFsPerformanceCard: React.FC<{ etfs: ETF[] }> = ({ etfs }) => (
  <div className="space-y-1">
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">ETFs Performance</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 px-2 font-medium text-gray-600">ETF</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600">Price</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
          </tr>
        </thead>
        <tbody>
          {etfs.map((etf) => (
            <tr key={etf.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-900">{etf.name}</td>
              <td className="py-2 px-2 text-right text-gray-900">{formatETFPrice(etf.current_price)}</td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.daily_change_pct)}`}>
                  {formatPercentage(etf.daily_change_pct)}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['1m'])}`}>
                  {formatPercentage(etf.returns['1m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['6m'])}`}>
                  {formatPercentage(etf.returns['6m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['1y'])}`}>
                  {formatPercentage(etf.returns['1y'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(etf.returns['2y'])}`}>
                  {formatPercentage(etf.returns['2y'])}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SectorsPerformanceTable: React.FC<{ sectors: Sector[] }> = ({ sectors }) => (
  <div className="space-y-1">
    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Sectoral Performance</h4>
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-1 px-2 font-medium text-gray-600">Sector</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Day">1D</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Month">1M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="6 Months">6M</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="1 Year">1Y</th>
            <th className="text-right py-1 px-2 font-medium text-gray-600" title="2 Years">2Y</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((sector) => (
            <tr key={sector.name} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 px-2 font-medium text-gray-900">{sector.name}</td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.daily_change_pct)}`}>
                  {formatPercentage(sector.daily_change_pct)}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['1m'])}`}>
                  {formatPercentage(sector.returns['1m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['6m'])}`}>
                  {formatPercentage(sector.returns['6m'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['1y'])}`}>
                  {formatPercentage(sector.returns['1y'])}%
                </span>
              </td>
              <td className="py-2 px-2 text-right">
                <span className={`font-medium ${getColorClass(sector.returns['2y'])}`}>
                  {formatPercentage(sector.returns['2y'])}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

interface Props {
  sectors: Sector[];
  etfs: ETF[];
  indices: Index[];
  financialLoading: boolean;
  financialData?: any;
}

// Draggable Widget Component with persistent position
function DraggableWidget({ 
  children, 
  isExpanded, 
  setIsExpanded, 
  position, 
  onDragEnd 
}: { 
  children: React.ReactNode; 
  isExpanded: boolean; 
  setIsExpanded: (expanded: boolean) => void;
  position: { x: number; y: number };
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: 'market-glance-widget',
  });

  // Base position from state + live transform during drag
  const style = {
    position: 'fixed' as const,
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 50,
    width: '480px',
    maxHeight: '70vh',
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden sm:w-[95vw] sm:max-w-xl"
    >
      <div
        className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 text-gray-800 border-b border-gray-200 p-3 flex items-center justify-between cursor-move select-none"
        {...listeners}
        {...attributes}
        role="button"
        tabIndex={0}
        aria-label="Drag Market Glance"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold">Market Glance</h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="p-1 rounded hover:bg-white/20"
          aria-expanded={isExpanded}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      <div
        className={`bg-white overflow-y-auto transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[70vh] opacity-100 p-4 space-y-4' : 'max-h-0 opacity-0 p-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function MarketGlanceWidget({ sectors, etfs, indices, financialLoading, financialData }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const savedPos = localStorage.getItem('marketGlancePos');
    if (savedPos) {
      setPosition(JSON.parse(savedPos));
    } else {
      // Default position: bottom-right corner
      setPosition({ 
        x: typeof window !== 'undefined' ? window.innerWidth - 480 - 24 : 0, // 480px widget + 24px margin
        y: typeof window !== 'undefined' ? window.innerHeight - 500 - 24 : 0 // 500px height + 24px margin
      });
    }
    const savedExpanded = localStorage.getItem('marketGlanceExpanded');
    if (savedExpanded !== null) setIsExpanded(JSON.parse(savedExpanded));
  }, []);

  useEffect(() => {
    localStorage.setItem('marketGlancePos', JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem('marketGlanceExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Escape key handler for mobile modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileModalOpen) {
        setIsMobileModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMobileModalOpen]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: Math.max(0, Math.min(prev.x + delta.x, window.innerWidth - 480)),
      y: Math.max(0, Math.min(prev.y + delta.y, window.innerHeight - 500)),
    }));
  }, []);

  if (financialLoading) {
    return (
      <>
        {/* Desktop loading */}
        <div className="hidden md:block fixed right-6 bottom-6 z-50 w-[480px] p-4 bg-white rounded-2xl shadow-2xl border border-gray-200 text-center text-sm text-gray-500">
          Loading markets...
        </div>
        {/* Mobile FAB (loading state) */}
        <button
          disabled
          className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gray-400 rounded-full shadow-lg flex items-center justify-center text-white opacity-50 cursor-not-allowed"
          aria-label="Market Data Loading"
        >
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </>
    );
  }

  if (!financialData || (sectors.length === 0 && etfs.length === 0 && indices.length === 0)) {
    return null;
  }

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={() => setIsMobileModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-transform duration-200"
        aria-label="Open Market Data"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {/* Mobile Modal */}
      {isMobileModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white overflow-y-auto" role="dialog" aria-modal="true">
          {/* Sticky header with close button */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Market Glance</h2>
            </div>
            <button
              onClick={() => setIsMobileModalOpen(false)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Close Market Data"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tables */}
          <div className="p-4 space-y-6 pb-24">
            <IndicesPerformanceCard indices={indices} />
            <ETFsPerformanceCard etfs={etfs} />
            <SectorsPerformanceTable sectors={sectors} />
          </div>
        </div>
      )}

      {/* Desktop Widget */}
      <div className="hidden md:block">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
          <DraggableWidget 
            isExpanded={isExpanded} 
            setIsExpanded={setIsExpanded}
            position={position}
            onDragEnd={handleDragEnd}
          >
            <IndicesPerformanceCard indices={indices} />
            <ETFsPerformanceCard etfs={etfs} />
            <SectorsPerformanceTable sectors={sectors} />
          </DraggableWidget>
        </DndContext>
      </div>
    </>
  );
}
