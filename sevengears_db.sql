-- MySQL dump 10.13  Distrib 9.6.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: sevengears_db
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `appointment_date` date NOT NULL,
  `appointment_time` time(6) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `notes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reminder_sent` bit(1) DEFAULT NULL,
  `service_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('ARRIVED','CANCELLED','COMPLETED','CONFIRMED','NO_SHOW','SCHEDULED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  `vehicle_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrlbb09f329sfsmftrh7y0yxtk` (`customer_id`),
  KEY `FKalpncq8pxtwld2wmgw4sxct70` (`vehicle_id`),
  CONSTRAINT `FKalpncq8pxtwld2wmgw4sxct70` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`),
  CONSTRAINT `FKrlbb09f329sfsmftrh7y0yxtk` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (1,'2026-05-14','09:00:00.000000','2026-05-09 17:56:40.599986','',_binary '\0','AC Repair','SCHEDULED',2,2),(2,'2026-05-11','11:00:00.000000','2026-05-09 18:10:34.830408','',_binary '\0','Battery','SCHEDULED',10,10);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `executed_at` datetime(6) DEFAULT NULL,
  `message_template` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('COMPLETED','DRAFT','FAILED','RUNNING') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_segment` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_failed` int DEFAULT NULL,
  `total_sent` int DEFAULT NULL,
  `total_targeted` int DEFAULT NULL,
  `type` enum('BIRTHDAY','FESTIVAL','FOLLOW_UP','INSURANCE_RENEWAL','PROMOTIONAL','PUC_RENEWAL','REENGAGEMENT','SERVICE_DUE') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
