// Per-market metadata used by the frontend:
// city coordinates (for map), truck types, commodities, payment methods, regulatory notes.

export const MARKETS = {
  kenya: {
    id: 'kenya', name: 'Kenya', flag: '🇰🇪',
    currency: 'KES', symbol: 'KSh', locale: 'en-KE',
    mapCenter: [-1.286, 36.817], mapZoom: 7,
    paymentMethod: 'M-Pesa / Bank Transfer',
    truckTypes: ['Flatbed', 'Reefer', 'Dry Van', 'Tanker', 'Lowboy', 'Step Deck'],
    commodities: ['Steel Coils','Frozen Goods','Electronics','Grain','Chemicals','Auto Parts','Cement','Timber','General Cargo','FMCG'],
    regulatory: 'NTSA regulations · C-Force permit required for oversize loads',
    cities: ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Garissa','Nyeri','Kitale'],
  },
  india: {
    id: 'india', name: 'India', flag: '🇮🇳',
    currency: 'INR', symbol: '₹', locale: 'en-IN',
    mapCenter: [20.593, 78.963], mapZoom: 5,
    paymentMethod: 'UPI / NEFT / RTGS',
    truckTypes: ['LCV (< 7.5T)','HCV (7.5–16T)','Trailer','Container 20ft','Container 40ft','Tanker','Reefer','Flatbed'],
    commodities: ['Steel Coils','Electronics','Dairy Products','Auto Parts','Chemicals','Textiles','Pharmaceuticals','FMCG','Grain','Machinery'],
    regulatory: 'GST e-Invoice required · e-Way Bill mandatory >50km · Fastag on national highways',
    cities: ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad','Surat','Jaipur','Nagpur','Lucknow'],
  },
  canada: {
    id: 'canada', name: 'Canada', flag: '🇨🇦',
    currency: 'CAD', symbol: 'CA$', locale: 'en-CA',
    mapCenter: [56.130, -106.347], mapZoom: 4,
    paymentMethod: 'EFT / Wire Transfer / Cheque',
    truckTypes: ['Cargo Van', 'Straight Truck (4T)', 'Semi-Trailer 53ft', 'Flatbed', 'Reefer', 'B-Train Double', 'Lowboy'],
    commodities: ['Lumber','Auto Parts','Electronics','Oil Equipment','Grain','Chemicals','Frozen Goods','Machinery','Construction Materials','FMCG'],
    regulatory: 'HOS regulations apply · ELD mandate · CVOR certificate required · Oversize: MTO permit',
    cities: ['Toronto','Montreal','Vancouver','Calgary','Edmonton','Winnipeg','Ottawa','Halifax','Saskatoon','Quebec City'],
  },
  us: {
    id: 'us', name: 'United States', flag: '🇺🇸',
    currency: 'USD', symbol: '$', locale: 'en-US',
    mapCenter: [39.833, -98.583], mapZoom: 4,
    paymentMethod: 'ACH / Wire Transfer / Check / Credit Card',
    truckTypes: ['Sprinter Van', 'Box Truck', 'Dry Van 53ft', 'Flatbed', 'Reefer', 'Step Deck', 'Tanker', 'Double Drop', 'LTL'],
    commodities: ['Electronics','Frozen Goods','Chemicals','Auto Parts','Machinery','Lumber','FMCG','Retail Goods','Medical Equipment','Hazmat'],
    regulatory: 'FMCSA / DOT regulations · ELD mandate (Hours of Service) · CDL required · Hazmat: PHMSA placard',
    cities: ['Los Angeles','Chicago','New York','Dallas','Houston','Atlanta','Miami','Seattle','Denver','Phoenix','Boston','Detroit'],
  },
};

// City coordinates lookup (used for Leaflet map markers + truck interpolation)
export const CITY_COORDS = {
  // Kenya
  'Nairobi':     [-1.2921,  36.8219],
  'Mombasa':     [-4.0435,  39.6682],
  'Kisumu':      [-0.1022,  34.7617],
  'Nakuru':      [-0.3031,  36.0800],
  'Eldoret':     [ 0.5143,  35.2698],
  'Thika':       [-1.0332,  37.0693],
  'Malindi':     [-3.2175,  40.1169],
  'Garissa':     [-0.4554,  39.6582],
  'Nyeri':       [-0.4167,  36.9500],
  'Kitale':      [ 1.0154,  35.0062],
  // India
  'Mumbai':      [19.0760,  72.8777],
  'Delhi':       [28.6139,  77.2090],
  'Bangalore':   [12.9716,  77.5946],
  'Chennai':     [13.0827,  80.2707],
  'Hyderabad':   [17.3850,  78.4867],
  'Pune':        [18.5204,  73.8567],
  'Kolkata':     [22.5726,  88.3639],
  'Ahmedabad':   [23.0225,  72.5714],
  'Surat':       [21.1702,  72.8311],
  'Jaipur':      [26.9124,  75.7873],
  'Nagpur':      [21.1458,  79.0882],
  'Lucknow':     [26.8467,  80.9462],
  // Canada
  'Toronto':     [43.6532,  -79.3832],
  'Montreal':    [45.5017,  -73.5673],
  'Vancouver':   [49.2827, -123.1207],
  'Calgary':     [51.0447, -114.0719],
  'Edmonton':    [53.5461, -113.4938],
  'Winnipeg':    [49.8954,  -97.1385],
  'Ottawa':      [45.4215,  -75.6972],
  'Halifax':     [44.6488,  -63.5752],
  'Saskatoon':   [52.1332, -106.6700],
  'Quebec City': [46.8139,  -71.2080],
  // US
  'Los Angeles': [34.0522, -118.2437],
  'Chicago':     [41.8781,  -87.6298],
  'New York':    [40.7128,  -74.0060],
  'Dallas':      [32.7767,  -96.7970],
  'Houston':     [29.7604,  -95.3698],
  'Atlanta':     [33.7490,  -84.3880],
  'Miami':       [25.7617,  -80.1918],
  'Seattle':     [47.6062, -122.3321],
  'Denver':      [39.7392, -104.9903],
  'Phoenix':     [33.4484, -112.0740],
  'Boston':      [42.3601,  -71.0589],
  'Detroit':     [42.3314,  -83.0458],
};

export function getMarket(id) {
  return MARKETS[id] || MARKETS.kenya;
}

export function formatCurrency(amount, marketId) {
  const m = getMarket(marketId);
  return new Intl.NumberFormat(m.locale, {
    style: 'currency', currency: m.currency, maximumFractionDigits: 0,
  }).format(amount);
}
