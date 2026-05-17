const fs = require('fs');
const path = require('path');

const files = [
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/services/admin/accountService.ts',
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/services/admin/authService.ts',
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/services/admin/cloudinaryService.ts',
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/types/admin/account.ts',
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/types/admin/auth.ts',
    'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/types/admin/store.ts'
];

console.log('🗑️  Deleting old files...\n');
files.forEach(file => {
    try {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log('✓ Deleted: ' + path.basename(file));
        } else {
            console.log('⚠ File not found: ' + path.basename(file));
        }
    } catch (err) {
        console.log('✗ Error deleting ' + path.basename(file) + ': ' + err.message);
    }
});

console.log('\n✅ Verification of remaining files:\n');

// Check services/admin directory
const servicesPath = 'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/services/admin';
console.log('📁 Services/Admin Directory:');
try {
    const servicesFiles = fs.readdirSync(servicesPath).sort();
    if (servicesFiles.length === 0) {
        console.log('  (empty)');
    } else {
        servicesFiles.forEach(f => console.log('  ✓ ' + f));
    }
} catch (err) {
    console.log('  Error reading directory: ' + err.message);
}

// Check types/admin directory
const typesPath = 'd:/Html.css,js basic/js advance/mern/shopacclq/loginvip/frontend/src/types/admin';
console.log('\n📁 Types/Admin Directory:');
try {
    const typesFiles = fs.readdirSync(typesPath).sort();
    if (typesFiles.length === 0) {
        console.log('  (empty)');
    } else {
        typesFiles.forEach(f => console.log('  ✓ ' + f));
    }
} catch (err) {
    console.log('  Error reading directory: ' + err.message);
}
