/**
 * AddressAutocomplete
 *
 * Open-source address search powered by Photon (photon.komoot.io),
 * which is built on OpenStreetMap / Nominatim data.
 * - Free, no API key, CORS-enabled
 * - Returns city, state, postcode, countrycode, lat/lon
 *
 * Props:
 *   value        string   — display value for the input
 *   onChange     fn(str)  — called when user types (freeform edit)
 *   onSelect     fn(obj)  — called when user picks a suggestion
 *                           obj: { display, city, state, postcode, countrycode, lat, lon }
 *   placeholder  string
 *   required     bool
 *   countryFilter string[] — e.g. ['us','ca'] to restrict results (optional)
 *   className    string
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

const PHOTON_BASE = 'https://photon.komoot.io/api/';

function buildDisplay(props) {
  const parts = [];
  if (props.name && props.name !== props.city)  parts.push(props.name);
  if (props.city)   parts.push(props.city);
  if (props.state)  parts.push(props.state);
  if (props.postcode) parts.push(props.postcode);
  if (props.country) parts.push(props.country);
  return parts.join(', ');
}

export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search address…',
  required = false,
  countryFilter = [],
  className = '',
}) {
  const [query, setQuery]           = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);
  const [selected, setSelected]     = useState(false);

  const debounceRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef    = useRef(null);

  // Keep query in sync if parent forces a value reset
  useEffect(() => {
    if (value === '') { setQuery(''); setSelected(false); setSuggestions([]); }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const search = useCallback(async (q) => {
    if (q.trim().length < 3) { setSuggestions([]); setOpen(false); return; }

    // Cancel in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: 7, lang: 'en' });
      if (countryFilter.length > 0) {
        // Photon doesn't have a direct country filter param but we can bias with bbox.
        // We'll filter results client-side instead.
      }
      const res = await fetch(`${PHOTON_BASE}?${params}`, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();

      let features = json.features || [];

      // Client-side country filter
      if (countryFilter.length > 0) {
        const lower = countryFilter.map(c => c.toLowerCase());
        features = features.filter(f =>
          lower.includes((f.properties.countrycode || '').toLowerCase())
        );
      }

      // Deduplicate by postcode+city
      const seen = new Set();
      const deduped = [];
      for (const f of features) {
        const key = `${f.properties.city || ''}|${f.properties.postcode || ''}|${f.properties.state || ''}`;
        if (!seen.has(key)) { seen.add(key); deduped.push(f); }
      }

      setSuggestions(deduped.slice(0, 6));
      setOpen(deduped.length > 0);
      setActiveIdx(-1);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }, [countryFilter]);

  function handleInput(e) {
    const v = e.target.value;
    setQuery(v);
    setSelected(false);
    onChange?.(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 320);
  }

  function handleSelect(feature) {
    const p = feature.properties;
    const [lon, lat] = feature.geometry.coordinates;
    const display = buildDisplay(p);
    setQuery(display);
    setSelected(true);
    setOpen(false);
    setSuggestions([]);
    onChange?.(display);
    onSelect?.({
      display,
      name:        p.name || '',
      city:        p.city || p.name || '',
      state:       p.state || '',
      postcode:    p.postcode || '',
      countrycode: (p.countrycode || '').toLowerCase(),
      lat,
      lon,
    });
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {loading
            ? <Loader2 size={14} className="animate-spin text-blue-500" />
            : <Search size={14} />}
        </span>
        <input
          type="text"
          required={required}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            selected
              ? 'border-emerald-300 bg-emerald-50/50'
              : 'border-slate-200 bg-white'
          }`}
        />
        {selected && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            <MapPin size={13} className="text-emerald-500" />
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden text-sm">
          {suggestions.map((f, i) => {
            const p   = f.properties;
            const top = [p.name, p.city].filter(Boolean).filter((v, idx, arr) => arr.indexOf(v) === idx).join(', ');
            const sub = [p.state, p.postcode, p.country].filter(Boolean).join(' · ');
            return (
              <li
                key={i}
                onMouseDown={() => handleSelect(f)}
                className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                  activeIdx === i ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <MapPin size={13} className="text-blue-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 truncate">{top || buildDisplay(p)}</div>
                  {sub && <div className="text-[11px] text-slate-400 truncate">{sub}</div>}
                </div>
                {p.postcode && (
                  <span className="ml-auto shrink-0 text-[10px] font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                    {p.postcode}
                  </span>
                )}
              </li>
            );
          })}
          <li className="px-3 py-1.5 border-t border-slate-100 flex items-center gap-1.5">
            <img src="https://www.openstreetmap.org/assets/osm_logo-d6a220b906b7d7ae4e578c235d8e9891fd4e5e6e14baa3b7cdc6afcbe73f9dc8.svg" alt="OSM" className="w-3 h-3 opacity-50" />
            <span className="text-[10px] text-slate-400">Powered by OpenStreetMap / Photon</span>
          </li>
        </ul>
      )}
    </div>
  );
}
