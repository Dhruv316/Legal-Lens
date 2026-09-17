# Amazon Scraper Backend 🛒

A Flask-based backend application that intelligently scrapes Amazon product data, categorizes products using Google's Gemini AI, and tracks seller-customer interactions to generate activity heatmaps.

## 📋 Features

* **AI-Powered Routing:** Uses Google Gemini to analyze URLs and route them to category-specific scrapers (Books, Electronics, Food, Skincare).
* **Intelligent Scraping:** Custom scrapers for different product types to extract specific metadata.
* **Seller Analytics:** Tracks customer scraping activity to generate geospatial heatmaps for sellers.
* **Media Storage:** Downloads and stores product images directly in the database as BLOBs.
* **Role-Based Access:** Distinct workflows for `customer` and `seller` accounts.

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

* **Python:** 3.8+
* **Database:** MySQL 8.0+
* **Cloud API:** Google Cloud Platform account with **Generative AI API** enabled.

---

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Setup
Log in to your MySQL instance and execute the schema file.

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
source database_schema.sql
```
*Note: Ensure you increase the `max_allowed_packet` in MySQL configuration to handle image BLOBs (see Troubleshooting).*

### 3. Configure Application
Open `app.py` and update the configuration sections:

```python
# MySQL Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'your_mysql_username',
    'password': 'your_mysql_password',
    'database': 'amazon_scraper_db'
}

# Google API Key (for Gemini AI)
GOOGLE_API_KEY = 'your_gcp_api_key_here'
```

### 4. Run the Application
```bash
python app.py
```
The server will start at `http://localhost:5000`.

---

## 📂 Project Structure

```text
project/
│
├── app.py              # Main Flask application & API routes
├── amazon.py           # Default/Generic scraper
├── book.py             # Book-specific scraper
├── electric.py         # Electronics scraper
├── food.py             # Food products scraper
├── skincare.py         # Skincare products scraper
├── database_schema.sql # MySQL database schema
├── requirements.txt    # Python dependencies
└── README.md           # Documentation
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/signup` | Register new user | `{"username": "user", "password": "pw", "role": "seller"}` |
| `POST` | `/api/login` | Login user | `{"username": "user", "password": "pw"}` |
| `POST` | `/api/logout` | Logout user | N/A |

### Product Scraping

**POST** `/api/scrape`
Scrapes a product. If a **Customer** scrapes a product owned by a **Seller**, a heatmap entry is generated.

**Payload:**
```json
{
  "url": "[https://www.amazon.com/dp/B07G5829G9](https://www.amazon.com/dp/B07G5829G9)"
}
```

**Response:**
```json
{
  "message": "Product scraped and stored successfully",
  "product_id": 123,
  "asin": "B07G5829G9",
  "title": "Product Title",
  "images_stored": 5,
  "is_update": false
}
```

### Seller Analytics

**GET** `/api/seller/activity`
Returns a log of who is scraping the seller's products.

**GET** `/api/seller/heatmap`
Returns aggregated location data for scraping activities.

**Response:**
```json
{
  "heatmap_data": [
    {
      "location": "Mumbai, Maharashtra, India",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "scrape_count": 15,
      "last_scrape": "2024-01-15T14:30:00"
    }
  ],
  "total_locations": 1,
  "total_scrapes": 15
}
```

---

## 🔄 How It Works

### 1. The Scraping Pipeline
1.  **Submission:** User submits an Amazon URL.
2.  **AI Analysis:** The **AI Router** sends the URL to Google Gemini to determine the category (Book, Food, Skincare, Electric, or Default).
3.  **Extraction:** The appropriate Python scraper script is executed.
4.  **Storage:**
    * **If ASIN exists:** Update product details.
    * **If New:** Create new entry (Current user becomes the **Owner/Seller**).
    * Images are downloaded and stored as BLOBs.

### 2. Heatmap & Activity Logic
The system tracks interest based on User Roles:

* **Customer scrapes Seller's Product:**
    * **Log:** Created in `SellerActivity`.
    * **Data:** Seller ID (Owner), Customer ID (Scraper), Location (via IP).
    * **Result:** Appears on Seller's Heatmap.
* **Seller scrapes Own Product:**
    * **Log:** Created with `customer_id: NULL`.
    * **Result:** Administrative log, does not affect heatmap intensity.
* **Seller scrapes Other Seller's Product:**
    * Treated as a customer scrape (Competitor tracking).

---

## 🗄️ Database Schema

* **Users:** Stores credentials and roles (`customer` vs `seller`).
* **Products:** Stores ASIN, metadata, and the `user_id` of the seller who first added it.
* **Images:** Stores image binaries (`LONGBLOB`) linked to products.
* **SellerActivity:** Connects Sellers, Customers, and Locations (Lat/Long) to track product interest.

---

## 📊 Testing Guide

You can test the full flow using `curl` commands.

**1. Create Accounts**
```bash
# Create Seller
curl -X POST http://localhost:5000/api/signup -H "Content-Type: application/json" -d '{"username":"seller1","password":"123","role":"seller"}'

# Create Customer
curl -X POST http://localhost:5000/api/signup -H "Content-Type: application/json" -d '{"username":"cust1","password":"123","role":"customer"}'
```

**2. Seller Adds Product**
```bash
# Login Seller
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"seller1","password":"123"}' -c seller_cookies.txt

# Scrape (Seller becomes owner)
curl -X POST http://localhost:5000/api/scrape -H "Content-Type: application/json" -b seller_cookies.txt -d '{"url":"[https://www.amazon.com/dp/B07G5829G9](https://www.amazon.com/dp/B07G5829G9)"}'
```

**3. Customer Generates Heatmap Data**
```bash
# Login Customer
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"cust1","password":"123"}' -c cust_cookies.txt

# Scrape same product
curl -X POST http://localhost:5000/api/scrape -H "Content-Type: application/json" -b cust_cookies.txt -d '{"url":"[https://www.amazon.com/dp/B07G5829G9](https://www.amazon.com/dp/B07G5829G9)"}'
```

---

## 🐛 Troubleshooting

* **Image Storage Fails:**
    MySQL default packet size is often too small for images. Run this in MySQL:
    ```sql
    SET GLOBAL max_allowed_packet=67108864; -- Sets limit to 64MB
    ```
* **Location Tracking Issues:**
    The system uses `ipapi.co` (Free tier: 1000 req/day). Localhost (`127.0.0.1`) will not generate a location. Test with a deployed version or mock the IP.
* **AI Router Fails:**
    Ensure your Google Cloud Project has the **Generative AI API** enabled and quotas are not exceeded.

---

## 📈 Future Roadmap

* [ ] JWT Authentication implementation.
* [ ] Rate Limiting and Proxy rotation for scraping.
* [ ] Redis caching for frequent product lookups.
* [ ] Docker containerization.
* [ ] Swagger API Documentation.

---

## 📝 License

MIT License - Feel free to use for your projects!