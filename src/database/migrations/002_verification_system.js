export default {
  name: '002_verification_system',
  
  up(db) {
    console.log('🔄 Adding verification system columns...');
    
    db.prepare(`
      ALTER TABLE guilds ADD COLUMN verification_channel TEXT
    `).run();
    
    db.prepare(`
      ALTER TABLE guilds ADD COLUMN verification_role TEXT
    `).run();
    
    console.log('✅ Verification system columns added');
  }
};
