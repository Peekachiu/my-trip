# 🌍 Country Selection Feature

This document describes the country selection feature implemented in the travel management application.

## Features

### 1. Single Country Selection
- **Only one country allowed per trip**
- Users can choose either from popular countries list or type a custom destination
- Clear validation to prevent multiple selections

### 2. Popular Countries List
- Pre-defined list of 20 popular travel destinations
- Includes flags for visual identification
- Countries can be easily added or removed

### 3. Custom Destination Support
- Users can type custom destinations
- Mutually exclusive with country selection from list
- Flexible for destinations not in the popular list

## Implementation Details

### Files Modified

1. **`/frontend/src/lib/countries.ts`**
   - Contains country data and configuration
   - Defines popular countries list
   - Configures single country selection

2. **`/frontend/src/components/CreateTripForm.tsx`**
   - Updated for single country selection
   - Added validation to prevent multiple destinations
   - Simplified UI for single selection

3. **`/frontend/src/app/trip/[id]/page.tsx`**
   - Updated to properly display single destination

### Configuration

```typescript
export const COUNTRY_CONFIG = {
    separator: ' , ', // Custom separator (for backward compatibility)
    maxCountries: 1, // Only one country allowed per trip
    allowCustomInput: true // Allow users to type custom destinations
};
```

### Available Countries

The current popular countries list includes:

- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇫🇷 France
- 🇩🇪 Germany
- 🇮🇹 Italy
- 🇪🇸 Spain
- 🇯🇵 Japan
- 🇰🇷 South Korea
- 🇨🇳 China
- 🇮🇳 India
- 🇦🇺 Australia
- 🇨🇦 Canada
- 🇧🇷 Brazil
- 🇲🇽 Mexico
- 🇹🇭 Thailand
- 🇸🇬 Singapore
- 🇲🇾 Malaysia
- 🇮🇩 Indonesia
- 🇻🇳 Vietnam
- 🇵🇭 Philippines

## Usage

### Creating a Trip with Single Country

1. **Option 1: Select from popular countries**
   - Click "Select a country..." to open the dropdown
   - Choose one country from the list
   - Selected country appears with flag

2. **Option 2: Type custom destination**
   - Type your destination in the custom input field
   - Automatically clears any selected country

### Validation Rules

- ❌ Cannot select both a country from list AND type a custom destination
- ✅ Must select exactly one destination (either from list or custom)
- ✅ Backward compatible with existing single-destination trips

## Adding More Countries

To add more countries to the popular list:

1. Edit `/frontend/src/lib/countries.ts`
2. Add new entries to the `POPULAR_COUNTRIES` array:

```typescript
{ code: 'NEW', name: 'New Country', flag: '🏳️' }
```

## Notes

- The system maintains backward compatibility with existing trips
- Custom destinations are treated as strings and don't have flag icons
- All changes are automatically saved in the existing trip data structure
- The separator configuration is maintained for compatibility but not used in single selection mode