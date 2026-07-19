require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const SALT_ROUNDS = 10;

async function migratePasswords() {
  console.log('开始迁移密码到 bcrypt 哈希...');

  try {
    const [admins] = await pool.query('SELECT admin_id, admin_name, pwd FROM admin');
    console.log(`找到 ${admins.length} 个管理员账户`);

    for (const admin of admins) {
      if (admin.pwd && admin.pwd.length < 40) {
        const hashed = await bcrypt.hash(admin.pwd, SALT_ROUNDS);
        await pool.query('UPDATE admin SET pwd = ? WHERE admin_id = ?', [hashed, admin.admin_id]);
        console.log(`  - 管理员 ${admin.admin_name} 密码已哈希`);
      } else {
        console.log(`  - 管理员 ${admin.admin_name} 跳过（已是哈希或空）`);
      }
    }

    const [readers] = await pool.query('SELECT reader_id, r_name, pwd FROM reader');
    console.log(`找到 ${readers.length} 个读者账户`);

    let migratedCount = 0;
    for (const reader of readers) {
      if (reader.pwd && reader.pwd.length < 40) {
        const hashed = await bcrypt.hash(reader.pwd, SALT_ROUNDS);
        await pool.query('UPDATE reader SET pwd = ? WHERE reader_id = ?', [hashed, reader.reader_id]);
        migratedCount++;
      }
    }
    console.log(`  - ${migratedCount} 个读者密码已哈希`);

    console.log('\n迁移完成！');
  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migratePasswords();
