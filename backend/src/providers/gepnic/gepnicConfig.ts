export interface GepnicPortalConfig {
  sourceCode: string;
  sourceName: string;
  baseUrl: string;
  appPath?: string; // defaults to '/nicgep/app' or '/eprocure/app'
  region: 'Central' | 'State' | 'Union Territory';
  stateName: string;
}

export const GEPNIC_PORTALS: GepnicPortalConfig[] = [
  // --- Central Portals ---
  {
    sourceCode: 'CPPP',
    sourceName: 'Central Public Procurement Portal (CPPP / eProcure)',
    baseUrl: 'https://eprocure.gov.in',
    appPath: '/eprocure/app',
    region: 'Central',
    stateName: 'Delhi'
  },
  {
    sourceCode: 'DEFPROC',
    sourceName: 'Ministry of Defence eProcurement (MoD)',
    baseUrl: 'https://defproc.gov.in',
    appPath: '/nicgep/app',
    region: 'Central',
    stateName: 'Delhi'
  },

  // --- States (22 GePNIC States) ---
  {
    sourceCode: 'ARUNACHAL_TENDERS',
    sourceName: 'Government of Arunachal Pradesh e-Procurement',
    baseUrl: 'https://arunachaltenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Arunachal Pradesh'
  },
  {
    sourceCode: 'ASSAM_TENDERS',
    sourceName: 'Government of Assam e-Procurement',
    baseUrl: 'https://assamtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Assam'
  },
  {
    sourceCode: 'GOA_TENDERS',
    sourceName: 'Government of Goa e-Procurement',
    baseUrl: 'https://eprocure.goa.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Goa'
  },
  {
    sourceCode: 'HARYANA_TENDERS',
    sourceName: 'Government of Haryana e-Procurement',
    baseUrl: 'https://etenders.hry.nic.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Haryana'
  },
  {
    sourceCode: 'HP_TENDERS',
    sourceName: 'Government of Himachal Pradesh e-Procurement',
    baseUrl: 'https://hptenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Himachal Pradesh'
  },
  {
    sourceCode: 'JHARKHAND_TENDERS',
    sourceName: 'Government of Jharkhand e-Procurement',
    baseUrl: 'https://jharkhandtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Jharkhand'
  },
  {
    sourceCode: 'KERALA_TENDERS',
    sourceName: 'Government of Kerala e-Procurement',
    baseUrl: 'https://etenders.kerala.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Kerala'
  },
  {
    sourceCode: 'MP_TENDERS',
    sourceName: 'Government of Madhya Pradesh e-Procurement',
    baseUrl: 'https://mptenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Madhya Pradesh'
  },
  {
    sourceCode: 'MAHA_TENDERS',
    sourceName: 'Government of Maharashtra (MahaTenders)',
    baseUrl: 'https://mahatenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Maharashtra'
  },
  {
    sourceCode: 'MANIPUR_TENDERS',
    sourceName: 'Government of Manipur e-Procurement',
    baseUrl: 'https://manipurtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Manipur'
  },
  {
    sourceCode: 'MEGHALAYA_TENDERS',
    sourceName: 'Government of Meghalaya e-Procurement',
    baseUrl: 'https://meghalayatenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Meghalaya'
  },
  {
    sourceCode: 'MIZORAM_TENDERS',
    sourceName: 'Government of Mizoram e-Procurement',
    baseUrl: 'https://mizoramtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Mizoram'
  },
  {
    sourceCode: 'NAGALAND_TENDERS',
    sourceName: 'Government of Nagaland e-Procurement',
    baseUrl: 'https://nagalandtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Nagaland'
  },
  {
    sourceCode: 'ODISHA_TENDERS',
    sourceName: 'Government of Odisha e-Procurement',
    baseUrl: 'https://tendersodisha.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Odisha'
  },
  {
    sourceCode: 'PUNJAB_TENDERS',
    sourceName: 'Government of Punjab e-Procurement',
    baseUrl: 'https://eproc.punjab.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Punjab'
  },
  {
    sourceCode: 'RAJASTHAN_TENDERS',
    sourceName: 'Government of Rajasthan e-Procurement',
    baseUrl: 'https://eproc.rajasthan.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Rajasthan'
  },
  {
    sourceCode: 'SIKKIM_TENDERS',
    sourceName: 'Government of Sikkim e-Procurement',
    baseUrl: 'https://sikkimtender.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Sikkim'
  },
  {
    sourceCode: 'TN_TENDERS',
    sourceName: 'Government of Tamil Nadu e-Procurement',
    baseUrl: 'https://tntenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Tamil Nadu'
  },
  {
    sourceCode: 'TRIPURA_TENDERS',
    sourceName: 'Government of Tripura e-Procurement',
    baseUrl: 'https://tripuratenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Tripura'
  },
  {
    sourceCode: 'UP_TENDERS',
    sourceName: 'Government of Uttar Pradesh e-Procurement',
    baseUrl: 'https://etender.up.nic.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Uttar Pradesh'
  },
  {
    sourceCode: 'UK_TENDERS',
    sourceName: 'Government of Uttarakhand e-Procurement',
    baseUrl: 'https://uktenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'Uttarakhand'
  },
  {
    sourceCode: 'WB_TENDERS',
    sourceName: 'Government of West Bengal e-Procurement',
    baseUrl: 'https://wbtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'State',
    stateName: 'West Bengal'
  },

  // --- Union Territories (5 GePNIC UTs) ---
  {
    sourceCode: 'CHD_TENDERS',
    sourceName: 'Chandigarh UT Administration e-Procurement',
    baseUrl: 'https://etenders.chd.nic.in',
    appPath: '/nicgep/app',
    region: 'Union Territory',
    stateName: 'Chandigarh'
  },
  {
    sourceCode: 'DELHI_TENDERS',
    sourceName: 'Government of NCT of Delhi e-Procurement',
    baseUrl: 'https://govtprocurement.delhi.gov.in',
    appPath: '/nicgep/app',
    region: 'Union Territory',
    stateName: 'Delhi'
  },
  {
    sourceCode: 'JK_TENDERS',
    sourceName: 'Jammu & Kashmir UT e-Procurement',
    baseUrl: 'https://jktenders.gov.in',
    appPath: '/nicgep/app',
    region: 'Union Territory',
    stateName: 'Jammu and Kashmir'
  },
  {
    sourceCode: 'LADAKH_TENDERS',
    sourceName: 'UT Administration of Ladakh e-Procurement',
    baseUrl: 'https://ladakhtenders.gov.in',
    appPath: '/nicgep/app',
    region: 'Union Territory',
    stateName: 'Ladakh'
  },
  {
    sourceCode: 'PUDU_TENDERS',
    sourceName: 'Government of Puducherry (PuduTenders)',
    baseUrl: 'https://pudutenders.gov.in',
    appPath: '/nicgep/app',
    region: 'Union Territory',
    stateName: 'Puducherry'
  }
];
