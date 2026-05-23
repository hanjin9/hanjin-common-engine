/**
 * SharedCalendar.tsx — 공통 캘린더 컴포넌트
 * 이벤트 관리 · 미션 관리 · 업무 관리 스케줄 공통 사용
 * 색상별 스케줄 표시: 이벤트🔵 미션🟢 프로모션🟠 공지🔴 챌린지🟣
 */
import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type CalendarEventType = 'event' | 'mission' | 'promo' | 'notice' | 'challenge' | 'schedule';

export interface CalendarEvent {
  id: string | number;
  date: string;       // YYYY-MM-DD
  title: string;
  type: CalendarEventType;
  time?: string;      // HH:MM
  repeat?: 'daily' | 'weekly' | 'monthly' | 'none';
  targetTier?: string;
}

const TYPE_STYLE: Record<CalendarEventType, { color: string; bg: string; label: string; dot: string }> = {
  event:     { color: '#2563eb', bg: '#eff6ff', label: '이벤트',   dot: '🔵' },
  mission:   { color: '#16a34a', bg: '#f0fdf4', label: '미션',     dot: '🟢' },
  promo:     { color: '#ea580c', bg: '#fff7ed', label: '프로모션', dot: '🟠' },
  notice:    { color: '#dc2626', bg: '#fef2f2', label: '공지',     dot: '🔴' },
  challenge: { color: '#7c3aed', bg: '#f5f3ff', label: '챌린지',  dot: '🟣' },
  schedule:  { color: '#0891b2', bg: '#ecfeff', label: '스케줄',  dot: '🔷' },
};

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  events?: CalendarEvent[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  compact?: boolean;
  allowMultiSelect?: boolean;
  onDatesSelected?: (dates: string[]) => void;
}

export default function SharedCalendar({
  events = [],
  onDateClick,
  onEventClick,
  compact = false,
  allowMultiSelect = false,
  onDatesSelected,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // 달력 날짜 계산
  const calDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const last  = new Date(viewYear, viewMonth + 1, 0);
    const days: (string | null)[] = [];
    // 앞 빈칸
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    // 날짜
    for (let d = 1; d <= last.getDate(); d++) {
      days.push(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
    }
    return days;
  }, [viewYear, viewMonth]);

  // 날짜별 이벤트 맵
  const eventMap = useMemo(() => {
    const m: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!m[e.date]) m[e.date] = [];
      m[e.date].push(e);
    });
    return m;
  }, [events]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const toggleDate = (date: string) => {
    if (allowMultiSelect) {
      const next = new Set(selectedDates);
      next.has(date) ? next.delete(date) : next.add(date);
      setSelectedDates(next);
      onDatesSelected?.(Array.from(next).sort());
    } else {
      setSelectedDates(new Set([date]));
      onDateClick?.(date);
    }
  };

  const cellSize = compact ? 28 : 36;
  const fontSize = compact ? 11 : 12;

  return (
    <div style={{ userSelect: 'none' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {viewYear}년 {viewMonth + 1}월
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3 }}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {allowMultiSelect && selectedDates.size > 0 && (
            <button style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb' }}
              onClick={() => { setSelectedDates(new Set()); onDatesSelected?.([]); }}>
              <X size={10} style={{ display: 'inline', marginRight: 2 }} />{selectedDates.size}개 해제
            </button>
          )}
          <button onClick={goToday}
            style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid #e5e7eb', cursor: 'pointer', background: '#f9fafb' }}>
            오늘
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 600, padding: '3px 0',
            color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#6b7280',
          }}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {calDays.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} />;
          const dayOfWeek = (idx) % 7;
          const evs = eventMap[date] || [];
          const isToday = date === todayStr;
          const isSelected = selectedDates.has(date);
          const isHovered = hoveredDate === date;
          const dayNum = parseInt(date.split('-')[2]);

          return (
            <div key={date}
              onClick={() => toggleDate(date)}
              onMouseEnter={() => setHoveredDate(date)}
              onMouseLeave={() => setHoveredDate(null)}
              style={{
                minHeight: cellSize,
                borderRadius: 5,
                padding: '3px 2px',
                cursor: 'pointer',
                background: isSelected ? '#1e40af' : isToday ? '#dbeafe' : isHovered ? '#f3f4f6' : 'transparent',
                border: isToday ? '1.5px solid #3b82f6' : '1.5px solid transparent',
                transition: 'all .1s',
              }}>
              <div style={{
                textAlign: 'center',
                fontSize,
                fontWeight: isToday ? 700 : 400,
                color: isSelected ? '#fff' : isToday ? '#1d4ed8'
                  : dayOfWeek % 7 === 0 ? '#ef4444'
                  : dayOfWeek % 7 === 6 ? '#3b82f6' : '#374151',
                marginBottom: 1,
              }}>{dayNum}</div>
              {/* 이벤트 점 표시 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                {evs.slice(0, compact ? 2 : 3).map((ev, ei) => (
                  <div key={ei}
                    title={ev.title}
                    onClick={e => { e.stopPropagation(); onEventClick?.(ev); }}
                    style={{
                      width: compact ? 4 : 5, height: compact ? 4 : 5,
                      borderRadius: '50%',
                      background: TYPE_STYLE[ev.type].color,
                      cursor: 'pointer',
                    }} />
                ))}
                {evs.length > 3 && !compact && (
                  <span style={{ fontSize: 8, color: '#9ca3af' }}>+{evs.length - 3}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      {!compact && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
          {Object.entries(TYPE_STYLE).map(([type, style]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6b7280' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: style.color }} />
              {style.label}
            </div>
          ))}
        </div>
      )}

      {/* 복수 선택 안내 */}
      {allowMultiSelect && (
        <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 6 }}>
          📌 날짜 클릭으로 복수 선택 가능 (최대 10개) · 현재 {selectedDates.size}개 선택됨
        </p>
      )}
    </div>
  );
}

// 편의 훅: 더미 이벤트 생성
export function useSampleCalendarEvents(): CalendarEvent[] {
  const today = new Date();
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const add = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
  return [
    { id: 1, date: fmt(today),     title: '오늘 이벤트 발송',   type: 'event',     time: '09:00' },
    { id: 2, date: fmt(add(1)),    title: '일일 미션 발송',     type: 'mission',   time: '07:00' },
    { id: 3, date: fmt(add(2)),    title: 'AI 피드백 1차',      type: 'schedule',  time: '08:00' },
    { id: 4, date: fmt(add(3)),    title: '골드 전용 세미나',   type: 'event',     time: '14:00' },
    { id: 5, date: fmt(add(5)),    title: '6월 챌린지 시작',    type: 'challenge', time: '08:00' },
    { id: 6, date: fmt(add(7)),    title: '주간 랭킹 발표',     type: 'notice',    time: '09:00' },
    { id: 7, date: fmt(add(10)),   title: '여름 프로모션 시작', type: 'promo',     time: '00:00' },
    { id: 8, date: fmt(add(14)),   title: '수면 체크 리마인더', type: 'schedule',  time: '22:00' },
    { id: 9, date: fmt(add(-1)),   title: '어제 발송 완료',     type: 'event' },
    { id: 10, date: fmt(add(-3)),  title: '지난 미션',          type: 'mission' },
  ];
}
