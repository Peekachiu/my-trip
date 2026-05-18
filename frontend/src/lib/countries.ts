export interface Country {
    code: string;
    name: string;
    flag: string;
}

export interface State {
    code: string;
    name: string;
}

// Popular countries list (can be extended later)
export const POPULAR_COUNTRIES: Country[] = [
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' }
];

// States / provinces / regions for selected popular destinations.
// Only countries with practical, frequently-traveled subdivisions are included.
export const COUNTRY_STATES: Record<string, State[]> = {
    MY: [
        { code: 'JHR', name: 'Johor' },
        { code: 'KDH', name: 'Kedah' },
        { code: 'KTN', name: 'Kelantan' },
        { code: 'MLK', name: 'Melaka' },
        { code: 'NSN', name: 'Negeri Sembilan' },
        { code: 'PHG', name: 'Pahang' },
        { code: 'PRK', name: 'Perak' },
        { code: 'PLS', name: 'Perlis' },
        { code: 'PNG', name: 'Penang' },
        { code: 'SBH', name: 'Sabah' },
        { code: 'SWK', name: 'Sarawak' },
        { code: 'SGR', name: 'Selangor' },
        { code: 'TRG', name: 'Terengganu' },
        { code: 'KUL', name: 'Kuala Lumpur (FT)' },
        { code: 'LBN', name: 'Labuan (FT)' },
        { code: 'PJY', name: 'Putrajaya (FT)' }
    ],
    JP: [
        { code: 'HKD', name: 'Hokkaido' },
        { code: 'AOM', name: 'Aomori' },
        { code: 'IWT', name: 'Iwate' },
        { code: 'MYG', name: 'Miyagi' },
        { code: 'AKT', name: 'Akita' },
        { code: 'YGT', name: 'Yamagata' },
        { code: 'FKS', name: 'Fukushima' },
        { code: 'IBR', name: 'Ibaraki' },
        { code: 'TCG', name: 'Tochigi' },
        { code: 'GNM', name: 'Gunma' },
        { code: 'STM', name: 'Saitama' },
        { code: 'CHB', name: 'Chiba' },
        { code: 'TKY', name: 'Tokyo' },
        { code: 'KNG', name: 'Kanagawa' },
        { code: 'NGT', name: 'Niigata' },
        { code: 'TYM', name: 'Toyama' },
        { code: 'ISK', name: 'Ishikawa' },
        { code: 'FKI', name: 'Fukui' },
        { code: 'YNS', name: 'Yamanashi' },
        { code: 'NGN', name: 'Nagano' },
        { code: 'GIF', name: 'Gifu' },
        { code: 'SZK', name: 'Shizuoka' },
        { code: 'AIC', name: 'Aichi' },
        { code: 'MIE', name: 'Mie' },
        { code: 'SHG', name: 'Shiga' },
        { code: 'KYT', name: 'Kyoto' },
        { code: 'OSK', name: 'Osaka' },
        { code: 'HYG', name: 'Hyogo' },
        { code: 'NRA', name: 'Nara' },
        { code: 'WKY', name: 'Wakayama' },
        { code: 'TTR', name: 'Tottori' },
        { code: 'SMN', name: 'Shimane' },
        { code: 'OKY', name: 'Okayama' },
        { code: 'HRS', name: 'Hiroshima' },
        { code: 'YGC', name: 'Yamaguchi' },
        { code: 'TKS', name: 'Tokushima' },
        { code: 'KGW', name: 'Kagawa' },
        { code: 'EHM', name: 'Ehime' },
        { code: 'KCH', name: 'Kochi' },
        { code: 'FKO', name: 'Fukuoka' },
        { code: 'SAG', name: 'Saga' },
        { code: 'NGS', name: 'Nagasaki' },
        { code: 'KMT', name: 'Kumamoto' },
        { code: 'OIT', name: 'Oita' },
        { code: 'MYZ', name: 'Miyazaki' },
        { code: 'KGS', name: 'Kagoshima' },
        { code: 'OKW', name: 'Okinawa' }
    ],
    CN: [
        { code: 'BJ', name: 'Beijing' },
        { code: 'SH', name: 'Shanghai' },
        { code: 'TJ', name: 'Tianjin' },
        { code: 'CQ', name: 'Chongqing' },
        { code: 'HK', name: 'Hong Kong' },
        { code: 'MO', name: 'Macau' },
        { code: 'GD', name: 'Guangdong' },
        { code: 'JS', name: 'Jiangsu' },
        { code: 'ZJ', name: 'Zhejiang' },
        { code: 'FJ', name: 'Fujian' },
        { code: 'SD', name: 'Shandong' },
        { code: 'SC', name: 'Sichuan' },
        { code: 'YN', name: 'Yunnan' },
        { code: 'HN', name: 'Hunan' },
        { code: 'HB', name: 'Hubei' },
        { code: 'AH', name: 'Anhui' },
        { code: 'JX', name: 'Jiangxi' },
        { code: 'HE', name: 'Hebei' },
        { code: 'HA', name: 'Henan' },
        { code: 'SX', name: 'Shanxi' },
        { code: 'SN', name: 'Shaanxi' },
        { code: 'GS', name: 'Gansu' },
        { code: 'QH', name: 'Qinghai' },
        { code: 'LN', name: 'Liaoning' },
        { code: 'JL', name: 'Jilin' },
        { code: 'HL', name: 'Heilongjiang' },
        { code: 'NM', name: 'Inner Mongolia' },
        { code: 'GX', name: 'Guangxi' },
        { code: 'XJ', name: 'Xinjiang' },
        { code: 'XZ', name: 'Tibet' },
        { code: 'NX', name: 'Ningxia' },
        { code: 'HI', name: 'Hainan' },
        { code: 'GZ', name: 'Guizhou' },
        { code: 'TW', name: 'Taiwan' }
    ],
    US: [
        { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
        { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
        { code: 'DC', name: 'District of Columbia' }
    ],
    KR: [
        { code: 'SEO', name: 'Seoul' }, { code: 'BUS', name: 'Busan' },
        { code: 'ICN', name: 'Incheon' }, { code: 'DAE', name: 'Daegu' },
        { code: 'GWJ', name: 'Gwangju' }, { code: 'DAJ', name: 'Daejeon' },
        { code: 'ULS', name: 'Ulsan' }, { code: 'JEJ', name: 'Jeju' }
    ],
    TH: [
        { code: 'BKK', name: 'Bangkok' }, { code: 'CNX', name: 'Chiang Mai' },
        { code: 'HKT', name: 'Phuket' }, { code: 'CRI', name: 'Chiang Rai' },
        { code: 'KBI', name: 'Krabi' }, { code: 'PYX', name: 'Pattaya' },
        { code: 'USM', name: 'Surat Thani (Koh Samui)' }
    ],
    ID: [
        { code: 'JKT', name: 'Jakarta' }, { code: 'BLI', name: 'Bali' },
        { code: 'YOG', name: 'Yogyakarta' }, { code: 'BDO', name: 'Bandung' },
        { code: 'SUB', name: 'Surabaya' }, { code: 'LOK', name: 'Lombok' }
    ]
};

// Get country by code
export const getCountryByCode = (code: string): Country | undefined =>
    POPULAR_COUNTRIES.find(c => c.code === code);

// Get state by country + state code
export const getStateByCode = (countryCode: string, stateCode: string): State | undefined =>
    COUNTRY_STATES[countryCode]?.find(s => s.code === stateCode);

// Build a destination string from parts (returns trimmed `City, State, Country` style)
export const composeDestination = (countryName: string, stateName?: string, city?: string): string => {
    return [city, stateName, countryName].filter(Boolean).map(s => (s as string).trim()).join(', ');
};

// Best-effort parse of an existing destination string into { country, state, city }.
// Strategy:
//   1. Split by `,`
//   2. Last segment must match a country name (case-insensitive)
//   3. Second-to-last must match a state of that country (case-insensitive)
//   4. Anything before that becomes the city/free-text
export const parseDestination = (raw: string | undefined | null): {
    countryCode: string;
    stateCode: string;
    city: string;
    rawFallback: string;
} => {
    const fallback = { countryCode: '', stateCode: '', city: '', rawFallback: (raw || '').trim() };
    if (!raw) return fallback;
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return fallback;

    const last = parts[parts.length - 1].toLowerCase();
    const country = POPULAR_COUNTRIES.find(c => c.name.toLowerCase() === last);
    if (!country) return fallback;

    let stateCode = '';
    let cityIdx = parts.length - 1; // exclusive boundary
    if (parts.length >= 2) {
        const secondLast = parts[parts.length - 2].toLowerCase();
        const state = (COUNTRY_STATES[country.code] || []).find(s => s.name.toLowerCase() === secondLast);
        if (state) {
            stateCode = state.code;
            cityIdx = parts.length - 2;
        }
    }

    const city = parts.slice(0, cityIdx).join(', ');
    return { countryCode: country.code, stateCode, city, rawFallback: '' };
};

// Configuration for country selection
export const COUNTRY_CONFIG = {
    separator: ', ',
    maxCountries: 1,
    allowCustomInput: true
};