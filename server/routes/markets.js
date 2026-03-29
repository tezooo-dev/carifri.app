const router = require('express').Router();

const MARKETS = [
  { id: 'kenya',  name: 'Kenya',         currency: 'KES', symbol: 'KSh', flag: '🇰🇪', locale: 'en-KE', paymentMethod: 'M-Pesa / Bank Transfer'  },
  { id: 'india',  name: 'India',         currency: 'INR', symbol: '₹',   flag: '🇮🇳', locale: 'en-IN', paymentMethod: 'UPI / NEFT / RTGS'        },
  { id: 'canada', name: 'Canada',        currency: 'CAD', symbol: 'CA$', flag: '🇨🇦', locale: 'en-CA', paymentMethod: 'EFT / Wire Transfer'       },
  { id: 'us',     name: 'United States', currency: 'USD', symbol: '$',   flag: '🇺🇸', locale: 'en-US', paymentMethod: 'ACH / Wire Transfer'       },
];

router.get('/', (req, res) => res.json(MARKETS));

module.exports = router;
