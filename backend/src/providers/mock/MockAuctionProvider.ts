import {
  AuctionDataProvider,
  RawAuction,
  RawAuctionDetail,
  FetchAuctionParams,
  ProviderHealth
} from '../../types/provider';

interface SeedTemplate {
  title: string;
  category: string;
  org: string;
  dept: string;
  state: string;
  district: string;
  city: string;
  address: string;
  price: number;
  emdRatio: number;
  increment: number;
  hoursOffsetStart: number;
  hoursDuration: number;
  items: Array<{ name: string; qty: number; unit: string; condition: string; desc: string }>;
  docs: Array<{ name: string; type: string }>;
  desc: string;
  sourceCode: 'GEM' | 'MSTC' | 'BANK' | 'PSU';
}

export class MockAuctionProvider implements AuctionDataProvider {
  public readonly sourceCode = 'MOCK';
  public readonly sourceName = 'Mock Multi-Portal Auction Provider';
  public readonly baseUrl = 'https://mock-auction-feed.internal';

  private mockAuctions: RawAuctionDetail[] = [];
  private lastSyncTime: Date | null = null;

  constructor() {
    this.generateDataset();
  }

  private generateDataset(): void {
    const now = new Date();
    const templates: SeedTemplate[] = [
      // 1. Vehicles
      {
        title: 'Auction of Condemned Government Light Commercial Vehicles & SUVs',
        category: 'Vehicles & Automotive',
        org: 'Directorate of Health Services',
        dept: 'Transport & Logistics Wing',
        state: 'Chhattisgarh',
        district: 'Raipur',
        city: 'Raipur',
        address: 'Central Medical Store Complex, VIP Road',
        price: 320000,
        emdRatio: 0.1,
        increment: 5000,
        hoursOffsetStart: -24,
        hoursDuration: 48,
        items: [
          { name: 'Maruti Suzuki Gypsy 4x4 (2014)', qty: 2, unit: 'Nos', condition: 'Used / As Is Where Is', desc: 'Running condition with minor mechanical repairs required' },
          { name: 'Mahindra Bolero Ambulance (2016)', qty: 3, unit: 'Nos', condition: 'Used', desc: 'Disposed emergency ambulances, engine intact' }
        ],
        docs: [
          { name: 'Vehicle_Inspection_Report.pdf', type: 'INSPECTION' },
          { name: 'Tender_Terms_Schedule.pdf', type: 'TENDER_NOTICE' }
        ],
        desc: 'Public e-auction for disposal of 5 condemned government vehicles stationed at Raipur central warehouse depot.',
        sourceCode: 'GEM'
      },
      {
        title: 'Disposal of 12 Operational State Transport AC Buses (Ashok Leyland)',
        category: 'Vehicles & Automotive',
        org: 'Maharashtra State Road Transport Corp',
        dept: 'Mechanical Engineering Division',
        state: 'Maharashtra',
        district: 'Pune',
        city: 'Pune',
        address: 'Central Bus Workshop, Swargate Depot',
        price: 4800000,
        emdRatio: 0.05,
        increment: 25000,
        hoursOffsetStart: -2,
        hoursDuration: 18, // Ending soon!
        items: [
          { name: 'Ashok Leyland Viking BS-IV AC Passenger Bus', qty: 8, unit: 'Nos', condition: 'Running / Roadworthy', desc: 'Completed standard 7 lakh km route life' },
          { name: 'Tata Marcopolo Semi-Deluxe Bus', qty: 4, unit: 'Nos', condition: 'Used', desc: 'Engine running, body structural refurbishment recommended' }
        ],
        docs: [
          { name: 'MSRTC_Bus_Catalog_2026.pdf', type: 'CATALOG' },
          { name: 'General_Auction_Rules.pdf', type: 'TERMS_CONDITIONS' }
        ],
        desc: 'Forward e-auction for 12 decommissioned intercity transport buses in serviceable operating condition.',
        sourceCode: 'GEM'
      },
      {
        title: 'Sale of Vintage Executive Staff Sedans (Honda City & Toyota Altis)',
        category: 'Vehicles & Automotive',
        org: 'Reserve Bank of India',
        dept: 'Protocol & Vehicle Cell',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'New Delhi',
        address: 'RBI Staff Enclave, Barakhamba Road',
        price: 850000,
        emdRatio: 0.1,
        increment: 10000,
        hoursOffsetStart: 12,
        hoursDuration: 72, // Upcoming
        items: [
          { name: 'Toyota Corolla Altis 1.8G (2017)', qty: 2, unit: 'Nos', condition: 'Excellent / Maintained', desc: 'VIP staff pool vehicle, complete service history available' },
          { name: 'Honda City V MT Petrol (2018)', qty: 2, unit: 'Nos', condition: 'Good', desc: 'Company maintained, single officer driven' }
        ],
        docs: [
          { name: 'Logbook_Extracts_Valuation.pdf', type: 'VALUATION' }
        ],
        desc: 'Official forward auction of executive sedans retired from official protocol pool.',
        sourceCode: 'BANK'
      },
      // 2. Scrap & Metals
      {
        title: 'Auction of High-Grade Ferrous Heavy Melting Scrap (HMS 1 & 2)',
        category: 'Ferrous & Non-Ferrous Scrap',
        org: 'Steel Authority of India Limited (SAIL)',
        dept: 'Bhilai Steel Plant Materials Management',
        state: 'Chhattisgarh',
        district: 'Durg',
        city: 'Bhilai',
        address: 'Bhilai Steel Plant Yard No. 4',
        price: 18500000,
        emdRatio: 0.08,
        increment: 50000,
        hoursOffsetStart: -48,
        hoursDuration: 72,
        items: [
          { name: 'Heavy Melting Steel Scrap (HMS 1/2)', qty: 500, unit: 'MT', condition: 'Scrap', desc: 'Processed heavy structural steel cut pieces' },
          { name: 'Cast Iron Roll Scrap & Mould Pieces', qty: 150, unit: 'MT', condition: 'Scrap', desc: 'High carbon foundry iron scrap' }
        ],
        docs: [
          { name: 'SAIL_Bhilai_Scrap_Catalogue.pdf', type: 'CATALOG' },
          { name: 'Hazardous_Waste_Declaration.pdf', type: 'DECLARATION' }
        ],
        desc: 'Bulk forward e-auction for industrial grade scrap metal generated during rolling mill maintenance.',
        sourceCode: 'MSTC'
      },
      {
        title: 'Disposal of Copper & Aluminium Scrap Conductor Wire Lots',
        category: 'Ferrous & Non-Ferrous Scrap',
        org: 'Gujarat Energy Transmission Corp (GETCO)',
        dept: 'Stores & Inventory Dept',
        state: 'Gujarat',
        district: 'Vadodara',
        city: 'Vadodara',
        address: 'GETCO Central Store Yard, Makarpura GIDC',
        price: 6400000,
        emdRatio: 0.1,
        increment: 20000,
        hoursOffsetStart: -10,
        hoursDuration: 14, // Ending soon
        items: [
          { name: 'Electrolytic Copper Busbar Scrap', qty: 12, unit: 'MT', condition: 'Clean Scrap', desc: 'Pure non-alloyed copper conductors' },
          { name: 'ACSR Aluminium Conductor Wire Reels', qty: 35, unit: 'MT', condition: 'Scrap', desc: 'High tensile core de-wired aluminium' }
        ],
        docs: [
          { name: 'Assay_Purity_Report.pdf', type: 'INSPECTION' }
        ],
        desc: 'Public auction for transmission line non-ferrous scrap wires and decommissioned transformer windings.',
        sourceCode: 'GEM'
      },
      // 3. Machinery & Equipment
      {
        title: 'Auction of Heavy CNC Lathes, Milling Centres & Hydraulic Presses',
        category: 'Industrial Machinery',
        org: 'Bharat Heavy Electricals Limited (BHEL)',
        dept: 'Plant Maintenance & Asset Disposal',
        state: 'Madhya Pradesh',
        district: 'Bhopal',
        city: 'Bhopal',
        address: 'BHEL Industrial Complex, Piplani',
        price: 9200000,
        emdRatio: 0.1,
        increment: 50000,
        hoursOffsetStart: -30,
        hoursDuration: 60,
        items: [
          { name: 'HMT CNC Heavy Duty Lathe 5000mm Bed', qty: 2, unit: 'Nos', condition: 'Used / Functional', desc: 'Heavy duty turning lathe with Fanuc controller' },
          { name: 'BFW 4-Axis Vertical Machining Centre', qty: 1, unit: 'Nos', condition: 'Operational', desc: 'Tool changer operational, spindle runout tested' },
          { name: '100 Ton Hydraulic Deep Drawing Press', qty: 1, unit: 'Nos', condition: 'Used', desc: 'Complete with hydraulic powerpack unit' }
        ],
        docs: [
          { name: 'Machine_Technical_Specs.pdf', type: 'SPECIFICATIONS' },
          { name: 'BHEL_Asset_Disposal_Rules.pdf', type: 'TERMS_CONDITIONS' }
        ],
        desc: 'E-auction of precision industrial machinery and manufacturing equipment decommissioned during modern factory automation.',
        sourceCode: 'MSTC'
      },
      {
        title: 'Disposal of 1500 kVA Soundproof Diesel Generator Sets (Cummins)',
        category: 'Plant & Equipment',
        org: 'Airport Authority of India (AAI)',
        dept: 'Engineering & Electrical Division',
        state: 'Karnataka',
        district: 'Bengaluru',
        city: 'Bengaluru',
        address: 'HAL Airport Facility, Old Airport Road',
        price: 3600000,
        emdRatio: 0.08,
        increment: 20000,
        hoursOffsetStart: 24,
        hoursDuration: 96, // Upcoming
        items: [
          { name: 'Cummins 1500 kVA Silent DG Set (Water Cooled)', qty: 2, unit: 'Nos', condition: 'Used / Standby', desc: 'Total run hours 3200 hrs, equipped with AMF panel' },
          { name: 'Kirloskar 500 kVA Soundproof Generator', qty: 1, unit: 'Nos', condition: 'Operational', desc: 'Used for backup terminal lighting' }
        ],
        docs: [
          { name: 'DG_Set_Maintenance_Log.pdf', type: 'LOGBOOK' }
        ],
        desc: 'Standby backup power generation sets replaced under green solar integration upgrade.',
        sourceCode: 'GEM'
      },
      // 4. IT & Electronics
      {
        title: 'Bulk Forward Auction of Server Racks, Workstations & Core Switches',
        category: 'IT & Electronics Equipment',
        org: 'National Informatics Centre (NIC)',
        dept: 'Data Centre Asset Management',
        state: 'Delhi',
        district: 'South Delhi',
        city: 'New Delhi',
        address: 'NIC Data Centre, CGO Complex, Lodhi Road',
        price: 1450000,
        emdRatio: 0.1,
        increment: 10000,
        hoursOffsetStart: -12,
        hoursDuration: 36,
        items: [
          { name: 'Dell PowerEdge R740 Rackmount Servers (Dual Xeon)', qty: 25, unit: 'Nos', condition: 'Decommissioned / Tested', desc: 'Drives securely wiped under ISO 27001 sanitization certificate' },
          { name: 'Cisco Catalyst 3850 48-Port PoE Switches', qty: 18, unit: 'Nos', condition: 'Used', desc: 'Tested working with redundant power supplies' },
          { name: 'HP Z440 Professional Graphics Workstations', qty: 30, unit: 'Nos', condition: 'Good', desc: 'Intel Xeon 32GB RAM Nvidia Quadro' }
        ],
        docs: [
          { name: 'Data_Sanitization_Certificate.pdf', type: 'CERTIFICATION' },
          { name: 'Asset_Serial_Inventory.pdf', type: 'CATALOG' }
        ],
        desc: 'Bulk disposal of IT data center hardware replaced during cloud infrastructure upgrade.',
        sourceCode: 'GEM'
      },
      {
        title: 'Auction of 1200+ Core i5 Desktop PCs, Monoblocks & Laser Printers',
        category: 'IT & Electronics Equipment',
        org: 'State Bank of India',
        dept: 'IT Procurement & Asset Lifecycle',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Mumbai',
        address: 'SBI LHO Bhavan, Bandra Kurla Complex',
        price: 4200000,
        emdRatio: 0.1,
        increment: 25000,
        hoursOffsetStart: -6,
        hoursDuration: 10, // Ending in 4 hours
        items: [
          { name: 'HP ProDesk 400 G6 Core i5 8th Gen 8GB 256GB SSD', qty: 850, unit: 'Nos', condition: 'Used / Working', desc: 'Complete desktop with keyboard and mouse' },
          { name: 'Dell 22-inch Full HD LED Monitors', qty: 850, unit: 'Nos', condition: 'Good', desc: 'IPS panels, scratch-free screens' },
          { name: 'Canon ImageClass Multi-Function Laser Printers', qty: 120, unit: 'Nos', condition: 'As Is', desc: 'Heavy branch printing units' }
        ],
        docs: [
          { name: 'SBI_IT_Disposal_Guidelines.pdf', type: 'TERMS_CONDITIONS' }
        ],
        desc: 'Large lot IT hardware forward auction from banking operations branch refresh cycle.',
        sourceCode: 'BANK'
      },
      // 5. Property & Commercial Assets
      {
        title: 'E-Auction of Prime Commercial Office Spaces in Cyber Hub Area',
        category: 'Commercial & Residential Property',
        org: 'Haryana Urban Development Authority (HSVP)',
        dept: 'Commercial Land & Estate Cell',
        state: 'Haryana',
        district: 'Gurugram',
        city: 'Gurugram',
        address: 'Sector 29 Commercial Enclave, Near Metro Station',
        price: 45000000,
        emdRatio: 0.05,
        increment: 100000,
        hoursOffsetStart: 48,
        hoursDuration: 120, // Upcoming
        items: [
          { name: 'Commercial Built-up Office Floor (Unit 401 & 402)', qty: 4500, unit: 'SqFt', condition: 'Ready to Occupy', desc: 'Grade A building, 100% power backup and 8 dedicated parking slots' }
        ],
        docs: [
          { name: 'HSVP_Approved_Site_Plan.pdf', type: 'SITE_PLAN' },
          { name: 'Title_Search_Encumbrance_Certificate.pdf', type: 'LEGAL' }
        ],
        desc: 'Public commercial real estate auction by urban development authority with freehold title.',
        sourceCode: 'PSU'
      },
      {
        title: 'Auction of Industrial Factory Shed with 2-Acre Freehold Land Parcel',
        category: 'Commercial & Residential Property',
        org: 'Chhattisgarh State Industrial Development Corp (CSIDC)',
        dept: 'Land Allotment & Infrastructure',
        state: 'Chhattisgarh',
        district: 'Raipur',
        city: 'Tilda',
        address: 'Industrial Growth Centre, Phase II, Tilda-Neora',
        price: 28500000,
        emdRatio: 0.05,
        increment: 50000,
        hoursOffsetStart: -20,
        hoursDuration: 50,
        items: [
          { name: 'Industrial Land with Heavy Pre-Engineered Steel Shed', qty: 2.1, unit: 'Acres', condition: 'Clear Title', desc: 'Equipped with 33kV high tension power connection and internal asphalt roads' }
        ],
        docs: [
          { name: 'CSIDC_Allotment_ByeLaws.pdf', type: 'LEGAL' },
          { name: 'Demarcation_Boundary_Map.pdf', type: 'MAP' }
        ],
        desc: 'Re-auction of surrendered industrial property lot with complete boundary wall and factory shed.',
        sourceCode: 'GEM'
      },
      // 6. Mining & Earthmoving
      {
        title: 'Disposal of Heavy Hydraulic Excavators, Bulldozers & Dumpers',
        category: 'Mining & Heavy Earthmoving',
        org: 'South Eastern Coalfields Limited (SECL)',
        dept: 'Heavy Earth Moving Machinery (HEMM) Division',
        state: 'Chhattisgarh',
        district: 'Korba',
        city: 'Korba',
        address: 'Gevra Open Cast Mine Workshop Area',
        price: 14200000,
        emdRatio: 0.08,
        increment: 50000,
        hoursOffsetStart: -5,
        hoursDuration: 8, // Ending in 3 hours
        items: [
          { name: 'Komatsu PC1250 Heavy Hydraulic Excavator (6.5 CuM)', qty: 1, unit: 'Nos', condition: 'Used / Decommissioned', desc: 'Heavy open-cast mining excavator, engine dismantled for inspection' },
          { name: 'BEML D355 Crawler Bulldozer 410 HP', qty: 2, unit: 'Nos', condition: 'Used', desc: 'Ripper attachment included, undercarriage intact' },
          { name: 'Caterpillar 777D 100-Ton Off-Highway Haul Dumper', qty: 2, unit: 'Nos', condition: 'As Is', desc: 'Hydraulic hoist system operational' }
        ],
        docs: [
          { name: 'SECL_HEMM_Inspection_Dossier.pdf', type: 'INSPECTION' },
          { name: 'Safety_Mine_Clearance.pdf', type: 'CLEARANCE' }
        ],
        desc: 'Forward auction of heavy mining machinery retired after scheduled life hours in Gevra project.',
        sourceCode: 'MSTC'
      },
      // 7. Furniture & Fixtures
      {
        title: 'Auction of Executive Teakwood Desks, Ergonomic Chairs & Conference Sets',
        category: 'Office Furniture & Fixtures',
        org: 'High Court of Bombay',
        dept: 'General Administration & Building Works',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Mumbai',
        address: 'High Court Building, Fort Area',
        price: 450000,
        emdRatio: 0.1,
        increment: 5000,
        hoursOffsetStart: -18,
        hoursDuration: 42,
        items: [
          { name: 'Solid Burma Teakwood Judicial Desks & Armchairs', qty: 45, unit: 'Sets', condition: 'Vintage / Sturdy', desc: 'Classic seasoned hardwood furniture with brass handles' },
          { name: 'Featherlite High-Back Ergonomic Mesh Chairs', qty: 120, unit: 'Nos', condition: 'Good', desc: 'Synchro-tilt mechanism, hydraulic lift in working order' },
          { name: 'Modular 20-Seater Oval Conference Table with Power Popups', qty: 2, unit: 'Nos', condition: 'Excellent', desc: 'Walnut laminate finish with internal cable management' }
        ],
        docs: [
          { name: 'Furniture_Lot_Inventory.pdf', type: 'CATALOG' }
        ],
        desc: 'Disposal of court administration office furnishings replaced during heritage building renovation.',
        sourceCode: 'GEM'
      },
      // 8. General Surplus & Laboratory
      {
        title: 'Auction of Medical Diagnostic Equipment (MRI, CT Scanner & X-Ray Units)',
        category: 'General Surplus & Misc',
        org: 'All India Institute of Medical Sciences (AIIMS)',
        dept: 'Biomedical Engineering Department',
        state: 'Delhi',
        district: 'South Delhi',
        city: 'New Delhi',
        address: 'AIIMS Main Hospital Complex, Ansari Nagar',
        price: 8800000,
        emdRatio: 0.1,
        increment: 25000,
        hoursOffsetStart: -4,
        hoursDuration: 6, // Ending in 2 hours
        items: [
          { name: 'Siemens Magnetom 1.5T MRI Scanner System', qty: 1, unit: 'System', condition: 'Decommissioned', desc: 'Chiller unit and RF shielding cage included, helium quenched safely' },
          { name: 'GE Optima 64-Slice CT Scanner', qty: 1, unit: 'System', condition: 'Used / As Is', desc: 'X-Ray tube count logged, console and gantry intact' },
          { name: 'Philips Mobile Digital C-Arm X-Ray Machine', qty: 3, unit: 'Nos', condition: 'Used', desc: 'Standard operating room fluoroscopy unit' }
        ],
        docs: [
          { name: 'AERB_Decommissioning_Certificate.pdf', type: 'SAFETY' },
          { name: 'Biomedical_Inspection_Checklist.pdf', type: 'INSPECTION' }
        ],
        desc: 'Public e-auction for AERB-cleared medical imaging diagnostic equipment.',
        sourceCode: 'GEM'
      }
    ];

    // Generate 55+ realistic auctions by multiplying and varying templates across states, numbers, and dates
    const variations: RawAuctionDetail[] = [];
    let count = 10001;

    const extraStates = [
      { state: 'Tamil Nadu', city: 'Chennai', district: 'Chennai' },
      { state: 'Karnataka', city: 'Mysuru', district: 'Mysuru' },
      { state: 'Uttar Pradesh', city: 'Lucknow', district: 'Lucknow' },
      { state: 'West Bengal', city: 'Kolkata', district: 'Kolkata' },
      { state: 'Rajasthan', city: 'Jaipur', district: 'Jaipur' },
      { state: 'Telangana', city: 'Hyderabad', district: 'Hyderabad' },
      { state: 'Odisha', city: 'Bhubaneswar', district: 'Khordha' },
      { state: 'Punjab', city: 'Ludhiana', district: 'Ludhiana' }
    ];

    for (let cycle = 0; cycle < 5; cycle++) {
      for (const t of templates) {
        const extId =
          t.sourceCode === 'GEM'
            ? `GEM/FA/2026/${count}`
            : t.sourceCode === 'MSTC'
            ? `MSTC/NRO/2026/${count}`
            : t.sourceCode === 'BANK'
            ? `BANK/EA/2026/${count}`
            : `PSU/AUCT/2026/${count}`;

        const locOverride = cycle > 0 ? extraStates[(count + cycle) % extraStates.length] : { state: t.state, city: t.city, district: t.district };
        const priceVariance = 1 + (cycle * 0.15 - 0.1);
        const calcPrice = Math.round((t.price * priceVariance) / 1000) * 1000;

        // Shift timestamps realistically:
        // cycle 0: mix of live, ending soon, upcoming
        // cycle 1: live
        // cycle 2: ending soon (1-4 hours left)
        // cycle 3: upcoming (1-5 days future)
        // cycle 4: closed (ended 1-3 days ago)
        let startTime: Date;
        let endTime: Date;

        if (cycle === 0) {
          startTime = new Date(now.getTime() + t.hoursOffsetStart * 3600000);
          endTime = new Date(startTime.getTime() + t.hoursDuration * 3600000);
        } else if (cycle === 1) {
          // Live (active with plenty of time)
          startTime = new Date(now.getTime() - 24 * 3600000);
          endTime = new Date(now.getTime() + 48 * 3600000);
        } else if (cycle === 2) {
          // Ending soon (1-8 hours remaining)
          const remainingHours = (count % 7) + 1;
          startTime = new Date(now.getTime() - 24 * 3600000);
          endTime = new Date(now.getTime() + remainingHours * 3600000);
        } else if (cycle === 3) {
          // Upcoming (starts in 12h to 72h)
          const startInHours = (count % 48) + 12;
          startTime = new Date(now.getTime() + startInHours * 3600000);
          endTime = new Date(startTime.getTime() + 72 * 3600000);
        } else {
          // Closed (ended 12h to 48h ago)
          endTime = new Date(now.getTime() - ((count % 36) + 12) * 3600000);
          startTime = new Date(endTime.getTime() - 48 * 3600000);
        }

        const rawAuction: RawAuctionDetail = {
          externalId: extId,
          title: `${t.title} [Lot #${count}]`,
          description: t.desc,
          categoryName: t.category,
          sourceStatus: 'ACTIVE',
          organization: {
            name: `${t.org}${cycle > 0 ? ` (Regional Office ${locOverride.city})` : ''}`,
            department: t.dept,
            externalId: `ORG-${count}`
          },
          location: {
            country: 'India',
            state: locOverride.state,
            district: locOverride.district,
            city: locOverride.city,
            address: t.address
          },
          startPrice: calcPrice,
          emdAmount: Math.round(calcPrice * t.emdRatio),
          bidIncrement: t.increment,
          startTime,
          endTime,
          officialUrl:
            t.sourceCode === 'GEM'
              ? `https://forwardauction.gem.gov.in/eprocure/home/auction-details?id=${encodeURIComponent(extId)}`
              : t.sourceCode === 'MSTC'
              ? `https://www.mstcecommerce.com/auctionhome/auction_detail.jsp?id=${encodeURIComponent(extId)}`
              : `https://eauction.gov.in/eprocure/app?page=FrontEndAuctionDetails&service=page&auctionId=${encodeURIComponent(extId)}`,
          items: t.items.map((it, idx) => ({
            name: `${it.name} - Item ${idx + 1}`,
            description: it.desc,
            quantity: it.qty,
            unit: it.unit,
            condition: it.condition,
            estimatedValue: Math.round(calcPrice / t.items.length)
          })),
          documents: t.docs.map((d) => ({
            name: d.name,
            documentType: d.type,
            url: `https://documents.auctionlens.internal/${extId.replace(/\//g, '_')}/${d.name}`
          })),
          rawData: {
            sourcePlatform: t.sourceCode,
            portalAuctionId: extId,
            publishedDate: startTime.toISOString(),
            closingDate: endTime.toISOString(),
            isMockGenerated: true,
            inspectionAllowed: true,
            emdExemptionAvailable: false,
            bidCurrency: 'INR'
          },
          termsConditions: '1. As is where is basis. 2. Full payment within 7 working days of award. 3. Lifting within 15 days.',
          contactPerson: 'Superintending Stores Officer',
          contactPhone: '+91-11-23456789',
          contactEmail: 'disposal.cell@nic.in'
        };

        variations.push(rawAuction);
        count++;
      }
    }

    this.mockAuctions = variations;
    this.lastSyncTime = new Date();
  }

