-- MySQL dump 10.13  Distrib 5.7.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: pickleball_booking
-- ------------------------------------------------------
-- Server version	5.7.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `reference` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `court_id` int(10) unsigned NOT NULL,
  `booking_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `total_price` decimal(8,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','confirmed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmed',
  `payment_method` enum('cash','gcash','maya','gotyme') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_status` enum('unpaid','pending_verification','paid') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_sent_at` timestamp NULL DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookings_reference_unique` (`reference`),
  KEY `bookings_user_id_foreign` (`user_id`),
  KEY `court_date_index` (`court_id`,`booking_date`),
  CONSTRAINT `bookings_court_id_foreign` FOREIGN KEY (`court_id`) REFERENCES `courts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (7,'PB-1IQP1J',2,4,'2026-08-23','16:00:00','17:00:00',500.00,'confirmed','cash','paid',NULL,NULL,NULL,'2026-08-22 17:23:27','2026-08-23 07:05:33'),(8,'PB-VQM3Q6',2,4,'2026-08-23','17:00:00','18:00:00',500.00,'cancelled','gcash','pending_verification','678678678',NULL,NULL,'2026-08-22 17:23:53','2026-08-23 06:54:47'),(9,'PB-MRDKZJ',4,4,'2026-08-23','21:00:00','22:00:00',500.00,'confirmed','cash','unpaid',NULL,NULL,NULL,'2026-08-23 07:33:07','2026-08-23 07:33:07'),(10,'PB-E24Z4E',2,1,'2026-08-23','17:00:00','18:00:00',700.00,'cancelled','gcash','unpaid',NULL,'2026-08-23 08:28:23',NULL,'2026-08-23 08:28:16','2026-08-23 08:29:16'),(11,'PB-JYQ03H',4,1,'2026-08-23','17:00:00','18:00:00',700.00,'confirmed','cash','paid',NULL,'2026-08-23 08:47:35',NULL,'2026-08-23 08:31:41','2026-08-23 08:47:39');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `court_photos`
--

DROP TABLE IF EXISTS `court_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `court_photos` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `court_id` int(10) unsigned NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int(10) unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `court_photos_court_id_foreign` (`court_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `court_photos`
--

LOCK TABLES `court_photos` WRITE;
/*!40000 ALTER TABLE `court_photos` DISABLE KEYS */;
INSERT INTO `court_photos` VALUES (7,1,'court_1_FTh6NaNLA7.jpg',1,'2026-08-23 08:13:50','2026-08-23 08:13:50'),(6,1,'court_1_KXG1k8YkAl.jpg',0,'2026-08-23 08:13:44','2026-08-23 08:13:44');
/*!40000 ALTER TABLE `court_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courts`
--

DROP TABLE IF EXISTS `courts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `surface` enum('indoor','outdoor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'outdoor',
  `hourly_rate` decimal(8,2) NOT NULL DEFAULT '0.00',
  `peak_rate` decimal(8,2) NOT NULL DEFAULT '0.00',
  `open_time` time NOT NULL DEFAULT '07:00:00',
  `close_time` time NOT NULL DEFAULT '22:00:00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courts`
--

LOCK TABLES `courts` WRITE;
/*!40000 ALTER TABLE `courts` DISABLE KEYS */;
INSERT INTO `courts` VALUES (1,'Court A - Indoor Pro','indoor',550.00,700.00,'07:00:00','22:00:00',1,NULL,'2026-08-23 06:53:53'),(2,'Court B - Indoor','indoor',450.00,600.00,'07:00:00','22:00:00',1,NULL,NULL),(3,'Court C - Outdoor','outdoor',350.00,450.00,'06:00:00','21:00:00',0,NULL,'2026-08-22 17:13:44'),(4,'Court D - Covered Court','outdoor',400.00,500.00,'06:00:00','22:00:00',1,NULL,NULL),(5,'Court E - Practice Wall','outdoor',275.00,300.00,'06:00:00','20:00:00',0,'2026-08-22 17:13:42','2026-08-22 17:13:43'),(6,'HAHAHA','outdoor',1500.00,100.00,'07:00:00','22:00:00',1,'2026-08-22 17:25:29','2026-08-22 17:25:29');
/*!40000 ALTER TABLE `courts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (13,'2014_10_12_000000_create_users_table',1),(14,'2014_10_12_100000_create_password_resets_table',1),(15,'2026_08_23_000001_add_api_token_to_users_table',1),(16,'2026_08_23_000002_create_courts_table',1),(17,'2026_08_23_000003_create_bookings_table',1),(18,'2026_08_23_000004_add_role_to_users_table',1),(19,'2026_08_23_000005_add_peak_rate_to_courts_table',1),(20,'2026_08_23_000006_add_payment_fields_to_bookings_table',1),(21,'2026_08_23_000007_add_profile_fields_to_users_table',2),(22,'2026_08_23_000008_create_court_photos_table',3),(23,'2026_08_23_000009_add_reminder_sent_at_to_bookings_table',4);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  KEY `password_resets_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('customer','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `api_token` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_api_token_unique` (`api_token`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@pickleball.com',NULL,NULL,NULL,'admin','$2y$10$vZZawlSkXcboElRrAzxSO.pCa5Dqb0r69ayhGIB1uI.uUNnbfqDmi','DaqGikCryk','FwT1pQ7H9gd7ExUVcekkyMlPpOMoUexsuu6geFHuQ6Ekj5CHs5OjFwnfYzMM','2026-08-22 17:08:50','2026-08-23 08:13:24'),(2,'Demo Customer','customer@pickleball.com','0909090','Culianan Zamboanga City','avatar_2_hhJkUCvw8n.jpg','customer','$2y$10$XlH9w2Bz92/yPAcORLWc2uidyvLhrdpMtFADL4raA6qnJpsGcQMaa','K56Ph3YV5Ivm0eCQOofGoklUtcuc3jBS70BJu11v8rrbGdAJqJ9MXdkt3RvO','Ci5qkGrn4TvLK9mPSCh4EZURx1owTx17MrlxKvwkFg9UdfHNIFGSS3dp8zP3','2026-08-22 17:08:50','2026-08-23 08:40:37'),(4,'Elvin Ramos','elvinramos454@gmail.com','09855290184','Culianan, Zamboanga City\nVSM 1 San Isidro','avatar_4_TPJkYfVwot.png','customer','$2y$10$BsvC81TQ5hJRJLfERE3VIuWtBTlPnPv5PLpLmQqiQ9CH4n2iEICnS','hjich2z97bQHkgTVgJmgpwteSmrVlEAO8V1l6msV0JYUQkx2jvnJmTKWmQKn','9RNA27z1nn2PM6hjw31cwzGtg2rIq96yPt0VnSFYzR304fygQWs1ObYAVnSq','2026-08-23 07:29:51','2026-08-23 08:43:58');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'pickleball_booking'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-23 16:47:57
