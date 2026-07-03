-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: book_borrow
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Current Database: `book_borrow`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `book_borrow` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `book_borrow`;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` int NOT NULL AUTO_INCREMENT COMMENT '管理员自增编号',
  `admin_name` varchar(20) NOT NULL COMMENT '管理员姓名',
  `pwd` varchar(32) NOT NULL COMMENT '登录密码',
  `phone` varchar(11) DEFAULT NULL COMMENT '联系手机号',
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统管理员信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (1,'admin','123456','13800138000'),(2,'admin123','123456','13900139000');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `book_id` varchar(15) NOT NULL COMMENT '图书唯一编号',
  `book_name` varchar(100) NOT NULL COMMENT '图书名称',
  `author` varchar(50) NOT NULL COMMENT '作者',
  `press` varchar(50) DEFAULT NULL COMMENT '出版社',
  `pub_date` date DEFAULT NULL COMMENT '出版日期',
  `price` decimal(8,2) DEFAULT NULL COMMENT '图书单价',
  `stock` int NOT NULL DEFAULT '0' COMMENT '当前库存数量',
  `cate_id` int DEFAULT NULL COMMENT '所属分类编号',
  PRIMARY KEY (`book_id`),
  KEY `cate_id` (`cate_id`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`cate_id`) REFERENCES `category` (`cate_id`),
  CONSTRAINT `ck_stock` CHECK ((`stock` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES ('BK001','MySQL数据库实战','李明','机械工业出版社','2024-02-10',59.80,12,1),('BK002','百年孤独','马尔克斯','南海出版社','2018-05-20',42.50,7,2),('BK003','宇宙简史','霍金','中信出版社','2020-01-15',35.00,8,3);
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow`
--

DROP TABLE IF EXISTS `borrow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow` (
  `borrow_id` int NOT NULL AUTO_INCREMENT COMMENT '借阅流水ID',
  `book_id` varchar(15) NOT NULL COMMENT '图书编号',
  `reader_id` varchar(12) NOT NULL COMMENT '读者学号',
  `borrow_time` date NOT NULL COMMENT '借书日期',
  `return_time` date DEFAULT NULL COMMENT '还书日期，未还为空',
  `over_day` int DEFAULT '0' COMMENT '逾期天数',
  `is_back` tinyint DEFAULT '0' COMMENT '归还状态：0未还 1已还',
  PRIMARY KEY (`borrow_id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`book_id`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`reader_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书借阅记录';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
INSERT INTO `borrow` VALUES (1,'BK001','2026001','2026-05-20','2026-06-28',10,1),(2,'BK002','2026002','2026-06-01','2026-07-01',0,1),(3,'BK001','2026001','2026-07-01','2026-07-01',0,1),(4,'BK001','2026002','2026-07-01','2026-07-01',0,1),(5,'BK001','2026001','2026-07-01','2026-07-01',0,1),(6,'BK001','2026001','2026-07-01','2026-07-01',0,1);
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `tri_return_book` AFTER UPDATE ON `borrow` FOR EACH ROW BEGIN
    -- 状态从未还(0)改为已还(1)时，图书库存+1
    IF NEW.is_back = 1 AND OLD.is_back = 0 THEN
        UPDATE book SET stock = stock + 1 WHERE book_id = NEW.book_id;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `cate_id` int NOT NULL AUTO_INCREMENT COMMENT '分类编号',
  `cate_name` varchar(30) NOT NULL COMMENT '图书分类名称',
  PRIMARY KEY (`cate_id`),
  UNIQUE KEY `cate_name` (`cate_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图书分类';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (4,'历史传记'),(2,'文学小说'),(3,'科普读物'),(1,'计算机技术');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reader`
--

DROP TABLE IF EXISTS `reader`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reader` (
  `reader_id` varchar(12) NOT NULL COMMENT '读者学号（主键）',
  `r_name` varchar(20) NOT NULL COMMENT '读者姓名',
  `class` varchar(30) NOT NULL COMMENT '所在班级',
  `phone` varchar(11) DEFAULT NULL COMMENT '读者电话',
  `max_book` tinyint DEFAULT '5' COMMENT '最多可借阅图书数量',
  `status` tinyint DEFAULT '1' COMMENT '账户状态：1正常 0禁用',
  `pwd` varchar(32) NOT NULL DEFAULT '123456' COMMENT '登录密码',
  PRIMARY KEY (`reader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='学生读者信息';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reader`
--

LOCK TABLES `reader` WRITE;
/*!40000 ALTER TABLE `reader` DISABLE KEYS */;
INSERT INTO `reader` VALUES ('2026001','乐','25计科5班','13838700000',5,1,'123456'),('2026002','祚','25计科5班','13838700001',5,1,'123456'),('2026003','裴','2526计科5班','13838700002',5,1,'123456');
/*!40000 ALTER TABLE `reader` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_borrow_info`
--

DROP TABLE IF EXISTS `v_borrow_info`;
/*!50001 DROP VIEW IF EXISTS `v_borrow_info`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_borrow_info` AS SELECT 
 1 AS `借阅流水号`,
 1 AS `图书名称`,
 1 AS `读者姓名`,
 1 AS `班级`,
 1 AS `借书日期`,
 1 AS `逾期天数`*/;
SET character_set_client = @saved_cs_client;

--
-- Current Database: `book_borrow`
--

USE `book_borrow`;

--
-- Final view structure for view `v_borrow_info`
--

/*!50001 DROP VIEW IF EXISTS `v_borrow_info`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_borrow_info` AS select `b`.`borrow_id` AS `借阅流水号`,`bo`.`book_name` AS `图书名称`,`r`.`r_name` AS `读者姓名`,`r`.`class` AS `班级`,`b`.`borrow_time` AS `借书日期`,`b`.`over_day` AS `逾期天数` from ((`borrow` `b` join `book` `bo` on((`b`.`book_id` = `bo`.`book_id`))) join `reader` `r` on((`b`.`reader_id` = `r`.`reader_id`))) where (`b`.`is_back` = 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-01 20:31:04
