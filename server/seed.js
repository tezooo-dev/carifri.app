/**
 * server/seed.js — PostgreSQL seed (async)
 * Seeds companies, users, settings, carriers, shippers, loads, tracking codes
 * Uses pg pool from server/lib/db.js
 */
const bcrypt = require('bcryptjs');
const { pool } = require('./lib/db');

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Companies (tenants) ───────────────────────────────────────────────────
    const companies = [
      { id: 'co-ke', name: 'FreightLink Kenya',  slug: 'freightlink-ke', market: 'kenya',  plan: 'professional' },
      { id: 'co-in', name: 'FreightLink India',  slug: 'freightlink-in', market: 'india',  plan: 'professional' },
      { id: 'co-ca', name: 'FreightLink Canada', slug: 'freightlink-ca', market: 'canada', plan: 'professional' },
      { id: 'co-us', name: 'FreightLink US',     slug: 'freightlink-us', market: 'us',     plan: 'professional' },
    ];
    for (const c of companies) {
      await client.query(
        `INSERT INTO companies (id, name, slug, market, plan, status)
         VALUES ($1,$2,$3,$4,$5,'active')
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.slug, c.market, c.plan]
      );
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    // Super admin has no company_id (cross-tenant)
    const users = [
      { id: 'u0', company_id: null,    name: 'IT Super Admin',    email: 'it@freightlink.io',          pw: 'super123',   role: 'super_admin', avatar: 'IT', market: 'kenya'  },
      { id: 'u1', company_id: 'co-ke', name: 'Admin User',        email: 'admin@freightlink.co.ke',    pw: 'admin123',   role: 'admin',       avatar: 'AU', market: 'kenya'  },
      { id: 'u2', company_id: 'co-ke', name: 'James Kimani',      email: 'ops@freightlink.co.ke',      pw: 'ops123',     role: 'operations',  avatar: 'JK', market: 'kenya'  },
      { id: 'u3', company_id: 'co-ke', name: 'Aisha Finance',     email: 'finance@freightlink.co.ke',  pw: 'finance123', role: 'operations',  avatar: 'AF', market: 'kenya'  },
      { id: 'u4', company_id: 'co-in', name: 'Raj Patel',         email: 'admin@freightlink.in',       pw: 'admin123',   role: 'admin',       avatar: 'RP', market: 'india'  },
      { id: 'u5', company_id: 'co-ca', name: 'Sarah Mitchell',    email: 'admin@freightlink.ca',       pw: 'admin123',   role: 'admin',       avatar: 'SM', market: 'canada' },
      { id: 'u6', company_id: 'co-us', name: 'Mike Johnson',      email: 'admin@freightlink.us',       pw: 'admin123',   role: 'admin',       avatar: 'MJ', market: 'us'     },
    ];
    for (const u of users) {
      const hash = await bcrypt.hash(u.pw, 10);
      await client.query(
        `INSERT INTO users (id, company_id, name, email, password_hash, role, avatar, market)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.company_id, u.name, u.email, hash, u.role, u.avatar, u.market]
      );
    }

    // ── Settings (one per company) ────────────────────────────────────────────
    const settingsRows = [
      { cid: 'co-ke', name: 'FreightLink Kenya',  phone: '+254 700 000 000', email: 'ops@freightlink.co.ke', rate: 8.0,  currency: 'KES', country: 'Kenya',         market: 'kenya'  },
      { cid: 'co-in', name: 'FreightLink India',  phone: '+91 98000 00000',  email: 'ops@freightlink.in',   rate: 6.0,  currency: 'INR', country: 'India',         market: 'india'  },
      { cid: 'co-ca', name: 'FreightLink Canada', phone: '+1 416 000 0000',  email: 'ops@freightlink.ca',   rate: 5.0,  currency: 'CAD', country: 'Canada',        market: 'canada' },
      { cid: 'co-us', name: 'FreightLink US',     phone: '+1 800 000 0000',  email: 'ops@freightlink.us',   rate: 5.0,  currency: 'USD', country: 'United States', market: 'us'     },
    ];
    for (const s of settingsRows) {
      await client.query(
        `INSERT INTO settings (company_id, company_name, company_phone, company_email, commission_rate, currency, country, market)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (company_id) DO NOTHING`,
        [s.cid, s.name, s.phone, s.email, s.rate, s.currency, s.country, s.market]
      );
    }

    // ── Carriers ──────────────────────────────────────────────────────────────
    const carriers = [
      // Kenya — co-ke
      ['c1','co-ke','kenya','FastHaul Logistics','James Mwangi','+254712345678','james@fasthaul.co.ke','Nairobi',['Flatbed','Step Deck'],8,4.8,true,47],
      ['c2','co-ke','kenya','Arctic Freight Co.','Amina Osei','+254723456789','amina@arcticfreight.co.ke','Mombasa',['Reefer','Dry Van'],5,4.6,true,32],
      ['c3','co-ke','kenya','BulkMover Ltd','Samuel Kiprotich','+254734567890','sam@bulkmover.co.ke','Kisumu',['Tanker','Dry Van'],12,4.3,false,18],
      ['c4','co-ke','kenya','HeavyLift Solutions','Grace Njeri','+254745678901','grace@heavylift.co.ke','Nairobi',['Lowboy','Flatbed'],4,4.9,true,29],
      // India — co-in
      ['c5','co-in','india','Shree Ram Logistics','Arjun Sharma','+911234567890','arjun@shreeramlog.in','Delhi',['Flatbed','Container 40ft'],10,4.7,true,63],
      ['c6','co-in','india','BlueDart Express','Priya Nair','+912345678901','priya@bluedart.in','Mumbai',['LCV','HCV'],15,4.5,true,89],
      ['c7','co-in','india','DTDC Freight','Vikram Singh','+913456789012','vikram@dtdcfreight.in','Bangalore',['Dry Van','Reefer'],7,4.4,true,34],
      ['c8','co-in','india','Mahindra Logistics','Sunita Patel','+914567890123','sunita@mahlogistics.in','Pune',['HCV','Trailer'],20,4.6,true,112],
      // Canada — co-ca
      ['c9','co-ca','canada','TransCan Freight','David Thompson','+14161234567','david@transcanfreight.ca','Toronto',['Dry Van','Flatbed'],12,4.8,true,58],
      ['c10','co-ca','canada','Rocky Mountain Haulers','Jessica Brown','+14032345678','jessica@rockymtn.ca','Calgary',['Flatbed','Step Deck'],8,4.7,true,41],
      ['c11','co-ca','canada','Pacific Coast Logistics','Michael Lee','+16043456789','michael@pacificcoast.ca','Vancouver',['Reefer','Dry Van'],6,4.5,true,37],
      ['c12','co-ca','canada','Great Lakes Transport','Sophie Tremblay','+15144567890','sophie@greatlakes.ca','Montreal',['Dry Van','Tanker'],9,4.6,false,22],
      // US — co-us
      ['c13','co-us','us','Swift Transportation','Bob Harris','+14801234567','bob@swifttrans.com','Phoenix',['Dry Van','Reefer'],45,4.5,true,234],
      ['c14','co-us','us','Werner Enterprises','Karen White','+14022345678','karen@werner.com','Chicago',['Dry Van','Flatbed'],38,4.6,true,189],
      ['c15','co-us','us','JB Hunt Transport','Tony Garcia','+14693456789','tony@jbhunt.com','Dallas',['Dry Van','Intermodal'],52,4.7,true,312],
      ['c16','co-us','us','Old Dominion Freight','Lisa Chen','+19144567890','lisa@odfl.com','New York',['LTL','Dry Van'],28,4.8,true,167],
    ];
    for (const [id, company_id, market, name, contact, phone, email, location, truck_types, truck_count, rating, verified, total_loads] of carriers) {
      await client.query(
        `INSERT INTO carriers (id,company_id,market,name,contact,phone,email,location,truck_types,truck_count,rating,verified,total_loads)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO NOTHING`,
        [id, company_id, market, name, contact, phone, email, location, JSON.stringify(truck_types), truck_count, rating, verified, total_loads]
      );
    }

    // ── Shippers ──────────────────────────────────────────────────────────────
    const shippers = [
      ['s1','co-ke','kenya','Bamburi Cement','Peter Otieno','+254756789012','peter.otieno@bamburi.co.ke','Mombasa',23,4850000,'Construction'],
      ['s2','co-ke','kenya','Kenya Breweries','Susan Kamau','+254767890123','susan.k@kbl.co.ke','Nairobi',41,8200000,'FMCG'],
      ['s3','co-ke','kenya','Naivas Supermarkets','David Njoroge','+254778901234','d.njoroge@naivas.co.ke','Nairobi',67,12400000,'Retail'],
      ['s4','co-ke','kenya','TotalEnergies Kenya','Fatuma Hassan','+254789012345','fatuma@totalenergies.co.ke','Mombasa',15,6750000,'Energy'],
      ['s5','co-in','india','Tata Steel','Rohit Kumar','+919876543210','rohit@tatasteel.com','Mumbai',87,45000000,'Manufacturing'],
      ['s6','co-in','india','Flipkart Logistics','Ananya Reddy','+918765432109','ananya@flipkart.com','Bangalore',156,78000000,'E-Commerce'],
      ['s7','co-in','india','Amul Dairy','Suresh Patel','+917654321098','suresh@amul.com','Ahmedabad',43,18000000,'FMCG'],
      ['s8','co-in','india','Reliance Retail','Meera Joshi','+916543210987','meera@relianceretail.com','Mumbai',112,62000000,'Retail'],
      ['s9','co-ca','canada','Bombardier Manufacturing','Pierre Lachance','+15141234567','pierre@bombardier.ca','Montreal',28,1250000,'Manufacturing'],
      ['s10','co-ca','canada','Canadian Tire','Amanda Wong','+14162345678','amanda@canadiantire.ca','Toronto',64,2800000,'Retail'],
      ['s11','co-ca','canada','Tim Hortons Supply','Brian Osei','+14033456789','brian@timhortons.ca','Calgary',38,950000,'FMCG'],
      ['s12','co-ca','canada','CN Rail Distribution','Chantal Dubois','+16044567890','chantal@cn.ca','Vancouver',19,3400000,'Logistics'],
      ['s13','co-us','us','Amazon Fulfillment','Jennifer Adams','+12061234567','jennifer@amazon.com','Seattle',420,18500000,'E-Commerce'],
      ['s14','co-us','us','Walmart Distribution','Carlos Rivera','+19722345678','carlos@walmart.com','Dallas',380,16200000,'Retail'],
      ['s15','co-us','us','Target Supply Chain','Amanda Foster','+16123456789','amanda@target.com','Chicago',195,8900000,'Retail'],
      ['s16','co-us','us','Home Depot','Robert Kim','+14044567890','robert@homedepot.com','Atlanta',143,7600000,'Home Improvement'],
    ];
    for (const [id, company_id, market, name, contact, phone, email, location, total_loads, total_spend, industry] of shippers) {
      await client.query(
        `INSERT INTO shippers (id,company_id,market,name,contact,phone,email,location,total_loads,total_spend,industry)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [id, company_id, market, name, contact, phone, email, location, total_loads, total_spend, industry]
      );
    }

    // ── Loads ─────────────────────────────────────────────────────────────────
    const now = new Date();
    const d = (offset) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + offset);
      return dt.toISOString().split('T')[0];
    };
    const tl = (events) => JSON.stringify(events);

    const loads = [
      // Kenya
      ['FL-001','co-ke','kenya','Mombasa','Nairobi','Steel Coils',25000,'Flatbed',180000,14400,90000,'Delivered','s1','c1','Peter Otieno','+254756789012',d(-3),d(-2),'Handle with care. Secure strapping required.',true,true,
        tl([{event:'Load Posted',time:`${d(-6)} 09:00`,done:true},{event:'Carrier Assigned',time:`${d(-6)} 11:30`,done:true},{event:'Picked Up',time:`${d(-3)} 07:15`,done:true},{event:'In Transit',time:`${d(-3)} 08:00`,done:true},{event:'Delivered',time:`${d(-2)} 14:45`,done:true}])],
      ['FL-002','co-ke','kenya','Nairobi','Kisumu','Frozen Goods',8000,'Reefer',95000,7600,47500,'In Transit','s2','c2','Susan Kamau','+254767890123',d(0),d(0),'Maintain temp at -18°C throughout.',true,false,
        tl([{event:'Load Posted',time:`${d(-2)} 14:00`,done:true},{event:'Carrier Assigned',time:`${d(-2)} 16:00`,done:true},{event:'Picked Up',time:`${d(0)} 06:30`,done:true},{event:'In Transit',time:`${d(0)} 07:00`,done:true},{event:'Delivered',time:'',done:false}])],
      ['FL-003','co-ke','kenya','Nakuru','Mombasa','Grain',30000,'Dry Van',145000,11600,72500,'Booked','s3','c3','David Njoroge','+254778901234',d(1),d(2),'',false,false,
        tl([{event:'Load Posted',time:`${d(-1)} 10:00`,done:true},{event:'Carrier Assigned',time:`${d(-1)} 12:00`,done:true},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['FL-004','co-ke','kenya','Nairobi','Eldoret','Electronics',4500,'Dry Van',75000,6000,0,'Available','s2','','Susan Kamau','+254767890123',d(2),d(2),'Fragile. No stacking.',true,false,
        tl([{event:'Load Posted',time:`${d(-1)} 15:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['FL-005','co-ke','kenya','Mombasa','Nairobi','Chemicals',18000,'Tanker',220000,17600,0,'Available','s4','','Fatuma Hassan','+254789012345',d(3),d(4),'ADR certified driver required.',true,false,
        tl([{event:'Load Posted',time:`${d(-1)} 16:30`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      // India
      ['IN-001','co-in','india','Mumbai','Delhi','Steel Coils',30000,'Flatbed',185000,14800,92500,'Delivered','s5','c5','Rohit Kumar','+919876543210',d(-4),d(-2),'Secure strapping required.',true,true,
        tl([{event:'Load Posted',time:`${d(-7)} 09:00`,done:true},{event:'Carrier Assigned',time:`${d(-7)} 11:00`,done:true},{event:'Picked Up',time:`${d(-4)} 06:00`,done:true},{event:'In Transit',time:`${d(-4)} 07:00`,done:true},{event:'Delivered',time:`${d(-2)} 18:00`,done:true}])],
      ['IN-002','co-in','india','Delhi','Bangalore','Electronics',5000,'LCV',145000,11600,72500,'In Transit','s6','c6','Ananya Reddy','+918765432109',d(0),d(2),'Fragile. Temperature controlled.',true,false,
        tl([{event:'Load Posted',time:`${d(-3)} 10:00`,done:true},{event:'Carrier Assigned',time:`${d(-3)} 12:00`,done:true},{event:'Picked Up',time:`${d(0)} 05:00`,done:true},{event:'In Transit',time:`${d(0)} 06:00`,done:true},{event:'Delivered',time:'',done:false}])],
      ['IN-003','co-in','india','Ahmedabad','Mumbai','Dairy Products',12000,'Reefer',95000,7600,47500,'Booked','s7','c7','Suresh Patel','+917654321098',d(1),d(1),'Maintain cold chain -4°C.',true,false,
        tl([{event:'Load Posted',time:`${d(-1)} 11:00`,done:true},{event:'Carrier Assigned',time:`${d(-1)} 13:00`,done:true},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['IN-004','co-in','india','Pune','Chennai','Auto Parts',20000,'HCV',175000,14000,0,'Available','s8','','Meera Joshi','+916543210987',d(2),d(4),'',false,false,
        tl([{event:'Load Posted',time:`${d(0)} 09:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['IN-005','co-in','india','Chennai','Hyderabad','Chemicals',18000,'Tanker',125000,10000,0,'Available','s5','','Rohit Kumar','+919876543210',d(3),d(3),'ADR required.',true,false,
        tl([{event:'Load Posted',time:`${d(0)} 14:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      // Canada
      ['CA-001','co-ca','canada','Toronto','Montreal','Auto Parts',15000,'Dry Van',2800,224,1400,'Delivered','s9','c9','Pierre Lachance','+15141234567',d(-5),d(-4),'',false,true,
        tl([{event:'Load Posted',time:`${d(-8)} 09:00`,done:true},{event:'Carrier Assigned',time:`${d(-8)} 10:00`,done:true},{event:'Picked Up',time:`${d(-5)} 07:00`,done:true},{event:'In Transit',time:`${d(-5)} 08:00`,done:true},{event:'Delivered',time:`${d(-4)} 16:00`,done:true}])],
      ['CA-002','co-ca','canada','Vancouver','Calgary','Lumber',25000,'Flatbed',3500,280,1750,'In Transit','s12','c10','Chantal Dubois','+16044567890',d(-1),d(1),'Oversized load — pilot car required.',false,false,
        tl([{event:'Load Posted',time:`${d(-3)} 08:00`,done:true},{event:'Carrier Assigned',time:`${d(-3)} 10:00`,done:true},{event:'Picked Up',time:`${d(-1)} 06:00`,done:true},{event:'In Transit',time:`${d(-1)} 07:00`,done:true},{event:'Delivered',time:'',done:false}])],
      ['CA-003','co-ca','canada','Calgary','Edmonton','Oil Equipment',30000,'Lowboy',4200,336,0,'Booked','s11','c11','Brian Osei','+14033456789',d(1),d(1),'Wide load. Permit required.',true,false,
        tl([{event:'Load Posted',time:`${d(-1)} 09:00`,done:true},{event:'Carrier Assigned',time:`${d(-1)} 11:00`,done:true},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['CA-004','co-ca','canada','Montreal','Toronto','Electronics',8000,'Reefer',2100,168,0,'Available','s10','','Amanda Wong','+14162345678',d(2),d(2),'Temperature sensitive.',true,false,
        tl([{event:'Load Posted',time:`${d(0)} 10:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      // US
      ['US-001','co-us','us','Los Angeles','Chicago','Electronics',18000,'Dry Van',4200,336,2100,'Delivered','s13','c13','Jennifer Adams','+12061234567',d(-6),d(-4),'High value cargo. GPS tracking required.',true,true,
        tl([{event:'Load Posted',time:`${d(-9)} 09:00`,done:true},{event:'Carrier Assigned',time:`${d(-9)} 11:00`,done:true},{event:'Picked Up',time:`${d(-6)} 06:00`,done:true},{event:'In Transit',time:`${d(-6)} 07:00`,done:true},{event:'Delivered',time:`${d(-4)} 15:00`,done:true}])],
      ['US-002','co-us','us','New York','Miami','Frozen Goods',12000,'Reefer',3800,304,1900,'In Transit','s14','c14','Carlos Rivera','+19722345678',d(-1),d(1),'Maintain -18°C.',true,false,
        tl([{event:'Load Posted',time:`${d(-3)} 07:00`,done:true},{event:'Carrier Assigned',time:`${d(-3)} 09:00`,done:true},{event:'Picked Up',time:`${d(-1)} 05:00`,done:true},{event:'In Transit',time:`${d(-1)} 06:00`,done:true},{event:'Delivered',time:'',done:false}])],
      ['US-003','co-us','us','Dallas','Houston','Chemicals',20000,'Tanker',2500,200,1250,'Booked','s15','c15','Amanda Foster','+16123456789',d(1),d(1),'Hazmat Class 3.',true,false,
        tl([{event:'Load Posted',time:`${d(-1)} 10:00`,done:true},{event:'Carrier Assigned',time:`${d(-1)} 12:00`,done:true},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['US-004','co-us','us','Chicago','Detroit','Auto Parts',22000,'Flatbed',3100,248,0,'Available','s16','','Robert Kim','+14044567890',d(2),d(2),'',false,false,
        tl([{event:'Load Posted',time:`${d(0)} 11:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
      ['US-005','co-us','us','Seattle','Denver','Machinery',28000,'Step Deck',5500,440,0,'Available','s13','','Jennifer Adams','+12061234567',d(3),d(4),'Oversize. Escort required.',false,false,
        tl([{event:'Load Posted',time:`${d(0)} 14:00`,done:true},{event:'Carrier Assigned',time:'',done:false},{event:'Picked Up',time:'',done:false},{event:'In Transit',time:'',done:false},{event:'Delivered',time:'',done:false}])],
    ];

    for (const [id,company_id,market,origin,destination,commodity,weight,truck_type,freight_amount,commission,advance,status,shipper_id,carrier_id,shipper_contact,shipper_phone,pickup_date,delivery_date,special_instructions,cargo_insurance,commission_received,timeline] of loads) {
      await client.query(
        `INSERT INTO loads (id,company_id,market,origin,destination,commodity,weight,truck_type,freight_amount,commission,advance,status,shipper_id,carrier_id,shipper_contact,shipper_phone,pickup_date,delivery_date,special_instructions,cargo_insurance,commission_received,timeline)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
         ON CONFLICT (id) DO NOTHING`,
        [id,company_id,market,origin,destination,commodity,weight,truck_type,freight_amount,commission,advance,status,shipper_id,carrier_id,shipper_contact,shipper_phone,pickup_date,delivery_date,special_instructions,cargo_insurance,commission_received,timeline]
      );
    }

    // ── Tracking Codes ────────────────────────────────────────────────────────
    const trackingCodes = [
      ['X1','Pickup','Picked Up','Shipment picked up from origin',false],
      ['AF','Pickup','Carrier Dispatched','Driver dispatched to pickup location',false],
      ['AM','Pickup','Loaded on Trailer','Freight loaded and secured on trailer',false],
      ['X6','Transit','In Transit','Shipment is in transit to destination',false],
      ['AG','Transit','Estimated Delivery Updated','ETA has been revised by the carrier',false],
      ['X8','Transit','Arrived at Terminal / Cross-dock','Freight arrived at intermediate terminal',false],
      ['X9','Transit','Departed Terminal','Freight departed terminal toward destination',false],
      ['A3','Transit','Shipment Returned to Shipper','Shipment could not be delivered — returned',false],
      ['A7','Transit','Refused by Consignee','Consignee refused the shipment',false],
      ['A9','Transit','Shipment Damaged','Cargo damage identified in transit',false],
      ['AA','Transit','Shipment Held','Shipment held at carrier facility',false],
      ['AB','Transit','Out for Delivery','Driver loaded and heading to delivery address',false],
      ['D1','Delivery','Delivered','Shipment successfully delivered',true],
      ['X3','Delivery','Delivered — POD Obtained','Delivered with Proof of Delivery signature',true],
      ['P1','Delivery','Delivery Attempted — No Access','Driver could not access delivery location',false],
      ['CA','Delivery','Delivery Rescheduled','Delivery date/time changed by carrier or shipper',false],
      ['L1','Exception','Late — Weather Delay','Shipment delayed due to weather conditions',false],
      ['L2','Exception','Late — Mechanical Breakdown','Carrier vehicle mechanical issue',false],
      ['L3','Exception','Late — Traffic / Road Closure','Delay due to traffic, accident, or road closure',false],
      ['L4','Exception','Late — Border / Customs Hold','Shipment held at US-Canada border for inspection',false],
      ['L5','Exception','Late — Driver Hours (HOS)','Driver exceeded hours-of-service limit',false],
      ['OB','Exception','Overweight / Oversize Issue','Load flagged for weight or dimension violation',false],
      ['RS','Exception','Shipment Rerouted','Route changed due to road conditions or instructions',false],
      ['C1','Documents','BOL Received','Bill of Lading received by carrier',false],
      ['C2','Documents','Rate Confirmation Signed','Carrier signed rate confirmation',false],
      ['C3','Documents','Proof of Delivery Uploaded','POD document uploaded by carrier',false],
      ['C4','Documents','Invoice Submitted','Carrier invoice submitted for payment',false],
      ['C5','Documents','Insurance Certificate Submitted','COI uploaded to carrier file',false],
      ['CB','Customs','CBSA ACI eManifest Filed','Canadian ACI eManifest submitted',false],
      ['CX','Customs','Cleared Customs','Shipment cleared US/Canada customs inspection',false],
      ['CH','Customs','Customs Hold','Shipment held at border for CBSA/CBP inspection',false],
      ['CR','Customs','Customs Exam Required','Random or flagged customs examination requested',false],
      ['B1','Billing','Advance Payment Requested','Carrier requesting advance/fuel advance',false],
      ['B2','Billing','Advance Payment Sent','Broker confirmed advance payment sent',false],
      ['B3','Billing','Final Payment Requested','Carrier invoice submitted for final payment',false],
      ['B4','Billing','Payment Remitted','Broker confirmed payment sent to carrier',true],
      ['DR','Driver','Driver Assigned','Named driver assigned to this load',false],
      ['DC','Driver','Driver Changed','Different driver assigned to load',false],
      ['TU','Driver','Truck / Unit Changed','Different equipment assigned to load',false],
      ['EL','Driver','ELD Compliance Confirmed','Driver confirmed ELD compliant for this run',false],
    ];
    for (const [code, category, message, description, is_terminal] of trackingCodes) {
      await client.query(
        `INSERT INTO tracking_codes (code, category, message, description, is_terminal)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (code) DO NOTHING`,
        [code, category, message, description, is_terminal]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Database seeded with Kenya / India / Canada / US demo data');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seedDatabase };
