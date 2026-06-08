const XLSX = require('xlsx');
const path = require('path');

// Mapping of non-matching values to XXX_OTHER format
const REPLACE_MAP = {
  'OS_OPENEULER': 'OS_OTHER',
  'SWITCH_DPTECH': 'SWITCH_OTHER',
  'SWITCH_EXTREME': 'SWITCH_OTHER',
  'OS_BIGCLOUD': 'OS_OTHER',
  'OTHER': 'OTHER_OTHER',
  'SWITCH_MYPOWER': 'SWITCH_OTHER',
  'OS_H3LINUX': 'OS_OTHER',
  'OS_H3C': 'OS_OTHER',
  'SWITCH_HAOHAN': 'SWITCH_OTHER'
};

// Valid enum values (all values that should be kept as-is)
const VALID_ENUMS = [
  'OS_WINDOWS', 'OS_LINUX', 'OS_AIX', 'OS_HPUX', 'OS_SOLARIS',
  'OS_EULER', 'OS_CENTOS', 'OS_NEWSTART', 'OS_DEBIAN', 'OS_ANOLIS',
  'OS_UBUNTU', 'OS_REDHAT', 'OS_SUSE',
  'DB_ORACLE', 'DB_MYSQL', 'DB_DB2', 'DB_SQLSERVER', 'DB_POSTGRESQL',
  'SWITCH_CISCO', 'SWITCH_H3C', 'SWITCH_HUAWEI', 'SWITCH_JUNIPER',
  'SWITCH_RUIJIE', 'SWITCH_ZTE', 'SWITCH_ALCATEL',
  'FIREWALL_HUAWEI', 'FIREWALL_DPTECH', 'FIREWALL_H3C',
  'FIREWALL_PALOALTO', 'FIREWALL_CHECKPOINT', 'FIREWALL_FORTIGATE',
  'SERVER_DELL', 'SERVER_HP', 'SERVER_LENVO', 'SERVER浪潮',
  'STORAGE EMC', 'STORAGE_NETAPP', 'STORAGE_HDS', 'OLB_ARRAY',
  'NETWORK_ROUTER', 'NETWORK_LOADBALANCER',
  'OTHER'
];

const filePath = path.join(__dirname, '..', '资产类型一致性排查报表 (1)(1).xlsx');
const outputPath = path.join(__dirname, '..', '资产类型一致性排查报表_已修正.xlsx');

console.log('Reading Excel file...');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(`Total rows: ${data.length}`);
console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);

// Find the column name for "实际设备类型"
const columns = Object.keys(data[0]);
const deviceTypeCol = columns.find(col => col.includes('实际设备类型') || col.includes('实际设备类型'));

if (!deviceTypeCol) {
  console.error('Could not find "实际设备类型" column');
  console.log('Available columns:', columns);
  process.exit(1);
}

console.log(`\nFound column: "${deviceTypeCol}"`);

// Get unique values
const uniqueValues = [...new Set(data.map(row => row[deviceTypeCol]).filter(v => v))];
console.log(`\nUnique values in "${deviceTypeCol}" (${uniqueValues.length}):`);
uniqueValues.forEach(v => console.log(`  - ${v}`));

// Count replacements needed
let replaceCount = 0;
const replacements = {};

data.forEach(row => {
  const oldValue = row[deviceTypeCol];
  if (oldValue && REPLACE_MAP[oldValue]) {
    replaceCount++;
    if (!replacements[oldValue]) {
      replacements[oldValue] = 0;
    }
    replacements[oldValue]++;
  }
});

console.log(`\nReplacements needed: ${replaceCount}`);
Object.entries(replacements).forEach(([old, count]) => {
  console.log(`  ${old} → ${REPLACE_MAP[old]} (${count} rows)`);
});

// Apply replacements - add new column to the right
const newColName = '实际设备类型(修正后)';
const colIndex = columns.indexOf(deviceTypeCol);

// Insert new column data
data.forEach(row => {
  const oldValue = row[deviceTypeCol];
  if (oldValue && REPLACE_MAP[oldValue]) {
    row[newColName] = REPLACE_MAP[oldValue];
  } else {
    row[newColName] = oldValue; // Keep original value if no replacement needed
  }
});

// Reorder columns: insert new column right after 实际设备类型
const newColumns = [...columns];
newColumns.splice(colIndex + 1, 0, newColName);

// Write updated Excel with proper column order
const newSheet = XLSX.utils.json_to_sheet(data, { header: newColumns });
workbook.Sheets[sheetName] = newSheet;
XLSX.writeFile(workbook, outputPath);

console.log(`\n✓ Updated Excel saved to: ${outputPath}`);

// Verify changes
const verifyData = XLSX.utils.sheet_to_json(newSheet);
const newUniqueValues = [...new Set(verifyData.map(row => row[deviceTypeCol]).filter(v => v))];
console.log(`\nVerification - Unique values after replacement (${newUniqueValues.length}):`);
newUniqueValues.forEach(v => console.log(`  - ${v}`));

const stillInvalid = newUniqueValues.filter(v => !VALID_ENUMS.includes(v));
if (stillInvalid.length > 0) {
  console.log(`\n⚠ Values still not in enum (${stillInvalid.length}):`);
  stillInvalid.forEach(v => console.log(`  - ${v}`));
} else {
  console.log('\n✓ All values are now in the enum list!');
}
