const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(__dirname, filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const rep of replacements) {
    content = content.replace(rep.search, rep.replace);
  }
  fs.writeFileSync(fullPath, content);
}

replaceInFile('src/communities/communities.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\(\)/, replace: "@ApiBody({ schema: { type: 'object', example: { name: 'My Community', type: 'Arisan', description: 'Deskripsi', themeColor: '#FFFFFF', requiresApproval: false } } })\n  @Post()" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\(':id\/members'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { userId: '123', role: 'member' } } })\n  @Post(':id/members')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Patch\(':id\/members\/:mid'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { role: 'admin', status: 'active' } } })\n  @Patch(':id/members/:mid')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Patch\(':id'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { name: 'Updated Name', description: 'Updated Description', themeColor: '#000000', rules: 'No spam', requiresApproval: true } } })\n  @Patch(':id')" }
]);

replaceInFile('src/pockets/pockets.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\('communities\/:communityId\/pockets'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { name: 'Liburan', targetAmount: 1000000, targetDate: '2026-12-31' } } })\n  @Post('communities/:communityId/pockets')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\('pockets\/:id\/transactions'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { amount: 50000, type: 'in', description: 'Nabung' } } })\n  @Post('pockets/:id/transactions')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\('pockets\/:id\/withdraw'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { amount: 100000, note: 'Tarik dana', bankName: 'BCA', accountNumber: '123456', accountHolder: 'Fadel' } } })\n  @Post('pockets/:id/withdraw')" }
]);

replaceInFile('src/contributions/contributions.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\('communities\/:communityId\/dues'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { title: 'Uang Kas', amount: 50000, dueDate: '2026-07-10', frequency: 'monthly', isMandatory: true } } })\n  @Post('communities/:communityId/dues')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Patch\('dues\/:id'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { title: 'Uang Kas Revisi', amount: 75000 } } })\n  @Patch('dues/:id')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ proofUrl: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { proofUrl: 'https://example.com/receipt.jpg' } } })" }
]);

replaceInFile('src/forum/forum.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ body: \{ type: 'string' \}, isAnnouncement: \{ type: 'boolean' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { body: 'Halo semua!', isAnnouncement: false } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ body: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { body: 'Komentar saya' } } })" }
]);

replaceInFile('src/events/events.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\("communities\/:communityId\/events"\)/, replace: "@ApiBody({ schema: { type: 'object', example: { title: 'Kopdar Rutin', description: 'Kumpul bulanan', date: '2026-08-01T10:00:00Z', location: 'Cafe A', isOnline: false } } })\n  @Post(\"communities/:communityId/events\")" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Patch\("events\/:id"\)/, replace: "@ApiBody({ schema: { type: 'object', example: { title: 'Kopdar Rutin (Updated)', location: 'Cafe B' } } })\n  @Patch(\"events/:id\")" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ status: \{ type: 'string', enum: \['going', 'not_going', 'maybe'\] \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { status: 'going' } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ action: \{ type: 'string', enum: \['accepted', 'rejected'\] \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { action: 'accepted' } } })" }
]);

replaceInFile('src/wallet/wallet.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ amount: \{ type: 'number' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { amount: 100000 } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ amount: \{ type: 'number' \}, bankName: \{ type: 'string' \}, accountNumber: \{ type: 'string' \}, accountHolder: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { amount: 50000, bankName: 'BCA', accountNumber: '1234567890', accountHolder: 'Fadel' } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object' \} \}\)\s+@Post\('webhook\/nobu'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { transactionId: 'txn_123', status: 'success' } } })\n  @Post('webhook/nobu')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ action: \{ type: 'string', enum: \['approved', 'rejected'\] \}, note: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { action: 'approved', note: 'Oke' } } })" }
]);

replaceInFile('src/auth/auth.controller.ts', [
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ email: \{ type: 'string' \}, otp: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { email: 'test@example.com', otp: '123456' } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ idToken: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { idToken: 'eyJhbGciOiJSUzI...' } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ name: \{ type: 'string' \}, avatarUrl: \{ type: 'string' \} \} \} \}\)/, replace: "@ApiBody({ schema: { type: 'object', example: { name: 'John Doe', avatarUrl: 'https://example.com/avatar.jpg' } } })" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ pin: \{ type: 'string' \} \} \} \}\)\s+@Post\('setup-pin'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { pin: '123456' } } })\n  @Post('setup-pin')" },
  { search: /@ApiBody\(\{ schema: \{ type: 'object', properties: \{ pin: \{ type: 'string' \} \} \} \}\)\s+@Post\('verify-pin'\)/, replace: "@ApiBody({ schema: { type: 'object', example: { pin: '123456' } } })\n  @Post('verify-pin')" }
]);

console.log('Done!');
