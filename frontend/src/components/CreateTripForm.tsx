'use client';

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    POPULAR_COUNTRIES,
    COUNTRY_STATES,
    getCountryByCode,
    getStateByCode,
    composeDestination,
    parseDestination,
} from '@/lib/countries';

type User = { id: string; username: string; role?: string };
type TripData = {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget: number;
    baseCurrency?: string;
    assignedToIds: string[];
    itinerary: { day: number, time: string, title: string, description: string, url: string, date?: string, duration?: number }[];
};

interface CreateTripFormProps {
    onSuccess: () => void;
    initialData?: TripData;
    tripId?: string;
    onCancel?: () => void;
}

type ItineraryItemState = {
    day: number;
    time: string;
    title: string;
    description: string;
    url: string;
    date: string;
    duration: number;
};

type FormErrors = Partial<Record<'title' | 'destination' | 'country' | 'startDate' | 'endDate' | 'budget' | 'assignedToIds', string>>;

// Currency catalog with flag and symbol for nicer dropdown
const CURRENCIES: { code: string; symbol: string; flag: string; name: string }[] = [
    { code: 'MYR', symbol: 'RM', flag: '🇲🇾', name: 'Malaysian Ringgit' },
    { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', flag: '🇪🇺', name: 'Euro' },
    { code: 'GBP', symbol: '£', flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'SGD', symbol: 'S$', flag: '🇸🇬', name: 'Singapore Dollar' },
    { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar' },
    { code: 'KRW', symbol: '₩', flag: '🇰🇷', name: 'Korean Won' },
];

const getCurrencySymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || code;
const getCurrencyFlag = (code: string) => CURRENCIES.find(c => c.code === code)?.flag || '💱';

// Duration preset options (in minutes)
const DURATION_PRESETS = [
    { label: 'None', value: 0 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: 'Half day (5h)', value: 300 },
    { label: 'Full day (8h)', value: 480 },
];

const formatDuration = (mins: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
};

// Compute the date string (YYYY-MM-DD) for given day index based on trip start date
const computeDateForDay = (startDate: string, day: number) => {
    if (!startDate || !day) return '';
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + (day - 1));
    return d.toISOString().split('T')[0];
};

// Reusable required-field marker
const Req = () => <span className="text-red-500 ml-0.5">*</span>;

// Reusable section header
function SectionHeader({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
    return (
        <div className="mb-3 mt-2 first:mt-0">
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{title}</h4>
            </div>
            {hint && <p className="text-xs text-gray-500 mt-0.5 ml-7">{hint}</p>}
        </div>
    );
}

export default function CreateTripForm({ onSuccess, initialData, tripId, onCancel }: CreateTripFormProps) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    // Destination is split into 3 controlled fields. The final string saved to backend
    // is composed via composeDestination() at submit time.
    const [countryCode, setCountryCode] = useState<string>('');
    const [stateCode, setStateCode] = useState<string>('');
    const [city, setCity] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        destination: '',
        startDate: '',
        endDate: '',
        budget: 0,
        baseCurrency: 'MYR',
        assignedToIds: [] as string[]
    });
    const [itinerary, setItinerary] = useState<ItineraryItemState[]>([
        { day: 1, time: '09:00', title: '', description: '', url: '', date: '', duration: 0 }
    ]);
    const [expandedKey, setExpandedKey] = useState<string | null>('new-0');
    const [collapsedDays, setCollapsedDays] = useState<Record<number, boolean>>({});
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        api.get('/users').then((data: User[]) => {
            setUsers(Array.isArray(data) ? data : []);
            // Auto-select admin user when creating a NEW trip (not editing)
            if (!initialData && currentUser?.role === 'admin') {
                setFormData(prev => prev.assignedToIds.includes(currentUser.id)
                    ? prev
                    : { ...prev, assignedToIds: [...prev.assignedToIds, currentUser.id] });
            }
        });
        if (initialData) {
            setFormData({
                title: initialData.title,
                destination: initialData.destination,
                startDate: initialData.startDate?.split('T')[0] || '',
                endDate: initialData.endDate?.split('T')[0] || '',
                budget: initialData.budget,
                baseCurrency: initialData.baseCurrency || 'MYR',
                assignedToIds: initialData.assignedToIds || []
            });
            // Try to restore country/state/city from the stored destination string
            const parsed = parseDestination(initialData.destination);
            if (parsed.countryCode) {
                setCountryCode(parsed.countryCode);
                setStateCode(parsed.stateCode);
                setCity(parsed.city);
            } else {
                // Couldn't parse — leave country empty and keep raw text in the city box
                setCity(parsed.rawFallback);
            }
            if (initialData.itinerary && initialData.itinerary.length > 0) {
                setItinerary(initialData.itinerary.map(i => ({
                    day: i.day,
                    time: i.time,
                    title: i.title,
                    description: i.description || '',
                    url: i.url || '',
                    date: i.date || '',
                    duration: i.duration || 0
                })));
                setExpandedKey(null);
            }
        }
    }, [initialData, currentUser]);

    // === Validation ===
    const validate = (data: typeof formData, cc: string): FormErrors => {
        const e: FormErrors = {};
        if (!data.title.trim()) e.title = 'Title is required';
        if (!cc) e.country = 'Country is required';
        if (!data.startDate) e.startDate = 'Start date is required';
        if (!data.endDate) e.endDate = 'End date is required';
        if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
            e.endDate = 'End date must be after start date';
        }
        if (!data.budget || data.budget <= 0) e.budget = 'Budget must be greater than 0';
        if (data.assignedToIds.length === 0) e.assignedToIds = 'Assign at least one user';
        return e;
    };

    // Live re-validate when fields change
    useEffect(() => {
        setErrors(validate(formData, countryCode));
    }, [formData, countryCode]);

    // Available states for currently-selected country (empty = no state dropdown)
    const availableStates = useMemo(() => COUNTRY_STATES[countryCode] || [], [countryCode]);

    // Composed destination string preview
    const composedDestination = useMemo(() => {
        const country = getCountryByCode(countryCode);
        const state = getStateByCode(countryCode, stateCode);
        return composeDestination(country?.name || '', state?.name || '', city);
    }, [countryCode, stateCode, city]);

    const tripDays = useMemo(() => {
        if (formData.startDate && formData.endDate) {
            const s = new Date(formData.startDate);
            const e = new Date(formData.endDate);
            if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
                const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                if (diff > 0) return diff;
            }
        }
        return 0;
    }, [formData.startDate, formData.endDate]);

    const totalDays = useMemo(() => {
        if (tripDays > 0) return tripDays;
        const maxDay = itinerary.reduce((m, i) => Math.max(m, i.day || 1), 1);
        return Math.max(1, maxDay);
    }, [tripDays, itinerary]);

    // Group itinerary items by day, preserving original index for editing
    const groupedByDay = useMemo(() => {
        const groups: Record<number, { item: ItineraryItemState; originalIndex: number }[]> = {};
        itinerary.forEach((item, originalIndex) => {
            const day = item.day || 1;
            if (!groups[day]) groups[day] = [];
            groups[day].push({ item, originalIndex });
        });
        Object.values(groups).forEach(arr => arr.sort((a, b) => a.item.time.localeCompare(b.item.time)));
        return groups;
    }, [itinerary]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // Mark all fields as touched on submit so all errors become visible
        setTouched({ title: true, country: true, startDate: true, endDate: true, budget: true, assignedToIds: true });

        const validationErrors = validate(formData, countryCode);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            setError('Please fix the highlighted fields before saving.');
            return;
        }

        setSubmitting(true);
        const finalItinerary = itinerary.map(it => ({
            ...it,
            date: it.date || computeDateForDay(formData.startDate, it.day),
        }));
        const payload = { ...formData, destination: composedDestination, itinerary: finalItinerary };

        try {
            let res;
            if (tripId) {
                res = await api.put(`/trips/${tripId}`, payload);
            } else {
                res = await api.post('/trips', payload);
            }
            if (res.error) {
                setError(res.error);
                return;
            }
            onSuccess();
        } catch (err) {
            console.error(err);
            setError('Failed to save trip. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));
    const showError = (field: keyof FormErrors) => touched[field] && errors[field];

    // === Itinerary helpers (unchanged behavior) ===
    const updateItem = (originalIndex: number, patch: Partial<ItineraryItemState>) => {
        setItinerary(prev => {
            const next = [...prev];
            next[originalIndex] = { ...next[originalIndex], ...patch };
            return next;
        });
    };
    const removeItem = (originalIndex: number) => setItinerary(prev => prev.filter((_, i) => i !== originalIndex));
    const duplicateItem = (originalIndex: number) => {
        setItinerary(prev => {
            const next = [...prev];
            const copy = { ...next[originalIndex], title: next[originalIndex].title ? `${next[originalIndex].title} (copy)` : '' };
            next.splice(originalIndex + 1, 0, copy);
            return next;
        });
        setExpandedKey(`item-${originalIndex + 1}`);
    };
    const moveItemToDay = (originalIndex: number, newDay: number) => {
        const newDate = computeDateForDay(formData.startDate, newDay);
        updateItem(originalIndex, { day: newDay, date: newDate });
    };
    const addActivityToDay = (day: number) => {
        const newItem: ItineraryItemState = {
            day, time: '09:00', title: '', description: '', url: '',
            date: computeDateForDay(formData.startDate, day),
            duration: 60,
        };
        setItinerary(prev => [...prev, newItem]);
        setExpandedKey(`item-${itinerary.length}`);
        setCollapsedDays(prev => ({ ...prev, [day]: false }));
    };
    const toggleDayCollapse = (day: number) => setCollapsedDays(prev => ({ ...prev, [day]: !prev[day] }));

    const daysToRender = useMemo(() => {
        const set = new Set<number>();
        for (let d = 1; d <= totalDays; d++) set.add(d);
        Object.keys(groupedByDay).forEach(k => set.add(parseInt(k)));
        return Array.from(set).sort((a, b) => a - b);
    }, [totalDays, groupedByDay]);

    const formatDayLabel = (day: number) => {
        const dateStr = computeDateForDay(formData.startDate, day);
        if (!dateStr) return `Day ${day}`;
        const d = new Date(dateStr);
        return `Day ${day} · ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}`;
    };

    // === Assign users helpers ===
    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase();
        if (!q) return users;
        return users.filter(u => u.username.toLowerCase().includes(q));
    }, [users, userSearch]);

    const allFilteredSelected = filteredUsers.length > 0 &&
        filteredUsers.every(u => formData.assignedToIds.includes(u.id));

    const toggleSelectAll = () => {
        const filteredIds = filteredUsers.map(u => u.id);
        setFormData(prev => {
            const set = new Set(prev.assignedToIds);
            if (allFilteredSelected) {
                filteredIds.forEach(id => set.delete(id));
            } else {
                filteredIds.forEach(id => set.add(id));
            }
            return { ...prev, assignedToIds: Array.from(set) };
        });
    };

    const baseInputClasses = (field: keyof FormErrors) =>
        `w-full rounded-md border p-2 focus:ring-1 text-gray-900 placeholder-gray-400 transition-colors ${
            showError(field)
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/30'
                : 'border-gray-200 focus:border-brand-magenta focus:ring-brand-magenta'
        }`;

    return (
        <form onSubmit={handleSubmit} className="mt-4 glass-card bg-white/90 p-6 shadow-xl h-[85vh] overflow-y-auto relative">
            {onCancel && (
                <button type="button" onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg z-10">
                    ✕
                </button>
            )}

            {/* Form title */}
            <div className="mb-5 pb-3 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-800 tracking-tight">
                    {tripId ? '✏️ Edit Trip' : '✨ Create New Trip'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {tripId ? 'Update trip details, itinerary or assigned users.' : 'Fill in the basic info, then build the itinerary day-by-day.'}
                </p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-start gap-2">
                    <span>⚠️</span>
                    <span className="flex-1">{error}</span>
                </div>
            )}

            <div className="space-y-5">

                {/* ============ BASIC INFO ============ */}
                <section>
                    <SectionHeader icon="📌" title="Basic Info" />
                    <div className="space-y-3">
                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Trip Title<Req />
                            </label>
                            <input
                                className={baseInputClasses('title')}
                                placeholder="e.g., Hokkaido Winter Trip 2026"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                onBlur={() => markTouched('title')}
                            />
                            {showError('title') && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Destination — Country / State / City */}
                        <div>
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Destination<Req />
                            </label>
                            <div className="grid grid-cols-12 gap-2">
                                {/* Country */}
                                <div className={availableStates.length > 0 ? 'col-span-6' : 'col-span-12 sm:col-span-6'}>
                                    <div className={`flex rounded-md border overflow-hidden focus-within:ring-1 transition-colors ${
                                        showError('country')
                                            ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200 bg-red-50/30'
                                            : 'border-gray-200 focus-within:border-brand-magenta focus-within:ring-brand-magenta'
                                    }`}>
                                        <span className="px-2 flex items-center bg-gray-50 text-lg border-r border-gray-200">
                                            {getCountryByCode(countryCode)?.flag || '🌍'}
                                        </span>
                                        <select
                                            className="flex-1 p-2 outline-none bg-white text-gray-900 cursor-pointer text-sm"
                                            value={countryCode}
                                            onChange={e => {
                                                setCountryCode(e.target.value);
                                                setStateCode(''); // reset state when country changes
                                                markTouched('country');
                                            }}
                                            onBlur={() => markTouched('country')}
                                        >
                                            <option value="">Select country...</option>
                                            {POPULAR_COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>
                                                    {c.flag} {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* State (only when the country has states) */}
                                {availableStates.length > 0 && (
                                    <div className="col-span-6">
                                        <select
                                            className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 bg-white focus:border-brand-magenta focus:ring-1 focus:ring-brand-magenta cursor-pointer"
                                            value={stateCode}
                                            onChange={e => setStateCode(e.target.value)}
                                        >
                                            <option value="">State / Region (optional)</option>
                                            {availableStates.map(s => (
                                                <option key={s.code} value={s.code}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* City (free text, optional) */}
                                <div className="col-span-12">
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-magenta focus:ring-1 focus:ring-brand-magenta"
                                        placeholder="City / area (optional, e.g., Sapporo)"
                                        value={city}
                                        onChange={e => setCity(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Live preview */}
                            {composedDestination && (
                                <p className="text-xs text-gray-500 mt-1.5 ml-0.5">
                                    📍 <span className="font-medium text-brand-magenta">{composedDestination}</span>
                                </p>
                            )}
                            {showError('country') && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    Start Date<Req />
                                </label>
                                <input
                                    type="date"
                                    className={baseInputClasses('startDate')}
                                    value={formData.startDate}
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    onBlur={() => markTouched('startDate')}
                                />
                                {showError('startDate') && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">
                                    End Date<Req />
                                </label>
                                <input
                                    type="date"
                                    className={baseInputClasses('endDate')}
                                    value={formData.endDate}
                                    min={formData.startDate || undefined}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    onBlur={() => markTouched('endDate')}
                                />
                                {showError('endDate') && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                            </div>
                        </div>
                        {tripDays > 0 && (
                            <p className="text-xs text-brand-cyan font-bold flex items-center gap-1">
                                🗓️ {tripDays} {tripDays === 1 ? 'day' : 'days'} total
                            </p>
                        )}
                    </div>
                </section>

                {/* ============ BUDGET & CURRENCY ============ */}
                <section>
                    <SectionHeader icon="💰" title="Budget & Currency" hint="Group budget shared by all assigned users." />
                    <div className="grid grid-cols-12 gap-3">
                        {/* Budget with currency prefix */}
                        <div className="col-span-7">
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Group Budget<Req />
                            </label>
                            <div className={`flex rounded-md border overflow-hidden focus-within:ring-1 transition-colors ${
                                showError('budget')
                                    ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200 bg-red-50/30'
                                    : 'border-gray-200 focus-within:border-brand-magenta focus-within:ring-brand-magenta'
                            }`}>
                                <span className="px-3 flex items-center bg-gray-50 text-gray-500 font-bold text-sm border-r border-gray-200">
                                    {getCurrencySymbol(formData.baseCurrency)}
                                </span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="flex-1 p-2 outline-none text-gray-900 placeholder-gray-400"
                                    placeholder="0.00"
                                    value={formData.budget || ''}
                                    onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                                    onBlur={() => markTouched('budget')}
                                />
                            </div>
                            {showError('budget') && <p className="text-xs text-red-500 mt-1">{errors.budget}</p>}
                        </div>

                        {/* Currency */}
                        <div className="col-span-5">
                            <label className="text-xs font-bold text-gray-700 block mb-1">
                                Currency<Req />
                            </label>
                            <div className="flex rounded-md border border-gray-200 overflow-hidden focus-within:border-brand-magenta focus-within:ring-1 focus-within:ring-brand-magenta">
                                <span className="px-2 flex items-center bg-gray-50 text-lg border-r border-gray-200">
                                    {getCurrencyFlag(formData.baseCurrency)}
                                </span>
                                <select
                                    className="flex-1 p-2 outline-none bg-white text-gray-900 cursor-pointer"
                                    value={formData.baseCurrency}
                                    onChange={e => setFormData({ ...formData, baseCurrency: e.target.value })}
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} — {c.symbol} ({c.name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ TEAM ============ */}
                <section>
                    <SectionHeader icon="👥" title="Team" hint="Pick who joins this trip. Each gets their own personal budget later." />

                    {/* Search + Select All */}
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="🔍 Search users..."
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-magenta focus:ring-1 focus:ring-brand-magenta"
                        />
                        {filteredUsers.length > 0 && (
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="text-xs font-bold px-3 py-1.5 rounded-md border border-gray-200 text-brand-magenta hover:bg-brand-magenta hover:text-white hover:border-brand-magenta transition-colors whitespace-nowrap"
                            >
                                {allFilteredSelected ? 'Clear' : 'Select All'}
                            </button>
                        )}
                    </div>

                    {/* User list */}
                    <div className={`border rounded-md p-2 max-h-44 overflow-y-auto bg-white/50 space-y-1 ${
                        showError('assignedToIds') ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
                    }`}>
                        {filteredUsers.length === 0 && (
                            <p className="text-gray-400 text-xs text-center py-4">
                                {users.length === 0 ? 'No users found.' : 'No users match your search.'}
                            </p>
                        )}
                        {filteredUsers.map(u => {
                            const isSelected = formData.assignedToIds.includes(u.id);
                            const isMe = currentUser?.id === u.id;
                            return (
                                <label
                                    key={u.id}
                                    className={`flex items-center gap-2 cursor-pointer p-1.5 rounded transition-colors ${
                                        isSelected ? 'bg-brand-magenta/5' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="rounded text-brand-magenta focus:ring-brand-magenta"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            markTouched('assignedToIds');
                                            setFormData(prev => ({
                                                ...prev,
                                                assignedToIds: checked
                                                    ? [...prev.assignedToIds, u.id]
                                                    : prev.assignedToIds.filter(id => id !== u.id)
                                            }));
                                        }}
                                    />
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-cyan to-brand-magenta flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {u.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-800 text-sm flex-1 truncate">{u.username}</span>
                                    {isMe && (
                                        <span className="text-[9px] font-bold bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>
                                    )}
                                    {u.role === 'admin' && (
                                        <span className="text-[9px] font-bold bg-brand-magenta/10 text-brand-magenta px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs">
                        <span className="text-gray-500">
                            {formData.assignedToIds.length} {formData.assignedToIds.length === 1 ? 'user' : 'users'} selected
                        </span>
                        {showError('assignedToIds') && <span className="text-red-500 font-medium">{errors.assignedToIds}</span>}
                    </div>
                    {tripId && <p className="text-xs text-amber-600 font-medium mt-2">⚠️ Removing users may affect their personal expenses/budget. Proceed with care.</p>}
                </section>

                {/* === Itinerary Section (Day-Grouped) === */}
                <section className="pt-4 border-t border-dashed border-gray-300">
                    <SectionHeader icon="🗓️" title="Itinerary" hint="Plan day-by-day activities. Optional but recommended." />

                    <div className="flex items-center justify-end mb-3">
                        <span className="text-xs text-gray-500 font-medium">
                            {itinerary.length} {itinerary.length === 1 ? 'activity' : 'activities'} · {daysToRender.length} {daysToRender.length === 1 ? 'day' : 'days'}
                        </span>
                    </div>

                    {!formData.startDate && (
                        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            💡 Tip: Set the trip start date first — dates will auto-fill for each day.
                        </div>
                    )}

                    <div className="space-y-3">
                        {daysToRender.map(day => {
                            const items = groupedByDay[day] || [];
                            const isCollapsed = collapsedDays[day];
                            return (
                                <div key={day} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                                    {/* Day Header */}
                                    <div className="flex items-center justify-between bg-gradient-to-r from-brand-magenta/5 to-brand-pink/5 px-4 py-2 border-b border-gray-100">
                                        <button
                                            type="button"
                                            onClick={() => toggleDayCollapse(day)}
                                            className="flex items-center gap-2 font-bold text-gray-800 text-sm hover:text-brand-magenta transition-colors"
                                        >
                                            <span className={`inline-block transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`}>▼</span>
                                            <span>{formatDayLabel(day)}</span>
                                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-magenta/10 text-brand-magenta">
                                                {items.length} {items.length === 1 ? 'item' : 'items'}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => addActivityToDay(day)}
                                            className="text-xs font-bold text-brand-cyan hover:text-brand-magenta transition-colors"
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {/* Day Body */}
                                    {!isCollapsed && (
                                        <div className="p-2 space-y-2">
                                            {items.length === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => addActivityToDay(day)}
                                                    className="w-full py-3 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:text-brand-cyan hover:border-brand-cyan transition-colors"
                                                >
                                                    No activities yet — click to add
                                                </button>
                                            )}
                                            {items.map(({ item, originalIndex }) => {
                                                const key = `item-${originalIndex}`;
                                                const isExpanded = expandedKey === key;
                                                return (
                                                    <div key={originalIndex} className="border border-gray-200 rounded-md bg-gray-50/50 hover:border-brand-cyan/40 transition-colors">
                                                        {/* Compact row */}
                                                        <div className="flex items-center gap-2 px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedKey(isExpanded ? null : key)}
                                                                className="flex-1 flex items-center gap-3 text-left min-w-0"
                                                            >
                                                                <span className="font-mono text-xs font-bold text-brand-magenta w-12 flex-shrink-0">{item.time || '--:--'}</span>
                                                                <span className="font-medium text-sm text-gray-800 truncate flex-1">
                                                                    {item.title || <span className="text-gray-400 italic">Untitled activity</span>}
                                                                </span>
                                                                {item.duration > 0 && (
                                                                    <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                                                                        {formatDuration(item.duration)}
                                                                    </span>
                                                                )}
                                                                <span className={`text-gray-400 text-xs transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Duplicate"
                                                                onClick={() => duplicateItem(originalIndex)}
                                                                className="text-gray-400 hover:text-brand-cyan p-1 text-sm flex-shrink-0"
                                                            >
                                                                ⎘
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete"
                                                                onClick={() => removeItem(originalIndex)}
                                                                className="text-gray-400 hover:text-red-500 p-1 text-sm flex-shrink-0"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>

                                                        {/* Expanded edit panel */}
                                                        {isExpanded && (
                                                            <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-2">
                                                                <div className="grid grid-cols-12 gap-2">
                                                                    <div className="col-span-4">
                                                                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Time</label>
                                                                        <input
                                                                            type="time"
                                                                            className="w-full rounded-md border border-gray-200 p-1.5 text-sm text-gray-900"
                                                                            value={item.time}
                                                                            onChange={e => updateItem(originalIndex, { time: e.target.value })}
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Day</label>
                                                                        <select
                                                                            className="w-full rounded-md border border-gray-200 p-1.5 text-sm text-gray-900"
                                                                            value={item.day}
                                                                            onChange={e => moveItemToDay(originalIndex, parseInt(e.target.value))}
                                                                        >
                                                                            {daysToRender.map(d => (
                                                                                <option key={d} value={d}>Day {d}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Duration</label>
                                                                        <select
                                                                            className="w-full rounded-md border border-gray-200 p-1.5 text-sm text-gray-900"
                                                                            value={DURATION_PRESETS.some(p => p.value === item.duration) ? item.duration : 'custom'}
                                                                            onChange={e => {
                                                                                if (e.target.value !== 'custom') {
                                                                                    updateItem(originalIndex, { duration: parseInt(e.target.value) });
                                                                                }
                                                                            }}
                                                                        >
                                                                            {DURATION_PRESETS.map(p => (
                                                                                <option key={p.value} value={p.value}>{p.label}</option>
                                                                            ))}
                                                                            {!DURATION_PRESETS.some(p => p.value === item.duration) && (
                                                                                <option value="custom">{formatDuration(item.duration)} (custom)</option>
                                                                            )}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Title</label>
                                                                    <input
                                                                        className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 placeholder-gray-400 font-bold"
                                                                        placeholder="Activity Title"
                                                                        value={item.title}
                                                                        onChange={e => updateItem(originalIndex, { title: e.target.value })}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Description</label>
                                                                    <textarea
                                                                        className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 placeholder-gray-400 min-h-[50px]"
                                                                        placeholder="Details..."
                                                                        value={item.description}
                                                                        onChange={e => updateItem(originalIndex, { description: e.target.value })}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Location URL</label>
                                                                    <input
                                                                        className="w-full rounded-md border border-gray-200 p-2 text-sm text-gray-900 placeholder-gray-400 text-brand-cyan"
                                                                        placeholder="https://maps.google.com/..."
                                                                        value={item.url}
                                                                        onChange={e => updateItem(originalIndex, { url: e.target.value })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => addActivityToDay(daysToRender[daysToRender.length - 1] || 1)}
                        className="mt-4 w-full py-2 border-2 border-dashed border-brand-cyan/30 text-brand-cyan font-bold rounded-lg hover:bg-brand-cyan/5 transition-colors text-sm"
                    >
                        + Add Activity to Last Day
                    </button>
                </section>

                {/* Submit / Cancel */}
                <div className="pt-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 -mb-6 px-6 py-4 z-10">
                    {onCancel && (
                        <button type="button" onClick={onCancel}
                            className="flex-1 rounded-md border border-gray-200 p-3 font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-[2] rounded-md bg-gradient-to-r from-brand-magenta to-brand-pink p-3 text-white font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? '⏳ Saving...' : (tripId ? '✓ Update Trip' : '✨ Create Trip')}
                    </button>
                </div>
            </div>
        </form>
    );
}