INSERT INTO `campaigns` VALUES (1,'2026-05-09 17:50:15.936910','2026-05-09 17:50:21.797937','🪔 *Warm Festival Wishes!*\n\nDear {{name}},\n\nThe team at *7Gears Motors* wishes you and your family a joyful celebration! 🎊\n\nEnjoy *Free Car Wash* with any service this festive season.\n\n📞 +91 78260 47847 | Selaiyur, Chennai','🪔 Festival Greetings','COMPLETED','AUTO',0,9,9,'FESTIVAL'),(2,'2026-05-09 18:11:52.259218','2026-05-09 18:12:04.078092','🔧 *Special Offer — 7Gears Motors*\n\nHello {{name}},\n\nThis month only: *₹499 All-Inclusive Basic Service* for your vehicle {{vehicle}}!\n\nIncludes oil change + filter + 20-point inspection.\n\n📞 Book: +91 78260 47847','🎁 Promotional Offer','COMPLETED','AUTO',0,10,10,'PROMOTIONAL');
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `anniversary_date` date DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `puc_expiry` date DEFAULT NULL,
  `service_reminder_enabled` bit(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKm3iom37efaxd5eucmxjqqcbe9` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Thiruvanmyur','2026-05-09 15:00:08.925065','tshobana1@gmail.com','Bharath','9840203178',NULL,NULL,NULL,NULL,NULL),(2,'Porur','2026-05-09 15:02:22.522672','tshobana1@gmail.com','Shobana','8056018813',NULL,NULL,NULL,NULL,NULL),(3,'Chennai','2026-05-09 15:05:07.264637','rajesh@example.com','Rajesh Kumar','9876543210',NULL,NULL,NULL,NULL,NULL),(4,'Kiran Enclave Porur','2026-05-09 15:59:19.103969','atarunkumar1@gmail.com','Arun Kumar','9344042498',NULL,NULL,NULL,NULL,NULL),(5,'Tambaram','2026-05-09 16:02:22.538700','tshobana1@gmail.com','Sakthis','9698535723',NULL,NULL,NULL,NULL,NULL),(6,'Selaiyur Tambaram','2026-05-09 16:06:03.962262','sevengearsmotors@gmail.com','Srithar','8939267303',NULL,NULL,NULL,NULL,NULL),(7,'Kalpatru','2026-05-09 17:04:04.932634','anusha@happizo.com','Anusha','9360900042',NULL,NULL,NULL,NULL,NULL),(8,'Kalpatru','2026-05-09 17:15:05.717960','tshobana1@gmail.com','Sunil Vassan','9962808966',NULL,NULL,NULL,NULL,NULL),(9,'Kalpatru, Thiruvanmyur, Chennai','2026-05-09 17:29:51.660005','tshobana1@gmail.com','Boominathan','9840187479',NULL,NULL,NULL,NULL,NULL),(10,'','2026-05-09 17:59:48.154119','','Kumar','9916969557',NULL,NULL,NULL,NULL,_binary '');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyalty_accounts`
--

DROP TABLE IF EXISTS `loyalty_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loyalty_accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `points` int NOT NULL,
  `tier` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_earned` int DEFAULT NULL,
  `total_redeemed` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhxexuurfl7qha9safpjpcyccp` (`customer_id`),
  CONSTRAINT `FK1sbg0755loj68eucv8rxu4pao` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyalty_accounts`
--

LOCK TABLES `loyalty_accounts` WRITE;
/*!40000 ALTER TABLE `loyalty_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyalty_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_feedback`
--

DROP TABLE IF EXISTS `service_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_feedback` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) DEFAULT NULL,
  `rating` int NOT NULL,
  `service_job_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpvki523koj6sasg7r2j6l2b7o` (`service_job_id`),
  CONSTRAINT `FKj439los61xp3j8m4feeib51e` FOREIGN KEY (`service_job_id`) REFERENCES `service_jobs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_feedback`
--

LOCK TABLES `service_feedback` WRITE;
/*!40000 ALTER TABLE `service_feedback` DISABLE KEYS */;
INSERT INTO `service_feedback` VALUES (1,'','2026-05-09 18:48:17.913988',5,11);
/*!40000 ALTER TABLE `service_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_images`
--

DROP TABLE IF EXISTS `service_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint DEFAULT NULL,
  `image_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` datetime(6) DEFAULT NULL,
  `service_job_id` bigint NOT NULL,
  `thumbnail_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfftmxoivbd1o8vu963keobwnr` (`service_job_id`),
  CONSTRAINT `FKfftmxoivbd1o8vu963keobwnr` FOREIGN KEY (`service_job_id`) REFERENCES `service_jobs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_images`
--

LOCK TABLES `service_images` WRITE;
/*!40000 ALTER TABLE `service_images` DISABLE KEYS */;
INSERT INTO `service_images` VALUES (1,'image/png','3_BEFORE_2229cf6d-29da-4703-b234-131cfec342c0.png',631301,'BEFORE','Screenshot 2026-05-01 at 12.19.48 PM.png','2026-05-09 19:18:12.631474',3,NULL),(2,'image/png','3_BEFORE_2f87b9c0-621a-4766-b95f-ebd83eeedf61.png',631301,'BEFORE','Screenshot 2026-05-01 at 12.19.48 PM.png','2026-05-09 19:18:20.593463',3,NULL),(3,'image/png','3_BEFORE_2d039bd8-dcc0-4941-896d-4e256bc5270e.png',290139,'BEFORE','Screenshot 2026-05-02 at 4.30.57 PM.png','2026-05-09 19:18:20.619510',3,NULL),(4,'image/png','3_BEFORE_efbe82ae-05b0-410a-afe4-579ef25dc612.png',290139,'BEFORE','Screenshot 2026-05-02 at 4.30.57 PM.png','2026-05-09 19:18:46.650444',3,NULL),(5,'image/png','12_BEFORE_e46f9a72-2989-400d-9658-836dfc054429.png',290139,'BEFORE','Screenshot 2026-05-02 at 4.30.57 PM.png','2026-05-10 13:55:09.891212',12,NULL),(6,'image/png','12_BEFORE_85af4bb7-5127-4680-81d2-6af0fe31129d.png',290139,'BEFORE','Screenshot 2026-05-02 at 4.30.57 PM.png','2026-05-10 13:57:31.345743',12,'thumb_12_BEFORE_82f67cd9-7eb9-4899-9189-3aa8476cf0bd.jpg'),(7,'image/png','12_AFTER_376faba0-0b7d-443d-a355-4109177b6d8d.png',247731,'AFTER','Screenshot 2026-05-07 at 1.25.20 AM.png','2026-05-10 13:57:38.430319',12,'thumb_12_AFTER_712352c8-1d62-402f-a9f9-b91755080e69.jpg'),(8,'image/png','12_BEFORE_bf67fad0-7418-4724-854a-e5f79e6a67fa.png',290139,'BEFORE','Screenshot 2026-05-02 at 4.30.57 PM.png','2026-05-10 14:01:49.381831',12,'thumb_12_BEFORE_5be7cd45-87f5-40dd-8e23-f06ba85248ba.jpg');
/*!40000 ALTER TABLE `service_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_jobs`
--

DROP TABLE IF EXISTS `service_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actual_cost` decimal(10,2) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `delivered_at` datetime(6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `estimated_completion` datetime(6) DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT NULL,
  `job_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `odometer_reading` int DEFAULT NULL,
  `received_at` datetime(6) DEFAULT NULL,
  `service_advisor` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `service_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('AWAITING_APPROVAL','CANCELLED','DELIVERED','INSPECTING','IN_PROGRESS','QUALITY_CHECK','READY_FOR_PICKUP','RECEIVED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `technician` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9yq92dguh2v19vvg52woxcuvy` (`job_number`),
  KEY `FKedvu4qn3eivkvl1i48ipwuele` (`vehicle_id`),
  CONSTRAINT `FKedvu4qn3eivkvl1i48ipwuele` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_jobs`
--

LOCK TABLES `service_jobs` WRITE;
/*!40000 ALTER TABLE `service_jobs` DISABLE KEYS */;
INSERT INTO `service_jobs` VALUES (1,NULL,NULL,'2026-05-09 15:01:12.014533',NULL,'hello','2026-05-16 15:01:00.000000',NULL,'7GM00001','',NULL,'2026-05-09 15:01:12.014548','','Periodic Service','IN_PROGRESS','',1),(2,NULL,'2026-05-09 15:04:00.155454','2026-05-09 15:03:34.213357','2026-05-09 15:04:02.315631','AC fault','2026-05-09 17:05:00.000000',2500.00,'7GM00002','Check properly',NULL,'2026-05-09 15:03:34.213378','Vivek','AC Repair','DELIVERED','Vivek',2),(3,NULL,NULL,'2026-05-09 15:05:07.336357',NULL,'Full service check',NULL,3500.00,'7GM00003',NULL,NULL,'2026-05-09 15:05:07.336367','Suresh','Periodic Service','AWAITING_APPROVAL',NULL,1),(4,NULL,NULL,'2026-05-09 16:01:05.060902',NULL,'Denting and Painting services','2026-05-09 16:00:00.000000',10000.00,'7GM00004','Delivery immediately',NULL,'2026-05-09 16:01:05.060914','AK','Denting & Painting','INSPECTING','Srithar',4),(5,NULL,NULL,'2026-05-09 16:03:37.546722',NULL,'Problem with Break','2026-05-22 16:03:00.000000',30000.00,'7GM00005','Delivery today',12000,'2026-05-09 16:03:37.546748','AK','Brake Service','IN_PROGRESS','AK',5),(6,NULL,NULL,'2026-05-09 16:04:38.816649',NULL,'problem','2026-05-23 16:04:00.000000',50000.00,'7GM00006','Check first',3499,'2026-05-09 16:04:38.816684','Shobana','Windshield','INSPECTING','Shobana',2),(7,NULL,'2026-05-09 16:07:32.155258','2026-05-09 16:07:09.762000','2026-05-09 16:49:59.174604','hello','2026-05-22 16:06:00.000000',45000.00,'7GM00007','Problem with Suspension replace it',45458,'2026-05-09 16:07:09.762027','Vivek','Suspension','DELIVERED','Srithar',6),(8,NULL,NULL,'2026-05-09 17:05:15.339589',NULL,'','2026-05-15 17:05:00.000000',NULL,'7GM00008','Change Clutch',NULL,'2026-05-09 17:05:15.339623','AK','Clutch Work','RECEIVED','AK',7),(9,NULL,NULL,'2026-05-09 17:16:11.519465',NULL,'','2026-05-14 17:16:00.000000',3000.00,'7GM00009','Car wash detailing',34300,'2026-05-09 17:16:11.519523','AK','Car Spa','RECEIVED','AK',8),(10,NULL,NULL,'2026-05-09 17:32:16.885940',NULL,'AC Repair','2026-05-09 17:32:00.000000',3000.00,'7GM00010','Check overall',234299,'2026-05-09 17:32:16.885954','Srithar','AC Repair','INSPECTING','Srithar',9),(11,NULL,'2026-05-09 18:47:18.452361','2026-05-09 18:01:33.980299','2026-05-09 18:48:06.776401','','2026-05-14 18:01:00.000000',3000.00,'7GM00011','test',24234,'2026-05-09 18:01:33.980312','AK','Full Inspection','DELIVERED','AK',10),(12,NULL,'2026-05-09 18:08:22.946217','2026-05-09 18:07:09.149365','2026-05-10 14:13:05.889925','',NULL,NULL,'7GM00012','',NULL,'2026-05-09 18:07:09.149397','','Tire Care','DELIVERED','',2);
/*!40000 ALTER TABLE `service_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_updates`
--

DROP TABLE IF EXISTS `service_updates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_updates` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('AWAITING_APPROVAL','CANCELLED','DELIVERED','INSPECTING','IN_PROGRESS','QUALITY_CHECK','READY_FOR_PICKUP','RECEIVED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_sent` bit(1) DEFAULT NULL,
  `service_job_id` bigint NOT NULL,
  `whatsapp_sid` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKoygo2lqa8w144xkb7ky80cbl9` (`service_job_id`),
  CONSTRAINT `FKoygo2lqa8w144xkb7ky80cbl9` FOREIGN KEY (`service_job_id`) REFERENCES `service_jobs` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_updates`
--

LOCK TABLES `service_updates` WRITE;
/*!40000 ALTER TABLE `service_updates` DISABLE KEYS */;
INSERT INTO `service_updates` VALUES (1,'2026-05-09 15:01:12.018065','Vehicle received at 7Gears Motors. Job #7GM00001 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '\0',1,NULL),(2,'2026-05-09 15:01:39.235240','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '\0',1,NULL),(3,'2026-05-09 15:01:52.911157','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '\0',1,NULL),(4,'2026-05-09 15:03:34.216616','Vehicle received at 7Gears Motors. Job #7GM00002 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '\0',2,NULL),(5,'2026-05-09 15:03:39.940276','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '\0',2,NULL),(6,'2026-05-09 15:03:58.024017','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '\0',2,NULL),(7,'2026-05-09 15:03:59.086938','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',2,'SM6de06342d24b6f048b8753085dad02f3'),(8,'2026-05-09 15:03:59.620602','Work complete! Your vehicle is undergoing quality check.','7Gears Team','QUALITY_CHECK',_binary '\0',2,NULL),(9,'2026-05-09 15:04:00.156083','Your vehicle is ready for pickup. Please visit us at your convenience.','7Gears Team','READY_FOR_PICKUP',_binary '\0',2,NULL),(10,'2026-05-09 15:04:02.315935','Vehicle delivered. Thank you for choosing 7Gears Motors!','7Gears Team','DELIVERED',_binary '\0',2,NULL),(11,'2026-05-09 15:04:12.050023','hello','7Gears Team',NULL,_binary '\0',2,NULL),(12,'2026-05-09 15:05:07.337463','Vehicle received at 7Gears Motors. Job #7GM00003 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '\0',3,NULL),(13,'2026-05-09 15:09:10.964032','hi','7Gears Team',NULL,_binary '\0',1,NULL),(14,'2026-05-09 15:13:05.323155','Test message from curl','7Gears Team',NULL,_binary '\0',3,NULL),(15,'2026-05-09 15:17:40.374622','Proxy test message','7Gears Team',NULL,_binary '\0',3,NULL),(16,'2026-05-09 15:20:26.077658','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '\0',3,NULL),(17,'2026-05-09 15:20:38.253719','hi','7Gears Team',NULL,_binary '\0',2,NULL),(18,'2026-05-09 15:41:33.629833','hi','7Gears Team',NULL,_binary '',2,'SM861b02619f3352d7bd373909fa4e694f'),(19,'2026-05-09 15:44:24.636244','hi','7Gears Team',NULL,_binary '',2,'SMde2d905cd4208aa8e02526709d16f8e4'),(20,'2026-05-09 15:57:23.269870','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '',3,'SM7839c51a1058548bad4a17160c54f5cf'),(21,'2026-05-09 16:01:05.063694','Vehicle received at 7Gears Motors. Job #7GM00004 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',4,'SM57ff6b20a5802d05136141ef5d9d0e50'),(22,'2026-05-09 16:03:37.550110','Vehicle received at 7Gears Motors. Job #7GM00005 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',5,'SM097c6303250ec48c5d67a4c0eb7c2ffe'),(23,'2026-05-09 16:03:44.024716','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',5,'SM1569b7f3355d8a92572ce90aadf442c9'),(24,'2026-05-09 16:03:50.003205','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '',5,'SM4f28be67a66ed34eb55078de8bd89d8f'),(25,'2026-05-09 16:04:38.819131','Vehicle received at 7Gears Motors. Job #7GM00006 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',6,'SM93739c3cfd3a827c76ca4f4c98248b30'),(26,'2026-05-09 16:07:09.765228','Vehicle received at 7Gears Motors. Job #7GM00007 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',7,'SM8bf03f8713856e7a2dbce7acd6110619'),(27,'2026-05-09 16:07:16.149990','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',7,'SMf5a485d3f607d12989763d0a6aa07d12'),(28,'2026-05-09 16:07:19.510586','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '',7,'SMcef37dd8753aefa56ebd91e8ec30a5ff'),(29,'2026-05-09 16:07:21.738212','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',7,'SM7927aeb13a66f7439c6e3e383ca79c91'),(30,'2026-05-09 16:07:28.349886','Work complete! Your vehicle is undergoing quality check.','7Gears Team','QUALITY_CHECK',_binary '',7,'SM5de9577ec1a3d2ed816f00e117fe61c3'),(31,'2026-05-09 16:07:32.543092','Your vehicle is ready for pickup. Please visit us at your convenience.','7Gears Team','READY_FOR_PICKUP',_binary '',7,'SM71378f193a9bf344cd6206ce8c83d23b'),(32,'2026-05-09 16:23:40.661307','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '\0',6,NULL),(33,'2026-05-09 16:45:03.857077','hi','7Gears Team',NULL,_binary '',2,'3EB03F76009639E7EE2451'),(34,'2026-05-09 16:50:01.262038','Vehicle delivered. Thank you for choosing 7Gears Motors!','7Gears Team','DELIVERED',_binary '',7,'3EB001C6FF2148DACA5375'),(35,'2026-05-09 16:50:40.378258','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',1,'3EB0B3C41558D1A19553E1'),(36,'2026-05-09 16:50:49.354610','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',5,'3EB0F2978CBF3652CD973E'),(37,'2026-05-09 16:50:56.267386','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',4,'3EB0387A284759E38C38F3'),(38,'2026-05-09 17:05:15.343266','Vehicle received at 7Gears Motors. Job #7GM00008 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',8,'3EB0AEAB08183ADF310BC7'),(39,'2026-05-09 17:16:11.522992','Vehicle received at 7Gears Motors. Job #7GM00009 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',9,'3EB08537B5D0B098FF2F64'),(40,'2026-05-09 17:32:16.888262','Vehicle received at 7Gears Motors. Job #7GM00010 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',10,'3EB082BA36ACB8D6B91FB7'),(41,'2026-05-09 17:32:22.762957','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',10,'3EB03323F198D5EE17E997'),(42,'2026-05-09 18:01:33.982722','Vehicle received at 7Gears Motors. Job #7GM00011 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',11,'3EB00FB583E01A1B22A19F'),(43,'2026-05-09 18:02:53.975164','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',11,'3EB0FC115DF0A5871CA147'),(44,'2026-05-09 18:07:09.151933','Vehicle received at 7Gears Motors. Job #7GM00012 created. We will inspect your vehicle shortly.','System','RECEIVED',_binary '',12,'3EB0F7A6F2B36AEC87983F'),(45,'2026-05-09 18:07:29.006652','Your vehicle is being inspected by our expert technician.','7Gears Team','INSPECTING',_binary '',12,'3EB06E4DF82A52F311CF2A'),(46,'2026-05-09 18:07:43.122609','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '',12,'3EB0D31788F7079ED8D2B8'),(47,'2026-05-09 18:07:56.900599','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',12,'3EB076563370E74842133C'),(48,'2026-05-09 18:08:08.502700','Work complete! Your vehicle is undergoing quality check.','7Gears Team','QUALITY_CHECK',_binary '',12,'3EB08489F619ED0E755CC8'),(49,'2026-05-09 18:08:22.984948','Your vehicle is ready for pickup. Please visit us at your convenience.','7Gears Team','READY_FOR_PICKUP',_binary '',12,'3EB04A04EAF8003791E1D4'),(50,'2026-05-09 18:47:15.400146','Inspection complete. Please approve the service estimate to proceed.','7Gears Team','AWAITING_APPROVAL',_binary '',11,'3EB09E27B732B50947C9AD'),(51,'2026-05-09 18:47:17.438874','Work has started on your vehicle. Our technicians are on it!','7Gears Team','IN_PROGRESS',_binary '',11,'3EB0EF5015233D28071A1D'),(52,'2026-05-09 18:47:17.955021','Work complete! Your vehicle is undergoing quality check.','7Gears Team','QUALITY_CHECK',_binary '',11,'3EB0BD9FBCDA9CE1DFCE7A'),(53,'2026-05-09 18:47:18.469464','Your vehicle is ready for pickup. Please visit us at your convenience.','7Gears Team','READY_FOR_PICKUP',_binary '',11,'3EB0E13D04A35D702C1EB5'),(54,'2026-05-09 18:48:06.815818','Vehicle delivered. Thank you for choosing 7Gears Motors!','7Gears Team','DELIVERED',_binary '',11,'3EB0F6EAB4A6565C8CA01B'),(55,'2026-05-10 14:13:09.450525','Vehicle delivered. Thank you for choosing 7Gears Motors!','7Gears Team','DELIVERED',_binary '',12,'3EB02FC29004951084222F');
/*!40000 ALTER TABLE `service_updates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `color` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `fuel_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `make` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int DEFAULT NULL,
  `customer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf6xfxoc4kprkjkst07tq63y6` (`registration_number`),
  KEY `FKjrosretvs9ih5ybhpsd5qskc3` (`customer_id`),
  CONSTRAINT `FKjrosretvs9ih5ybhpsd5qskc3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,'black','2026-05-09 15:00:50.949124','Petrol','Volkswagon','Vento','TN119922',2016,1),(2,'Silver','2026-05-09 15:02:47.015542','Petrol','Hyndai','i20','TN011111',2020,2),(3,'White','2026-05-09 15:05:07.318553','Petrol','Maruti','Swift','TN01AB1234',2022,1),(4,'White','2026-05-09 16:00:21.259144','Diesel','Honda','Civic','TN 08 9999',2026,4),(5,'Black','2026-05-09 16:03:03.699637','Hybrid','BMW','Q3','TN 67 6767',2025,5),(6,'Red','2026-05-09 16:06:31.697629','CNG','Benz','Q5','TN 77 7777',2020,6),(7,'Orange','2026-05-09 17:04:43.480961','Hybrid','BenZ','Q4','TN 11 1105',2021,7),(8,'Blue','2026-05-09 17:15:39.560886','Petrol','Maruti','Swift','TN 07 5735',2025,8),(9,'White','2026-05-09 17:31:42.357394','Petrol','Volkswegan','Polo','TN 07 BW3319',2026,9),(10,'white','2026-05-09 18:00:47.245135','Diesel','Honda','Amaze','TN 01 4567',2024,10);
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-10 14:59:24