  public async fetchAuctions(params?: FetchAuctionParams): Promise<RawAuction[]> {
    // Return all mock auctions with optional keyword/category/state filter applied
    let list = [...this.mockAuctions];

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.externalId.toLowerCase().includes(q) ||
          (a.organization?.name && a.organization.name.toLowerCase().includes(q)) ||
          (a.location?.state && a.location.state.toLowerCase().includes(q))
      );
    }

    if (params?.category) {
      list = list.filter((a) => a.categoryName?.toLowerCase().includes(params.category!.toLowerCase()));
    }

    if (params?.state) {
      list = list.filter((a) => a.location?.state?.toLowerCase() === params.state!.toLowerCase());
    }

    this.lastSyncTime = new Date();
    return list;
  }

  public async fetchAuctionDetails(externalId: string): Promise<RawAuctionDetail | null> {
    const found = this.mockAuctions.find((a) => a.externalId === externalId);
    return found || null;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      source: this.sourceCode,
      healthy: true,
      lastSuccessfulSync: this.lastSyncTime ? this.lastSyncTime.toISOString() : new Date().toISOString(),
      responseTimeMs: 12,
      message: `Mock provider active with ${this.mockAuctions.length} pre-generated realistic multi-portal auctions.`,
      details: {
        totalAuctions: this.mockAuctions.length,
        version: '1.0.0-mock'
      }
    };
  }
}
