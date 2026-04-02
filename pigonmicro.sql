-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Gép: mariadb:3306
-- Létrehozás ideje: 2026. Ápr 02. 16:47
-- Kiszolgáló verziója: 10.6.25-MariaDB-ubu2204
-- PHP verzió: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `pigonmicro`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `chats`
--

CREATE TABLE `chats` (
  `ID` int(11) NOT NULL,
  `type` enum('direct','group') NOT NULL,
  `name` text DEFAULT NULL,
  `creator` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `chat_keys`
--

CREATE TABLE `chat_keys` (
  `keyID` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `pubKey` longtext NOT NULL,
  `encryptedPrivKey` longtext NOT NULL,
  `status` enum('active','retired') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `group_keys`
--

CREATE TABLE `group_keys` (
  `keyId` int(11) NOT NULL,
  `kGuid` text NOT NULL COMMENT 'key identifier, one identifier has multiple records attached',
  `userId` int(11) NOT NULL,
  `creatorId` int(11) NOT NULL COMMENT 'The id of the user so you can get the pubkey part for ecdh to decrypt the key itself',
  `chatId` int(11) NOT NULL,
  `encryptedKey` longtext NOT NULL,
  `status` enum('active','retired') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `messages`
--

CREATE TABLE `messages` (
  `ID` int(11) NOT NULL,
  `chatID` int(11) NOT NULL,
  `senderID` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` longtext NOT NULL COMMENT 'Encrypted message',
  `kGuid` text DEFAULT NULL COMMENT 'Only used for group chats',
  `senderKeyId` int(11) DEFAULT NULL COMMENT 'Only used for private chats',
  `recipientKeyId` int(11) DEFAULT NULL COMMENT 'Only used for private chats',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `messageSpool`
--

CREATE TABLE `messageSpool` (
  `id` int(11) NOT NULL,
  `sender` int(11) NOT NULL,
  `receiver` int(11) NOT NULL,
  `data` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `profile_picture`
--

CREATE TABLE `profile_picture` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `filename` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `session`
--

CREATE TABLE `session` (
  `id` int(11) NOT NULL,
  `userID` int(11) NOT NULL,
  `tokenHash` text NOT NULL,
  `refreshTokenHash` text NOT NULL,
  `tokenExpire` datetime NOT NULL,
  `refreshTokenExpire` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user-chats`
--

CREATE TABLE `user-chats` (
  `cId` int(11) NOT NULL,
  `chatId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `lastRead` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `ID` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `pubKey` longtext DEFAULT NULL,
  `encryptedPrivKey` longtext DEFAULT NULL,
  `masterKey` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `creator` (`creator`);

--
-- A tábla indexei `chat_keys`
--
ALTER TABLE `chat_keys`
  ADD PRIMARY KEY (`keyID`),
  ADD KEY `usr_key` (`userID`);

--
-- A tábla indexei `group_keys`
--
ALTER TABLE `group_keys`
  ADD PRIMARY KEY (`keyId`),
  ADD KEY `usr-gkey` (`userId`),
  ADD KEY `gkey-chat` (`chatId`),
  ADD KEY `guid` (`kGuid`(768));

--
-- A tábla indexei `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`ID`),
  ADD KEY `msg-chat` (`chatID`),
  ADD KEY `msg-user` (`senderID`);

--
-- A tábla indexei `messageSpool`
--
ALTER TABLE `messageSpool`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender-user` (`sender`),
  ADD KEY `receiver-user` (`receiver`);

--
-- A tábla indexei `profile_picture`
--
ALTER TABLE `profile_picture`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usr-pfp` (`userId`);

--
-- A tábla indexei `session`
--
ALTER TABLE `session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tokenHash` (`tokenHash`) USING HASH,
  ADD UNIQUE KEY `refreshTokenHash` (`refreshTokenHash`) USING HASH,
  ADD KEY `userSession` (`userID`);

--
-- A tábla indexei `user-chats`
--
ALTER TABLE `user-chats`
  ADD PRIMARY KEY (`cId`),
  ADD KEY `usr` (`userId`),
  ADD KEY `chat` (`chatId`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`ID`),
  ADD UNIQUE KEY `username` (`username`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `chats`
--
ALTER TABLE `chats`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `chat_keys`
--
ALTER TABLE `chat_keys`
  MODIFY `keyID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `group_keys`
--
ALTER TABLE `group_keys`
  MODIFY `keyId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `messages`
--
ALTER TABLE `messages`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `messageSpool`
--
ALTER TABLE `messageSpool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `profile_picture`
--
ALTER TABLE `profile_picture`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `session`
--
ALTER TABLE `session`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user-chats`
--
ALTER TABLE `user-chats`
  MODIFY `cId` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `chats`
--
ALTER TABLE `chats`
  ADD CONSTRAINT `creator` FOREIGN KEY (`creator`) REFERENCES `users` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `chat_keys`
--
ALTER TABLE `chat_keys`
  ADD CONSTRAINT `usr_key` FOREIGN KEY (`userID`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Megkötések a táblához `group_keys`
--
ALTER TABLE `group_keys`
  ADD CONSTRAINT `gkey-chat` FOREIGN KEY (`chatId`) REFERENCES `chats` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `usr-gkey` FOREIGN KEY (`userId`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Megkötések a táblához `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `msg-chat` FOREIGN KEY (`chatID`) REFERENCES `chats` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `msg-user` FOREIGN KEY (`senderID`) REFERENCES `users` (`ID`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Megkötések a táblához `messageSpool`
--
ALTER TABLE `messageSpool`
  ADD CONSTRAINT `receiver-user` FOREIGN KEY (`receiver`) REFERENCES `users` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `sender-user` FOREIGN KEY (`sender`) REFERENCES `users` (`ID`) ON DELETE CASCADE;

--
-- Megkötések a táblához `profile_picture`
--
ALTER TABLE `profile_picture`
  ADD CONSTRAINT `usr-pfp` FOREIGN KEY (`userId`) REFERENCES `users` (`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `session`
--
ALTER TABLE `session`
  ADD CONSTRAINT `userSession` FOREIGN KEY (`userID`) REFERENCES `users` (`ID`) ON DELETE CASCADE ON UPDATE NO ACTION;

--
-- Megkötések a táblához `user-chats`
--
ALTER TABLE `user-chats`
  ADD CONSTRAINT `chat` FOREIGN KEY (`chatId`) REFERENCES `chats` (`ID`) ON DELETE CASCADE,
  ADD CONSTRAINT `usr` FOREIGN KEY (`userId`) REFERENCES `users` (`ID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
