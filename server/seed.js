const bcrypt = require('bcryptjs');

function seedDatabase(db) {
  // ── Users ─────────────────────────────────────────────────────────────────
  const users = [
    // Super admin — FreightLink IT team (platform-level access)
    { id: 'u0', name: 'IT Super Admin',    email: 'it@freightlink.io',            password: 'super123',   role: 'super_admin', avatar: 'IT', market: 'kenya'  },
    // Per-market client admins
    { id: 'u1', name: 'Admin User',        email: 'admin@freightlink.co.ke',      password: 'admin123',   role: 'admin',      avatar: 'AU', market: 'kenya'  },
    { id: 'u2', name: 'James Kimani',      email: 'ops@freightlink.co.ke',        password: 'ops123',     role: 'operations', avatar: 'JK', market: 'kenya'  },
    { id: 'u3', name: 'Aisha Finance',     email: 'finance@freightlink.co.ke',    password: 'finance123', role: 'operations', avatar: 'AF', market: 'kenya'  },
    { id: 'u4', name: 'Raj Patel',         email: 'admin@freightlink.in',         password: 'admin123',   role: 'admin',      avatar: 'RP', market: 'india'  },
    { id: 'u5', name: 'Sarah Mitchell',    email: 'admin@freightlink.ca',         password: 'admin123',   role: 'admin',      avatar: 'SM', market: 'canada' },
    { id: 'u6', name: 'Mike Johnson',      email: 'admin@freightlink.us',         password: 'admin123',   role: 'admin',      avatar: 'MJ', market: 'us'     },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, avatar, market)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, bcrypt.hashSync(u.password, 10), u.role, u.avatar, u.market);
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  db.prepare(`
    INSERT OR IGNORE INTO settings (id, company_name, company_phone, company_email, commission_rate, currency, country, market)
    VALUES (1, 'FreightLink Brokerage', '+254 700 000 000', 'ops@freightlink.co.ke', 8.0, 'KES', 'Kenya', 'kenya')
  `).run();

  // ── Carriers ──────────────────────────────────────────────────────────────
  const insertCarrier = db.prepare(`
    INSERT OR IGNORE INTO carriers (id, market, name, contact, phone, email, location, truck_types, truck_count, rating, verified, total_loads)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const carriers = [
    // Kenya
    ['c1','kenya','FastHaul Logistics','James Mwangi','+254712345678','james@fasthaul.co.ke','Nairobi','["Flatbed","Step Deck"]',8,4.8,1,47],
    ['c2','kenya','Arctic Freight Co.','Amina Osei','+254723456789','amina@arcticfreight.co.ke','Mombasa','["Reefer","Dry Van"]',5,4.6,1,32],
    ['c3','kenya','BulkMover Ltd','Samuel Kiprotich','+254734567890','sam@bulkmover.co.ke','Kisumu','["Tanker","Dry Van"]',12,4.3,0,18],
    ['c4','kenya','HeavyLift Solutions','Grace Njeri','+254745678901','grace@heavylift.co.ke','Nairobi','["Lowboy","Flatbed"]',4,4.9,1,29],
    // India
    ['c5','india','Shree Ram Logistics','Arjun Sharma','+911234567890','arjun@shreeramlog.in','Delhi','["Flatbed","Container 40ft"]',10,4.7,1,63],
    ['c6','india','BlueDart Express','Priya Nair','+912345678901','priya@bluedart.in','Mumbai','["LCV","HCV"]',15,4.5,1,89],
    ['c7','india','DTDC Freight','Vikram Singh','+913456789012','vikram@dtdcfreight.in','Bangalore','["Dry Van","Reefer"]',7,4.4,1,34],
    ['c8','india','Mahindra Logistics','Sunita Patel','+914567890123','sunita@mahlogistics.in','Pune','["HCV","Trailer"]',20,4.6,1,112],
    // Canada
    ['c9','canada','TransCan Freight','David Thompson','+14161234567','david@transcanfreight.ca','Toronto','["Dry Van","Flatbed"]',12,4.8,1,58],
    ['c10','canada','Rocky Mountain Haulers','Jessica Brown','+14032345678','jessica@rockymtn.ca','Calgary','["Flatbed","Step Deck"]',8,4.7,1,41],
    ['c11','canada','Pacific Coast Logistics','Michael Lee','+16043456789','michael@pacificcoast.ca','Vancouver','["Reefer","Dry Van"]',6,4.5,1,37],
    ['c12','canada','Great Lakes Transport','Sophie Tremblay','+15144567890','sophie@greatlakes.ca','Montreal','["Dry Van","Tanker"]',9,4.6,0,22],
    // US
    ['c13','us','Swift Transportation','Bob Harris','+14801234567','bob@swifttrans.com','Phoenix','["Dry Van","Reefer"]',45,4.5,1,234],
    ['c14','us','Werner Enterprises','Karen White','+14022345678','karen@werner.com','Chicago','["Dry Van","Flatbed"]',38,4.6,1,189],
    ['c15','us','JB Hunt Transport','Tony Garcia','+14693456789','tony@jbhunt.com','Dallas','["Dry Van","Intermodal"]',52,4.7,1,312],
    ['c16','us','Old Dominion Freight','Lisa Chen','+19144567890','lisa@odfl.com','New York','["LTL","Dry Van"]',28,4.8,1,167],
  ];
  for (const c of carriers) insertCarrier.run(...c);

  // ── Shippers ──────────────────────────────────────────────────────────────
  const insertShipper = db.prepare(`
    INSERT OR IGNORE INTO shippers (id, market, name, contact, phone, email, location, total_loads, total_spend, industry)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const shippers = [
    // Kenya
    ['s1','kenya','Bamburi Cement','Peter Otieno','+254756789012','peter.otieno@bamburi.co.ke','Mombasa',23,4850000,'Construction'],
    ['s2','kenya','Kenya Breweries','Susan Kamau','+254767890123','susan.k@kbl.co.ke','Nairobi',41,8200000,'FMCG'],
    ['s3','kenya','Naivas Supermarkets','David Njoroge','+254778901234','d.njoroge@naivas.co.ke','Nairobi',67,12400000,'Retail'],
    ['s4','kenya','TotalEnergies Kenya','Fatuma Hassan','+254789012345','fatuma@totalenergies.co.ke','Mombasa',15,6750000,'Energy'],
    // India
    ['s5','india','Tata Steel','Rohit Kumar','+919876543210','rohit@tatasteel.com','Mumbai',87,45000000,'Manufacturing'],
    ['s6','india','Flipkart Logistics','Ananya Reddy','+918765432109','ananya@flipkart.com','Bangalore',156,78000000,'E-Commerce'],
    ['s7','india','Amul Dairy','Suresh Patel','+917654321098','suresh@amul.com','Ahmedabad',43,18000000,'FMCG'],
    ['s8','india','Reliance Retail','Meera Joshi','+916543210987','meera@relianceretail.com','Mumbai',112,62000000,'Retail'],
    // Canada
    ['s9','canada','Bombardier Manufacturing','Pierre Lachance','+15141234567','pierre@bombardier.ca','Montreal',28,1250000,'Manufacturing'],
    ['s10','canada','Canadian Tire','Amanda Wong','+14162345678','amanda@canadiantire.ca','Toronto',64,2800000,'Retail'],
    ['s11','canada','Tim Hortons Supply','Brian Osei','+14033456789','brian@timhortons.ca','Calgary',38,950000,'FMCG'],
    ['s12','canada','CN Rail Distribution','Chantal Dubois','+16044567890','chantal@cn.ca','Vancouver',19,3400000,'Logistics'],
    // US
    ['s13','us','Amazon Fulfillment','Jennifer Adams','+12061234567','jennifer@amazon.com','Seattle',420,18500000,'E-Commerce'],
    ['s14','us','Walmart Distribution','Carlos Rivera','+19722345678','carlos@walmart.com','Dallas',380,16200000,'Retail'],
    ['s15','us','Target Supply Chain','Amanda Foster','+16123456789','amanda@target.com','Chicago',195,8900000,'Retail'],
    ['s16','us','Home Depot','Robert Kim','+14044567890','robert@homedepot.com','Atlanta',143,7600000,'Home Improvement'],
  ];
  for (const s of shippers) insertShipper.run(...s);

  // ── Loads ─────────────────────────────────────────────────────────────────
  const insertLoad = db.prepare(`
    INSERT OR IGNORE INTO loads
    (id, market, origin, destination, commodity, weight, truck_type, freight_amount, commission,
     advance, status, shipper_id, carrier_id, shipper_contact, shipper_phone,
     pickup_date, delivery_date, special_instructions, cargo_insurance, commission_received, timeline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const d = (offset) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  const loads = [
    // ── Kenya loads ──────────────────────────────────────────
    ['FL-001','kenya','Mombasa','Nairobi','Steel Coils',25000,'Flatbed',180000,14400,90000,'Delivered',
     's1','c1','Peter Otieno','+254756789012',d(-3),d(-2),'Handle with care. Secure strapping required.',1,1,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-6)} 09:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-6)} 11:30`,done:true},
       {event:'Picked Up',time:`${d(-3)} 07:15`,done:true},
       {event:'In Transit',time:`${d(-3)} 08:00`,done:true},
       {event:'Delivered',time:`${d(-2)} 14:45`,done:true},
     ])],
    ['FL-002','kenya','Nairobi','Kisumu','Frozen Goods',8000,'Reefer',95000,7600,47500,'In Transit',
     's2','c2','Susan Kamau','+254767890123',d(0),d(0),'Maintain temp at -18°C throughout.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-2)} 14:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-2)} 16:00`,done:true},
       {event:'Picked Up',time:`${d(0)} 06:30`,done:true},
       {event:'In Transit',time:`${d(0)} 07:00`,done:true},
       {event:'Delivered',time:'',done:false},
     ])],
    ['FL-003','kenya','Nakuru','Mombasa','Grain',30000,'Dry Van',145000,11600,72500,'Booked',
     's3','c3','David Njoroge','+254778901234',d(1),d(2),'',0,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 10:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-1)} 12:00`,done:true},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['FL-004','kenya','Nairobi','Eldoret','Electronics',4500,'Dry Van',75000,6000,0,'Available',
     's2','','Susan Kamau','+254767890123',d(2),d(2),'Fragile. No stacking.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 15:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['FL-005','kenya','Mombasa','Nairobi','Chemicals',18000,'Tanker',220000,17600,0,'Available',
     's4','','Fatuma Hassan','+254789012345',d(3),d(4),'ADR certified driver required. Hazmat placards mandatory.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 16:30`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    // ── India loads ──────────────────────────────────────────
    ['IN-001','india','Mumbai','Delhi','Steel Coils',30000,'Flatbed',185000,14800,92500,'Delivered',
     's5','c5','Rohit Kumar','+919876543210',d(-4),d(-2),'Secure strapping required.',1,1,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-7)} 09:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-7)} 11:00`,done:true},
       {event:'Picked Up',time:`${d(-4)} 06:00`,done:true},
       {event:'In Transit',time:`${d(-4)} 07:00`,done:true},
       {event:'Delivered',time:`${d(-2)} 18:00`,done:true},
     ])],
    ['IN-002','india','Delhi','Bangalore','Electronics',5000,'LCV',145000,11600,72500,'In Transit',
     's6','c6','Ananya Reddy','+918765432109',d(0),d(2),'Fragile. Temperature controlled.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-3)} 10:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-3)} 12:00`,done:true},
       {event:'Picked Up',time:`${d(0)} 05:00`,done:true},
       {event:'In Transit',time:`${d(0)} 06:00`,done:true},
       {event:'Delivered',time:'',done:false},
     ])],
    ['IN-003','india','Ahmedabad','Mumbai','Dairy Products',12000,'Reefer',95000,7600,47500,'Booked',
     's7','c7','Suresh Patel','+917654321098',d(1),d(1),'Maintain cold chain -4°C.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 11:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-1)} 13:00`,done:true},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['IN-004','india','Pune','Chennai','Auto Parts',20000,'HCV',175000,14000,0,'Available',
     's8','','Meera Joshi','+916543210987',d(2),d(4),'',0,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(0)} 09:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['IN-005','india','Chennai','Hyderabad','Chemicals',18000,'Tanker',125000,10000,0,'Available',
     's5','','Rohit Kumar','+919876543210',d(3),d(3),'ADR required. e-Way Bill mandatory.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(0)} 14:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    // ── Canada loads ──────────────────────────────────────────
    ['CA-001','canada','Toronto','Montreal','Auto Parts',15000,'Dry Van',2800,224,1400,'Delivered',
     's9','c9','Pierre Lachance','+15141234567',d(-5),d(-4),'',0,1,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-8)} 09:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-8)} 10:00`,done:true},
       {event:'Picked Up',time:`${d(-5)} 07:00`,done:true},
       {event:'In Transit',time:`${d(-5)} 08:00`,done:true},
       {event:'Delivered',time:`${d(-4)} 16:00`,done:true},
     ])],
    ['CA-002','canada','Vancouver','Calgary','Lumber',25000,'Flatbed',3500,280,1750,'In Transit',
     's12','c10','Chantal Dubois','+16044567890',d(-1),d(1),'Oversized load — pilot car required.',0,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-3)} 08:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-3)} 10:00`,done:true},
       {event:'Picked Up',time:`${d(-1)} 06:00`,done:true},
       {event:'In Transit',time:`${d(-1)} 07:00`,done:true},
       {event:'Delivered',time:'',done:false},
     ])],
    ['CA-003','canada','Calgary','Edmonton','Oil Equipment',30000,'Lowboy',4200,336,0,'Booked',
     's11','c11','Brian Osei','+14033456789',d(1),d(1),'Wide load. Permit required.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 09:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-1)} 11:00`,done:true},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['CA-004','canada','Montreal','Toronto','Electronics',8000,'Reefer',2100,168,0,'Available',
     's10','','Amanda Wong','+14162345678',d(2),d(2),'Temperature sensitive.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(0)} 10:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    // ── US loads ──────────────────────────────────────────────
    ['US-001','us','Los Angeles','Chicago','Electronics',18000,'Dry Van',4200,336,2100,'Delivered',
     's13','c13','Jennifer Adams','+12061234567',d(-6),d(-4),'High value cargo. GPS tracking required.',1,1,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-9)} 09:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-9)} 11:00`,done:true},
       {event:'Picked Up',time:`${d(-6)} 06:00`,done:true},
       {event:'In Transit',time:`${d(-6)} 07:00`,done:true},
       {event:'Delivered',time:`${d(-4)} 15:00`,done:true},
     ])],
    ['US-002','us','New York','Miami','Frozen Goods',12000,'Reefer',3800,304,1900,'In Transit',
     's14','c14','Carlos Rivera','+19722345678',d(-1),d(1),'Maintain -18°C. Priority delivery.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-3)} 07:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-3)} 09:00`,done:true},
       {event:'Picked Up',time:`${d(-1)} 05:00`,done:true},
       {event:'In Transit',time:`${d(-1)} 06:00`,done:true},
       {event:'Delivered',time:'',done:false},
     ])],
    ['US-003','us','Dallas','Houston','Chemicals',20000,'Tanker',2500,200,1250,'Booked',
     's15','c15','Amanda Foster','+16123456789',d(1),d(1),'Hazmat Class 3. Placards required.',1,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(-1)} 10:00`,done:true},
       {event:'Carrier Assigned',time:`${d(-1)} 12:00`,done:true},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['US-004','us','Chicago','Detroit','Auto Parts',22000,'Flatbed',3100,248,0,'Available',
     's16','','Robert Kim','+14044567890',d(2),d(2),'',0,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(0)} 11:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
    ['US-005','us','Seattle','Denver','Machinery',28000,'Step Deck',5500,440,0,'Available',
     's13','','Jennifer Adams','+12061234567',d(3),d(4),'Oversize. Escort required.',0,0,
     JSON.stringify([
       {event:'Load Posted',time:`${d(0)} 14:00`,done:true},
       {event:'Carrier Assigned',time:'',done:false},
       {event:'Picked Up',time:'',done:false},
       {event:'In Transit',time:'',done:false},
       {event:'Delivered',time:'',done:false},
     ])],
  ];
  for (const l of loads) insertLoad.run(...l);
}

module.exports = { seedDatabase };
