import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    -- 1. users (no dependencies)
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`ID\` int(11) NOT NULL AUTO_INCREMENT,
      \`username\` varchar(255) NOT NULL,
      \`password\` text NOT NULL,
      \`pubKey\` longtext DEFAULT NULL,
      \`encryptedPrivKey\` longtext DEFAULT NULL,
      \`masterKey\` longtext DEFAULT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`ID\`),
      UNIQUE KEY \`username\` (\`username\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 2. chats (references users)
    CREATE TABLE IF NOT EXISTS \`chats\` (
      \`ID\` int(11) NOT NULL AUTO_INCREMENT,
      \`type\` enum('direct','group') NOT NULL,
      \`name\` text DEFAULT NULL,
      \`creator\` int(11) NOT NULL,
      PRIMARY KEY (\`ID\`),
      KEY \`creator\` (\`creator\`),
      CONSTRAINT \`creator\` FOREIGN KEY (\`creator\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 3. chat_files (references chats)
    CREATE TABLE IF NOT EXISTS \`chat_files\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`uuid\` varchar(255) NOT NULL,
      \`type\` enum('image','video','file','') NOT NULL,
      \`chatId\` int(11) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uuid\` (\`uuid\`),
      KEY \`file_chat\` (\`chatId\`),
      CONSTRAINT \`file_chat\` FOREIGN KEY (\`chatId\`) REFERENCES \`chats\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 4. chat_keys (references users)
    CREATE TABLE IF NOT EXISTS \`chat_keys\` (
      \`keyID\` int(11) NOT NULL AUTO_INCREMENT,
      \`userID\` int(11) DEFAULT NULL,
      \`pubKey\` longtext NOT NULL,
      \`encryptedPrivKey\` longtext NOT NULL,
      \`status\` enum('active','retired') NOT NULL DEFAULT 'active',
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`keyID\`),
      KEY \`usr_key\` (\`userID\`),
      CONSTRAINT \`usr_key\` FOREIGN KEY (\`userID\`) REFERENCES \`users\` (\`ID\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 5. group_keys (references chats and users)
    CREATE TABLE IF NOT EXISTS \`group_keys\` (
      \`keyId\` int(11) NOT NULL AUTO_INCREMENT,
      \`kGuid\` text NOT NULL COMMENT 'key identifier, one identifier has multiple records attached',
      \`userId\` int(11) DEFAULT NULL,
      \`creatorId\` int(11) DEFAULT NULL COMMENT 'The id of the user so you can get the pubkey part for ecdh to decrypt the key itself',
      \`chatId\` int(11) NOT NULL,
      \`encryptedKey\` longtext NOT NULL,
      \`status\` enum('active','retired') NOT NULL DEFAULT 'active',
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`keyId\`),
      KEY \`gkey-chat\` (\`chatId\`),
      KEY \`guid\` (\`kGuid\`(768)),
      KEY \`usr-gkey\` (\`userId\`),
      CONSTRAINT \`gkey-chat\` FOREIGN KEY (\`chatId\`) REFERENCES \`chats\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`usr-gkey\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`ID\`) ON DELETE SET NULL ON UPDATE NO ACTION
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 6. messages (references chats and users)
    CREATE TABLE IF NOT EXISTS \`messages\` (
      \`ID\` int(11) NOT NULL AUTO_INCREMENT,
      \`chatID\` int(11) NOT NULL,
      \`senderID\` int(11) DEFAULT NULL,
      \`type\` varchar(50) NOT NULL,
      \`message\` longtext NOT NULL COMMENT 'Encrypted message',
      \`kGuid\` text DEFAULT NULL COMMENT 'Only used for group chats',
      \`senderKeyId\` int(11) DEFAULT NULL COMMENT 'Only used for private chats',
      \`recipientKeyId\` int(11) DEFAULT NULL COMMENT 'Only used for private chats',
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`ID\`),
      KEY \`msg-chat\` (\`chatID\`),
      KEY \`msg-user\` (\`senderID\`),
      CONSTRAINT \`msg-chat\` FOREIGN KEY (\`chatID\`) REFERENCES \`chats\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`msg-user\` FOREIGN KEY (\`senderID\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE ON UPDATE NO ACTION
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 7. messageSpool (references users)
    CREATE TABLE IF NOT EXISTS \`messageSpool\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`sender\` int(11) NOT NULL,
      \`receiver\` int(11) NOT NULL,
      \`data\` longtext NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`sender-user\` (\`sender\`),
      KEY \`receiver-user\` (\`receiver\`),
      CONSTRAINT \`sender-user\` FOREIGN KEY (\`sender\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE,
      CONSTRAINT \`receiver-user\` FOREIGN KEY (\`receiver\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 8. profile_picture (references users)
    CREATE TABLE IF NOT EXISTS \`profile_picture\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`userId\` int(11) NOT NULL,
      \`filename\` text NOT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`usr-pfp\` (\`userId\`),
      CONSTRAINT \`usr-pfp\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 9. session (references users)
    CREATE TABLE IF NOT EXISTS \`session\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`userID\` int(11) NOT NULL,
      \`tokenHash\` text NOT NULL,
      \`refreshTokenHash\` text NOT NULL,
      \`tokenExpire\` datetime NOT NULL,
      \`refreshTokenExpire\` datetime NOT NULL,
      \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
      \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`tokenHash\` (\`tokenHash\`) USING HASH,
      UNIQUE KEY \`refreshTokenHash\` (\`refreshTokenHash\`) USING HASH,
      KEY \`userSession\` (\`userID\`),
      CONSTRAINT \`userSession\` FOREIGN KEY (\`userID\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE ON UPDATE NO ACTION
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

    -- 10. user-chats (references users and chats)
    CREATE TABLE IF NOT EXISTS \`user-chats\` (
      \`cId\` int(11) NOT NULL AUTO_INCREMENT,
      \`chatId\` int(11) NOT NULL,
      \`userId\` int(11) NOT NULL,
      \`lastRead\` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (\`cId\`),
      KEY \`usr\` (\`userId\`),
      KEY \`chat\` (\`chatId\`),
      CONSTRAINT \`usr\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`ID\`) ON DELETE CASCADE,
      CONSTRAINT \`chat\` FOREIGN KEY (\`chatId\`) REFERENCES \`chats\` (\`ID\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    DROP TABLE IF EXISTS \`user-chats\`;
    DROP TABLE IF EXISTS \`session\`;
    DROP TABLE IF EXISTS \`profile_picture\`;
    DROP TABLE IF EXISTS \`messageSpool\`;
    DROP TABLE IF EXISTS \`messages\`;
    DROP TABLE IF EXISTS \`group_keys\`;
    DROP TABLE IF EXISTS \`chat_keys\`;
    DROP TABLE IF EXISTS \`chat_files\`;
    DROP TABLE IF EXISTS \`chats\`;
    DROP TABLE IF EXISTS \`users\`;
  `);
}