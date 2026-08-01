import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Filter } from 'lucide-react';
import { TtEntry } from './types';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface FilterState {
  search: string;
  branch: string;
  year: string;
  section: string;
  faculty: string;
  subject: string;
  room: string;
  day: string;
  type: string;
}

export interface TimetableSearchFilterProps {
  entries: TtEntry[];
  onFilter: (filtered: TtEntry[]) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function uniq<T>(arr: T[]): T[] { return [...new Set(arr)]; }

function FilterSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:border-gray-300 transition-colors cursor-pointer min-w-[110px]"
      >
        <option value="">{label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TimetableSearchFilter: React.FC<TimetableSearchFilterProps> = ({ entries, onFilter }) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '', branch: '', year: '', section: '',
    faculty: '', subject: '', room: '', day: '', type: '',
  });
  const [expanded, setExpanded] = useState(false);

  // Derive unique option values from entries
  const options = useMemo(() => ({
    branches: uniq(entries.map((e) => e.branch).filter(Boolean)).sort(),
    years: uniq(entries.map((e) => String(e.year)).filter(Boolean)).sort(),
    sections: uniq(entries.map((e) => e.section).filter(Boolean)).sort(),
    faculties: uniq(entries.map((e) => e.facultyName).filter((f) => f && f !== 'TBA')).sort(),
    subjects: uniq(entries.map((e) => e.subjectName).filter((s) => s && s !== 'Free' && s !== 'Lunch')).sort(),
    rooms: uniq(entries.map((e) => e.roomName).filter((r) => r && r !== 'TBA')).sort(),
    days: uniq(entries.map((e) => e.day).filter(Boolean)),
    types: uniq(entries.map((e) => e.subjectType).filter(Boolean)).sort(),
  }), [entries]);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Apply filters
      const q = next.search.toLowerCase();
      const filtered = entries.filter((e) => {
        if (next.branch && e.branch !== next.branch) return false;
        if (next.year && String(e.year) !== next.year) return false;
        if (next.section && e.section !== next.section) return false;
        if (next.faculty && e.facultyName !== next.faculty) return false;
        if (next.subject && e.subjectName !== next.subject) return false;
        if (next.room && e.roomName !== next.room) return false;
        if (next.day && e.day !== next.day) return false;
        if (next.type && e.subjectType !== next.type) return false;
        if (q) {
          const haystack = `${e.subjectName} ${e.facultyName} ${e.roomName} ${e.branch} ${e.section} ${e.day}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });
      onFilter(filtered);
      return next;
    });
  }, [entries, onFilter]);

  const clearAll = useCallback(() => {
    setFilters({ search: '', branch: '', year: '', section: '', faculty: '', subject: '', room: '', day: '', type: '' });
    onFilter(entries);
  }, [entries, onFilter]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-3">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search subject, faculty, room, section..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition-colors"
          />
          {filters.search && (
            <button onClick={() => setFilter('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
            activeCount > 1 || expanded
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="w-4 h-4 bg-white text-indigo-600 rounded-full text-xs font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-2 text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
          <FilterSelect label="Branch" value={filters.branch} options={options.branches} onChange={(v) => setFilter('branch', v)} />
          <FilterSelect label="Year" value={filters.year} options={options.years} onChange={(v) => setFilter('year', v)} />
          <FilterSelect label="Section" value={filters.section} options={options.sections} onChange={(v) => setFilter('section', v)} />
          <FilterSelect label="Day" value={filters.day} options={options.days} onChange={(v) => setFilter('day', v)} />
          <FilterSelect label="Type" value={filters.type} options={options.types} onChange={(v) => setFilter('type', v)} />
          <FilterSelect label="Faculty" value={filters.faculty} options={options.faculties} onChange={(v) => setFilter('faculty', v)} />
          <FilterSelect label="Subject" value={filters.subject} options={options.subjects} onChange={(v) => setFilter('subject', v)} />
          <FilterSelect label="Room" value={filters.room} options={options.rooms} onChange={(v) => setFilter('room', v)} />
        </div>
      )}
    </div>
  );
};

export default TimetableSearchFilter;
